import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GooglePubSubTransport } from '../../src/transports/GooglePubSubTransport.mjs';

// Mock @google-cloud/pubsub
vi.mock('@google-cloud/pubsub', () => {
  const mockMessage = {
    id: 'msg-123',
    data: Buffer.from('test message'),
    ack: vi.fn(),
    nack: vi.fn(),
  };

  const mockSubscription = {
    exists: vi.fn().mockResolvedValue([false]),
    create: vi.fn().mockResolvedValue([]),
    close: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
  };

  const mockTopic = {
    exists: vi.fn().mockResolvedValue([false]),
    create: vi.fn().mockResolvedValue([]),
    publishMessage: vi.fn().mockResolvedValue('msg-id'),
    flush: vi.fn().mockResolvedValue(undefined),
  };

  const mockPubSub = {
    topic: vi.fn(() => mockTopic),
    subscription: vi.fn(() => mockSubscription),
    close: vi.fn().mockResolvedValue(undefined),
  };

  return {
    PubSub: vi.fn(() => mockPubSub),
  };
});

describe('GooglePubSubTransport', () => {
  let transport: GooglePubSubTransport;
  let mockPubSub: any;
  let mockTopic: any;
  let mockSubscription: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { PubSub } = await import('@google-cloud/pubsub');
    mockPubSub = new (PubSub as any)();
    mockTopic = mockPubSub.topic();
    mockSubscription = mockPubSub.subscription();

    // Clear the mock calls that happened during setup
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (transport) {
      await transport.stopListening();
    }
  });

  describe('Configuration', () => {
    it('should create transport with default configuration', () => {
      transport = new GooglePubSubTransport();
      expect(transport).toBeInstanceOf(GooglePubSubTransport);
    });

    it('should create transport with project ID', () => {
      transport = new GooglePubSubTransport({
        projectId: 'test-project',
      });
      expect(transport).toBeInstanceOf(GooglePubSubTransport);
    });

    it('should create transport with key filename', () => {
      transport = new GooglePubSubTransport({
        projectId: 'test-project',
        keyFilename: '/path/to/key.json',
      });
      expect(transport).toBeInstanceOf(GooglePubSubTransport);
    });

    it('should create transport with credentials object', () => {
      transport = new GooglePubSubTransport({
        projectId: 'test-project',
        credentials: { client_email: 'test@test.com', private_key: 'key' },
      });
      expect(transport).toBeInstanceOf(GooglePubSubTransport);
    });

    it('should create transport with custom prefixes', () => {
      transport = new GooglePubSubTransport({
        topicPrefix: 'my-app',
        subscriptionPrefix: 'my-app-sub',
      });
      expect(transport).toBeInstanceOf(GooglePubSubTransport);
    });

    it('should use custom error handler', async () => {
      const onError = vi.fn();
      transport = new GooglePubSubTransport({ onError });

      mockTopic.publishMessage.mockRejectedValueOnce(new Error('Publish failed'));

      await expect(transport.dispatch('test-channel', 'test message')).rejects.toThrow();

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          channel: 'test-channel',
          body: 'test message',
        })
      );
    });
  });

  describe('Topic Management', () => {
    it('should create topic if it does not exist', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValueOnce([false]);

      await transport.dispatch('test-channel', 'test message');

      expect(mockPubSub.topic).toHaveBeenCalledWith('neko-queue-test-channel');
      expect(mockTopic.exists).toHaveBeenCalled();
      expect(mockTopic.create).toHaveBeenCalled();
    });

    it('should not create topic if it exists', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValueOnce([true]);

      await transport.dispatch('test-channel', 'test message');

      expect(mockTopic.exists).toHaveBeenCalled();
      expect(mockTopic.create).not.toHaveBeenCalled();
    });

    it('should reuse topic for multiple messages', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValue([true]);

      await transport.dispatch('test-channel', 'message 1');
      await transport.dispatch('test-channel', 'message 2');

      expect(mockPubSub.topic).toHaveBeenCalledTimes(1);
      expect(mockTopic.publishMessage).toHaveBeenCalledTimes(2);
    });

    it('should use custom topic prefix', async () => {
      transport = new GooglePubSubTransport({
        projectId: 'test-project',
        topicPrefix: 'my-app',
      });

      mockTopic.exists.mockResolvedValueOnce([true]);

      await transport.dispatch('test-channel', 'test message');

      expect(mockPubSub.topic).toHaveBeenCalledWith('my-app-test-channel');
    });
  });

  describe('Message Dispatch', () => {
    it('should dispatch message to topic', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValueOnce([true]);

      await transport.dispatch('test-channel', 'test message');

      expect(mockTopic.publishMessage).toHaveBeenCalledWith({
        data: expect.any(Buffer),
      });

      const buffer = mockTopic.publishMessage.mock.calls[0][0].data;
      expect(buffer.toString('utf-8')).toBe('test message');
    });

    it('should dispatch to different channels', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValue([true]);

      await transport.dispatch('channel1', 'message1');
      await transport.dispatch('channel2', 'message2');

      expect(mockPubSub.topic).toHaveBeenCalledWith('neko-queue-channel1');
      expect(mockPubSub.topic).toHaveBeenCalledWith('neko-queue-channel2');
    });

    it('should handle dispatch errors', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValueOnce([true]);
      mockTopic.publishMessage.mockRejectedValueOnce(new Error('Publish failed'));

      await expect(transport.dispatch('test-channel', 'test message')).rejects.toThrow(
        'Publish failed'
      );
    });
  });

  describe('Subscription Management', () => {
    it('should create subscription if it does not exist', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValueOnce([true]);
      mockSubscription.exists.mockResolvedValueOnce([false]);

      await transport.registerListener('test-channel', vi.fn());
      await transport.startListening();

      expect(mockPubSub.subscription).toHaveBeenCalledWith('neko-queue-test-channel');
      expect(mockSubscription.exists).toHaveBeenCalled();
      expect(mockSubscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'neko-queue-test-channel',
          ackDeadlineSeconds: 60,
        })
      );
    });

    it('should not create subscription if it exists', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValueOnce([true]);
      mockSubscription.exists.mockResolvedValueOnce([true]);

      await transport.registerListener('test-channel', vi.fn());
      await transport.startListening();

      expect(mockSubscription.exists).toHaveBeenCalled();
      expect(mockSubscription.create).not.toHaveBeenCalled();
    });

    it('should use custom subscription prefix', async () => {
      transport = new GooglePubSubTransport({
        projectId: 'test-project',
        subscriptionPrefix: 'my-sub',
      });

      mockTopic.exists.mockResolvedValueOnce([true]);
      mockSubscription.exists.mockResolvedValueOnce([true]);

      await transport.registerListener('test-channel', vi.fn());
      await transport.startListening();

      expect(mockPubSub.subscription).toHaveBeenCalledWith('my-sub-test-channel');
    });

    it('should configure subscription with custom settings', async () => {
      transport = new GooglePubSubTransport({
        projectId: 'test-project',
        ackDeadlineSeconds: 120,
        retentionDurationSeconds: 86400,
      });

      mockTopic.exists.mockResolvedValueOnce([true]);
      mockSubscription.exists.mockResolvedValueOnce([false]);

      await transport.registerListener('test-channel', vi.fn());
      await transport.startListening();

      expect(mockSubscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ackDeadlineSeconds: 120,
          messageRetentionDuration: { seconds: 86400 },
        })
      );
    });
  });

  describe('Listener Registration', () => {
    it('should register listener for channel', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });
      const callback = vi.fn().mockResolvedValue(undefined);

      await transport.registerListener('test-channel', callback);

      expect(mockSubscription.on).not.toHaveBeenCalled();
    });

    it('should replace existing listener for same channel', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });
      const callback1 = vi.fn().mockResolvedValue(undefined);
      const callback2 = vi.fn().mockResolvedValue(undefined);

      await transport.registerListener('test-channel', callback1);
      await transport.registerListener('test-channel', callback2);

      mockTopic.exists.mockResolvedValue([true]);
      mockSubscription.exists.mockResolvedValue([true]);

      await transport.startListening();

      const messageHandler = mockSubscription.on.mock.calls.find(
        (call: any) => call[0] === 'message'
      )?.[1];

      const mockMessage = {
        id: 'msg-1',
        data: Buffer.from('test'),
        ack: vi.fn(),
        nack: vi.fn(),
      };

      await messageHandler(mockMessage);

      expect(callback2).toHaveBeenCalled();
      expect(callback1).not.toHaveBeenCalled();
    });

    it('should start subscription immediately if already listening', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValue([true]);
      mockSubscription.exists.mockResolvedValue([true]);

      await transport.startListening();

      const callback = vi.fn().mockResolvedValue(undefined);
      await transport.registerListener('test-channel', callback);

      expect(mockSubscription.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('Message Processing', () => {
    it('should process messages and acknowledge them', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });
      const callback = vi.fn().mockResolvedValue(undefined);

      mockTopic.exists.mockResolvedValue([true]);
      mockSubscription.exists.mockResolvedValue([true]);

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      const messageHandler = mockSubscription.on.mock.calls.find(
        (call: any) => call[0] === 'message'
      )?.[1];

      const mockMessage = {
        id: 'msg-1',
        data: Buffer.from('test message'),
        ack: vi.fn(),
        nack: vi.fn(),
      };

      await messageHandler(mockMessage);

      expect(callback).toHaveBeenCalledWith('test message');
      expect(mockMessage.ack).toHaveBeenCalled();
      expect(mockMessage.nack).not.toHaveBeenCalled();
    });

    it('should nack messages on processing error', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });
      const callback = vi.fn().mockRejectedValue(new Error('Processing failed'));

      mockTopic.exists.mockResolvedValue([true]);
      mockSubscription.exists.mockResolvedValue([true]);

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      const messageHandler = mockSubscription.on.mock.calls.find(
        (call: any) => call[0] === 'message'
      )?.[1];

      const mockMessage = {
        id: 'msg-1',
        data: Buffer.from('test message'),
        ack: vi.fn(),
        nack: vi.fn(),
      };

      await messageHandler(mockMessage);

      expect(callback).toHaveBeenCalledWith('test message');
      expect(mockMessage.ack).not.toHaveBeenCalled();
      expect(mockMessage.nack).toHaveBeenCalled();
    });

    it('should call error handler on processing error', async () => {
      const onError = vi.fn();
      transport = new GooglePubSubTransport({ projectId: 'test-project', onError });
      const callback = vi.fn().mockRejectedValue(new Error('Processing failed'));

      mockTopic.exists.mockResolvedValue([true]);
      mockSubscription.exists.mockResolvedValue([true]);

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      const messageHandler = mockSubscription.on.mock.calls.find(
        (call: any) => call[0] === 'message'
      )?.[1];

      const mockMessage = {
        id: 'msg-1',
        data: Buffer.from('test message'),
        ack: vi.fn(),
        nack: vi.fn(),
      };

      await messageHandler(mockMessage);

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          channel: 'test-channel',
          messageId: 'msg-1',
          body: 'test message',
        })
      );
    });

    it('should handle subscription errors', async () => {
      const onError = vi.fn();
      transport = new GooglePubSubTransport({ projectId: 'test-project', onError });

      mockTopic.exists.mockResolvedValue([true]);
      mockSubscription.exists.mockResolvedValue([true]);

      await transport.registerListener('test-channel', vi.fn());
      await transport.startListening();

      const errorHandler = mockSubscription.on.mock.calls.find(
        (call: any) => call[0] === 'error'
      )?.[1];

      const testError = new Error('Subscription error');
      errorHandler(testError);

      expect(onError).toHaveBeenCalledWith(
        testError,
        expect.objectContaining({
          channel: 'test-channel',
        })
      );
    });
  });

  describe('Lifecycle Management', () => {
    it('should start listening on all registered channels', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValue([true]);
      mockSubscription.exists.mockResolvedValue([true]);

      await transport.registerListener('channel1', vi.fn());
      await transport.registerListener('channel2', vi.fn());
      await transport.startListening();

      expect(mockPubSub.subscription).toHaveBeenCalledWith('neko-queue-channel1');
      expect(mockPubSub.subscription).toHaveBeenCalledWith('neko-queue-channel2');
    });

    it('should not start listening twice', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValue([true]);
      mockSubscription.exists.mockResolvedValue([true]);

      await transport.registerListener('test-channel', vi.fn());
      await transport.startListening();

      const callCount = mockSubscription.on.mock.calls.length;

      await transport.startListening();

      expect(mockSubscription.on.mock.calls.length).toBe(callCount);
    });

    it('should stop listening and close subscriptions', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValue([true]);
      mockSubscription.exists.mockResolvedValue([true]);

      await transport.registerListener('test-channel', vi.fn());
      await transport.startListening();
      await transport.stopListening();

      expect(mockSubscription.close).toHaveBeenCalled();
      expect(mockTopic.flush).toHaveBeenCalled();
      expect(mockPubSub.close).toHaveBeenCalled();
    });

    it('should not stop listening twice', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValue([true]);
      mockSubscription.exists.mockResolvedValue([true]);

      await transport.registerListener('test-channel', vi.fn());
      await transport.startListening();
      await transport.stopListening();

      mockSubscription.close.mockClear();
      mockPubSub.close.mockClear();

      await transport.stopListening();

      expect(mockSubscription.close).not.toHaveBeenCalled();
      expect(mockPubSub.close).not.toHaveBeenCalled();
    });

    it('should handle errors during cleanup', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValue([true]);
      mockSubscription.exists.mockResolvedValue([true]);

      await transport.registerListener('test-channel', vi.fn());
      await transport.startListening();

      mockSubscription.close.mockRejectedValueOnce(new Error('Close failed'));

      await transport.stopListening();

      // Should not throw
      expect(mockSubscription.close).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should handle full message lifecycle', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });
      const processedMessages: string[] = [];

      mockTopic.exists.mockResolvedValue([true]);
      mockSubscription.exists.mockResolvedValue([true]);

      await transport.registerListener('test-channel', async (msg) => {
        processedMessages.push(msg);
      });

      await transport.startListening();

      // Dispatch messages
      await transport.dispatch('test-channel', 'message 1');
      await transport.dispatch('test-channel', 'message 2');

      expect(mockTopic.publishMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple channels concurrently', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValue([true]);
      mockSubscription.exists.mockResolvedValue([true]);

      await transport.registerListener('channel1', vi.fn());
      await transport.registerListener('channel2', vi.fn());
      await transport.startListening();

      await Promise.all([
        transport.dispatch('channel1', 'msg1'),
        transport.dispatch('channel2', 'msg2'),
      ]);

      expect(mockPubSub.topic).toHaveBeenCalledWith('neko-queue-channel1');
      expect(mockPubSub.topic).toHaveBeenCalledWith('neko-queue-channel2');
    });

    it('should handle graceful shutdown', async () => {
      transport = new GooglePubSubTransport({ projectId: 'test-project' });

      mockTopic.exists.mockResolvedValue([true]);
      mockSubscription.exists.mockResolvedValue([true]);

      await transport.registerListener('channel1', vi.fn());
      await transport.registerListener('channel2', vi.fn());
      await transport.startListening();

      await transport.stopListening();

      expect(mockSubscription.close).toHaveBeenCalledTimes(2);
      expect(mockTopic.flush).toHaveBeenCalledTimes(2);
      expect(mockPubSub.close).toHaveBeenCalled();
    });
  });
});
