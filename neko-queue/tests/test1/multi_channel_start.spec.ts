import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { QueueTransportInterface } from '../../src/Interfaces.mjs';
import { AmqpTransport } from '../../src/transports/AmqpTransport.mjs';
import { AsyncTransport } from '../../src/transports/AsyncTransport.mjs';
import { AwsSqsTransport } from '../../src/transports/AwsSqsTransport.mjs';
import { AzureServiceBusTransport } from '../../src/transports/AzureServiceBusTransport.mjs';
import { GooglePubSubTransport } from '../../src/transports/GooglePubSubTransport.mjs';
import { MemoryTransport } from '../../src/transports/MemoryTransport.mjs';
import { RedisTransport } from '../../src/transports/RedisTransport.mjs';

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted by Vitest)
// ---------------------------------------------------------------------------

// vi.mock('@azure/service-bus', () => {
//   const mockReceiver = {
//     subscribe: vi.fn(),
//     completeMessage: vi.fn(),
//     abandonMessage: vi.fn(),
//     close: vi.fn().mockResolvedValue(undefined),
//   };
//   const mockClient = {
//     createSender: vi.fn(() => ({ sendMessages: vi.fn(), close: vi.fn() })),
//     createReceiver: vi.fn(() => mockReceiver),
//     close: vi.fn().mockResolvedValue(undefined),
//   };
//   return { ServiceBusClient: vi.fn(() => mockClient) };
// });

// vi.mock('@google-cloud/pubsub', () => {
//   const mockSubscription = {
//     exists: vi.fn().mockResolvedValue([true]),
//     create: vi.fn().mockResolvedValue([]),
//     close: vi.fn().mockResolvedValue(undefined),
//     on: vi.fn(),
//   };
//   const mockTopic = {
//     exists: vi.fn().mockResolvedValue([true]),
//     create: vi.fn().mockResolvedValue([]),
//     publishMessage: vi.fn().mockResolvedValue('msg-id'),
//     flush: vi.fn().mockResolvedValue(undefined),
//   };
//   const mockPubSub = {
//     topic: vi.fn(() => mockTopic),
//     subscription: vi.fn(() => mockSubscription),
//     close: vi.fn().mockResolvedValue(undefined),
//   };
//   return { PubSub: vi.fn(() => mockPubSub) };
// });

// ---------------------------------------------------------------------------
// Transport registry
// ---------------------------------------------------------------------------

/**
 * Each entry describes one transport and how to observe per-channel starts.
 * `perChannelMethod` is the private method that gets called once per channel
 * when startListening iterates the listener map. Transports without such a
 * method (MemoryTransport, AsyncTransport) set it to `null`.
 */
type TransportEntry = {
  name: string;
  createTransport: () => QueueTransportInterface;
  perChannelMethod: string | null;
};

function getTransportsForTesting(): TransportEntry[] {
  const testPrefix = `test:${Date.now()}:${Math.random().toString(36).substring(2, 8)}`;
  return [
    {
      name: 'AmqpTransport',
      createTransport: () =>
        new AmqpTransport({
          url: process.env.RABBITMQ_URI,
          queuePrefix: testPrefix,
          exchange: `${testPrefix}exchange`,
          exchangeType: 'direct',
        }),
      perChannelMethod: 'startConsumer',
    },
    // {
    //   name: 'AzureServiceBusTransport',
    //   createTransport: () =>
    //     new AzureServiceBusTransport({
    //       connectionString:
    //         'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=dGVzdA==',
    //     }),
    //   perChannelMethod: 'startReceiver',
    // },
    // {
    //   name: 'GooglePubSubTransport',
    //   createTransport: () => new GooglePubSubTransport({ projectId: 'test-project' }),
    //   perChannelMethod: 'startSubscription',
    // },
    {
      name: 'RedisTransport',
      createTransport: () =>
        new RedisTransport({
          host: process.env.REDIS_HOST,
          port: 6379,
          keyPrefix: testPrefix,
        }),
      perChannelMethod: 'startChannelProcessing',
    },
    {
      name: 'AwsSqsTransport',
      createTransport: () => new AwsSqsTransport(),
      perChannelMethod: 'startPolling',
    },
    {
      name: 'MemoryTransport',
      createTransport: () => new MemoryTransport({ interval: 60_000 }),
      perChannelMethod: null,
    },
    {
      name: 'AsyncTransport',
      createTransport: () => new AsyncTransport(),
      perChannelMethod: null,
    },
  ];
}

// ---------------------------------------------------------------------------
// Test matrix
// ---------------------------------------------------------------------------

describe.each(getTransportsForTesting())(
  '$name – startListening(queueList)',
  ({ createTransport, perChannelMethod }) => {
    let transport: QueueTransportInterface;

    beforeEach(() => {
      vi.clearAllMocks();
      transport = createTransport();
    });

    afterEach(async () => {
      await transport.stopListening();
    });

    test('resolves without error when no listeners are registered', async () => {
      await expect(transport.startListening([])).resolves.toBeUndefined();
    });

    test('resolves without error when queueList is empty and listeners are registered', async () => {
      await transport.registerListener('channel-a', async () => {});
      await transport.registerListener('channel-b', async () => {});
      await expect(transport.startListening([])).resolves.toBeUndefined();
    });

    test('resolves without error when a non-empty queueList is passed', async () => {
      await transport.registerListener('channel-a', async () => {});
      await transport.registerListener('channel-b', async () => {});
      await expect(transport.startListening(['channel-a'])).resolves.toBeUndefined();
    });

    test('is idempotent – calling startListening twice does not throw', async () => {
      await transport.registerListener('channel-a', async () => {});
      await transport.startListening([]);
      await expect(transport.startListening([])).resolves.toBeUndefined();
    });

    // -----------------------------------------------------------------------
    // Per-channel filtering tests – only for transports that have a
    // dedicated per-channel start method and implement queueList filtering.
    // -----------------------------------------------------------------------
    if (perChannelMethod !== null) {
      describe('channel filtering', () => {
        let channelStartSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
          // Spy on the private per-channel start method and prevent it from
          // running the real implementation (avoids network / polling loops).
          channelStartSpy = vi
            .spyOn(transport as any, perChannelMethod!)
            .mockResolvedValue(undefined);
        });

        test('starts all registered channels when queueList is empty', async () => {
          await transport.registerListener('channel-a', async () => {});
          await transport.registerListener('channel-b', async () => {});
          await transport.startListening([]);

          expect(channelStartSpy).toHaveBeenCalledTimes(2);
        });

        test('starts only the channels included in queueList', async () => {
          await transport.registerListener('channel-a', async () => {});
          await transport.registerListener('channel-b', async () => {});
          await transport.startListening(['channel-a']);

          expect(channelStartSpy).toHaveBeenCalledTimes(1);
          expect(channelStartSpy).toHaveBeenCalledWith('channel-a', expect.anything());
        });

        test('does not start channels absent from queueList', async () => {
          await transport.registerListener('channel-a', async () => {});
          await transport.registerListener('channel-b', async () => {});
          await transport.startListening(['channel-a']);

          const calledChannels: string[] = channelStartSpy.mock.calls.map(
            (args: unknown[]) => args[0] as string
          );
          expect(calledChannels).not.toContain('channel-b');
        });

        test('starts no channels when queueList does not match any registered channel', async () => {
          await transport.registerListener('channel-a', async () => {});
          await transport.startListening(['channel-x']);

          expect(channelStartSpy).toHaveBeenCalledTimes(0);
        });

        test('starts multiple channels when all are listed in queueList', async () => {
          await transport.registerListener('channel-a', async () => {});
          await transport.registerListener('channel-b', async () => {});
          await transport.registerListener('channel-c', async () => {});
          await transport.startListening(['channel-a', 'channel-c']);

          expect(channelStartSpy).toHaveBeenCalledTimes(2);
          const calledChannels: string[] = channelStartSpy.mock.calls.map(
            (args: unknown[]) => args[0] as string
          );
          expect(calledChannels).toContain('channel-a');
          expect(calledChannels).toContain('channel-c');
          expect(calledChannels).not.toContain('channel-b');
        });
      });
    }
  }
);
