import { describe, expect, test, beforeEach, vi, afterEach } from 'vitest';
import { AmqpTransport } from '../../src/transports/AmqpTransport.mjs';
import { sleep } from '@devbro/neko-helper';

// Mock amqplib
vi.mock('amqplib', () => {
  const mockChannel = {
    prefetch: vi.fn().mockResolvedValue(undefined),
    assertExchange: vi.fn().mockResolvedValue(undefined),
    assertQueue: vi.fn().mockResolvedValue({ queue: 'test-queue' }),
    bindQueue: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockReturnValue(true),
    sendToQueue: vi.fn().mockReturnValue(true),
    consume: vi.fn().mockResolvedValue({ consumerTag: 'consumer-tag-123' }),
    ack: vi.fn(),
    nack: vi.fn(),
    cancel: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    once: vi.fn(),
  };

  const mockConnection = {
    createChannel: vi.fn().mockResolvedValue(mockChannel),
    close: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
  };

  return {
    connect: vi.fn().mockResolvedValue(mockConnection),
    default: {
      connect: vi.fn().mockResolvedValue(mockConnection),
    },
  };
});

describe('AmqpTransport - Unit Tests', () => {
  let transport: AmqpTransport;
  let amqp: any;
  let mockConnection: any;
  let mockChannel: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked amqplib
    amqp = await import('amqplib');
    mockConnection = await amqp.connect();
    mockChannel = await mockConnection.createChannel();

    // Clear the mocks again after setup to not count these calls
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (transport) {
      await transport.stopListening();
    }
  });

  describe('Configuration', () => {
    test('should create transport with default config', () => {
      transport = new AmqpTransport();
      expect(transport).toBeInstanceOf(AmqpTransport);
    });

    test('should create transport with custom config', () => {
      transport = new AmqpTransport({
        url: 'amqp://custom-host:5672',
        queuePrefix: 'test-',
        prefetchCount: 5,
        queueDurable: false,
      });
      expect(transport).toBeInstanceOf(AmqpTransport);
    });

    test('should use environment variable for URL', () => {
      const originalUrl = process.env.AMQP_URL;
      process.env.AMQP_URL = 'amqp://env-host:5672';
      transport = new AmqpTransport();
      expect(transport).toBeInstanceOf(AmqpTransport);
      if (originalUrl) {
        process.env.AMQP_URL = originalUrl;
      } else {
        delete process.env.AMQP_URL;
      }
    });

    test('should configure exchange options', () => {
      transport = new AmqpTransport({
        exchange: 'test-exchange',
        exchangeType: 'topic',
        exchangeDurable: false,
      });
      expect(transport).toBeInstanceOf(AmqpTransport);
    });
  });

  describe('dispatch()', () => {
    test('should dispatch message directly to queue', async () => {
      transport = new AmqpTransport();

      await transport.dispatch('test-channel', 'Hello World');

      expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost');
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test-channel', {
        durable: true,
        autoDelete: false,
      });
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith('test-channel', expect.any(Buffer), {
        persistent: true,
      });
    });

    test('should dispatch message to exchange', async () => {
      transport = new AmqpTransport({
        exchange: 'my-exchange',
        exchangeType: 'direct',
      });

      await transport.dispatch('routing-key', 'Exchange Message');

      expect(mockChannel.assertExchange).toHaveBeenCalledWith('my-exchange', 'direct', {
        durable: true,
      });
      expect(mockChannel.publish).toHaveBeenCalledWith(
        'my-exchange',
        'routing-key',
        expect.any(Buffer),
        { persistent: true }
      );
    });

    test('should use queue name prefix', async () => {
      transport = new AmqpTransport({ queuePrefix: 'prefix-' });

      await transport.dispatch('test', 'Prefixed Message');

      expect(mockChannel.assertQueue).toHaveBeenCalledWith('prefix-test', expect.any(Object));
    });

    test('should handle backpressure when channel buffer is full', async () => {
      transport = new AmqpTransport();

      mockChannel.sendToQueue.mockReturnValueOnce(false);

      const dispatchPromise = transport.dispatch('test-channel', 'Message');

      // Simulate drain event
      setTimeout(() => {
        const drainCallback = mockChannel.once.mock.calls.find(
          (call: any[]) => call[0] === 'drain'
        )?.[1];
        if (drainCallback) drainCallback();
      }, 10);

      await dispatchPromise;

      expect(mockChannel.once).toHaveBeenCalledWith('drain', expect.any(Function));
    });

    test('should reuse connection for multiple dispatches', async () => {
      transport = new AmqpTransport();

      await transport.dispatch('channel1', 'Message 1');
      await transport.dispatch('channel2', 'Message 2');

      expect(amqp.connect).toHaveBeenCalledTimes(1);
      expect(mockConnection.createChannel).toHaveBeenCalledTimes(1);
    });
  });

  describe('registerListener()', () => {
    test('should register a listener for a channel', async () => {
      transport = new AmqpTransport();

      const callback = vi.fn();
      await transport.registerListener('test-channel', callback);

      expect(transport).toBeInstanceOf(AmqpTransport);
    });

    test('should replace existing listener for same channel', async () => {
      transport = new AmqpTransport();

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      await transport.registerListener('test-channel', callback1);
      await transport.registerListener('test-channel', callback2);

      expect(transport).toBeInstanceOf(AmqpTransport);
    });

    test('should start consumer immediately if already listening', async () => {
      transport = new AmqpTransport();

      await transport.startListening();

      const callback = vi.fn();
      await transport.registerListener('new-channel', callback);

      expect(mockChannel.consume).toHaveBeenCalled();
    });
  });

  describe('startListening() and stopListening()', () => {
    test('should start listening and consume messages', async () => {
      transport = new AmqpTransport();

      const messages: string[] = [];
      const callback = vi.fn(async (msg: string) => {
        messages.push(msg);
      });

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test-channel', {
        durable: true,
        autoDelete: false,
      });
      expect(mockChannel.consume).toHaveBeenCalledWith('test-channel', expect.any(Function), {
        noAck: false,
      });
    });

    test('should process messages and acknowledge them', async () => {
      transport = new AmqpTransport();

      const messages: string[] = [];
      const callback = vi.fn(async (msg: string) => {
        messages.push(msg);
      });

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      // Get the consume callback
      const consumeCallback = mockChannel.consume.mock.calls[0][1];

      // Simulate receiving a message
      const mockMessage = {
        content: Buffer.from('Test Message', 'utf-8'),
      };

      await consumeCallback(mockMessage);

      expect(callback).toHaveBeenCalledWith('Test Message');
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
      expect(messages).toContain('Test Message');
    });

    test('should handle null messages gracefully', async () => {
      transport = new AmqpTransport();

      const callback = vi.fn();
      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(null);

      expect(callback).not.toHaveBeenCalled();
    });

    test('should nack and requeue messages on processing error', async () => {
      transport = new AmqpTransport();

      const callback = vi.fn().mockRejectedValueOnce(new Error('Processing failed'));

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      const mockMessage = {
        content: Buffer.from('Failing Message', 'utf-8'),
      };

      await consumeCallback(mockMessage);

      expect(callback).toHaveBeenCalled();
      expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, true);
    });

    test('should use custom error handler', async () => {
      const errorHandler = vi.fn();
      transport = new AmqpTransport({ onError: errorHandler });

      const callback = vi.fn().mockRejectedValueOnce(new Error('Custom error'));

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      const mockMessage = {
        content: Buffer.from('Error Message', 'utf-8'),
      };

      await consumeCallback(mockMessage);

      expect(errorHandler).toHaveBeenCalled();
      expect(errorHandler.mock.calls[0][0].message).toBe('Custom error');
      expect(errorHandler.mock.calls[0][1]).toMatchObject({
        channel: 'test-channel',
      });
    });

    test('should support noAck mode', async () => {
      transport = new AmqpTransport({ noAck: true });

      const callback = vi.fn();
      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      expect(mockChannel.consume).toHaveBeenCalledWith('test-channel', expect.any(Function), {
        noAck: true,
      });

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      const mockMessage = {
        content: Buffer.from('Auto-ack Message', 'utf-8'),
      };

      await consumeCallback(mockMessage);

      expect(callback).toHaveBeenCalledWith('Auto-ack Message');
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });

    test('should bind queue to exchange when exchange is configured', async () => {
      transport = new AmqpTransport({
        exchange: 'test-exchange',
        exchangeType: 'topic',
      });

      const callback = vi.fn();
      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'test-channel',
        'test-exchange',
        'test-channel'
      );
    });

    test('should stop listening and cancel consumers', async () => {
      transport = new AmqpTransport();

      const callback = vi.fn();
      await transport.registerListener('test-channel', callback);
      await transport.startListening();
      await transport.stopListening();

      expect(mockChannel.cancel).toHaveBeenCalledWith('consumer-tag-123');
      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    test('should not start listening twice', async () => {
      transport = new AmqpTransport();

      const callback = vi.fn();
      await transport.registerListener('test-channel', callback);

      await transport.startListening();
      await transport.startListening(); // Should be idempotent

      expect(mockChannel.consume).toHaveBeenCalledTimes(1);
    });

    test('should handle multiple channels', async () => {
      transport = new AmqpTransport();

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      await transport.registerListener('channel1', callback1);
      await transport.registerListener('channel2', callback2);
      await transport.startListening();

      expect(mockChannel.consume).toHaveBeenCalledTimes(2);
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('channel1', expect.any(Object));
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('channel2', expect.any(Object));
    });
  });

  describe('Connection Management', () => {
    test('should set up connection error handlers', async () => {
      transport = new AmqpTransport();

      await transport.dispatch('test', 'Message');

      expect(mockConnection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockConnection.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockChannel.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    test('should handle connection errors', async () => {
      const errorHandler = vi.fn();
      transport = new AmqpTransport({ onError: errorHandler });

      await transport.dispatch('test', 'Message');

      // Get the error handler
      const errorCallback = mockConnection.on.mock.calls.find(
        (call: any[]) => call[0] === 'error'
      )?.[1];

      if (errorCallback) {
        errorCallback(new Error('Connection error'));
        expect(errorHandler).toHaveBeenCalled();
      }
    });

    test('should configure prefetch count', async () => {
      transport = new AmqpTransport({ prefetchCount: 10 });

      await transport.dispatch('test', 'Message');

      expect(mockChannel.prefetch).toHaveBeenCalledWith(10);
    });

    test('should handle concurrent connection attempts', async () => {
      transport = new AmqpTransport();

      // Start multiple dispatches concurrently
      await Promise.all([
        transport.dispatch('ch1', 'msg1'),
        transport.dispatch('ch2', 'msg2'),
        transport.dispatch('ch3', 'msg3'),
      ]);

      // Should only connect once
      expect(amqp.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Queue Configuration', () => {
    test('should create durable queues by default', async () => {
      transport = new AmqpTransport();

      await transport.dispatch('test', 'Message');

      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test', {
        durable: true,
        autoDelete: false,
      });
    });

    test('should create non-durable queues when configured', async () => {
      transport = new AmqpTransport({ queueDurable: false });

      await transport.dispatch('test', 'Message');

      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test', {
        durable: false,
        autoDelete: false,
      });
    });

    test('should create auto-delete queues when configured', async () => {
      transport = new AmqpTransport({ autoDelete: true });

      await transport.dispatch('test', 'Message');

      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test', {
        durable: true,
        autoDelete: true,
      });
    });
  });
});

describe('AmqpTransport - Integration Tests', () => {
  let transport: AmqpTransport;
  let amqp: any;
  let mockConnection: any;
  let mockChannel: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    amqp = (await import('amqplib')).default;
    mockConnection = await amqp.connect();
    mockChannel = await mockConnection.createChannel();
  });

  afterEach(async () => {
    if (transport) {
      await transport.stopListening();
    }
  });

  test('should handle full message lifecycle: dispatch -> consume -> acknowledge', async () => {
    transport = new AmqpTransport();

    const processedMessages: string[] = [];
    const callback = vi.fn(async (msg: string) => {
      processedMessages.push(msg);
    });

    // Dispatch message
    await transport.dispatch('integration-channel', 'Integration Test Message');

    // Register listener
    await transport.registerListener('integration-channel', callback);
    await transport.startListening();

    // Get the consume callback
    const consumeCallback = mockChannel.consume.mock.calls[0][1];

    // Simulate receiving the message
    const mockMessage = {
      content: Buffer.from('Integration Test Message', 'utf-8'),
    };
    await consumeCallback(mockMessage);

    expect(processedMessages).toContain('Integration Test Message');
    expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
  });

  test('should handle multiple messages in sequence', async () => {
    transport = new AmqpTransport();

    const processedMessages: string[] = [];
    const callback = vi.fn(async (msg: string) => {
      processedMessages.push(msg);
    });

    await transport.registerListener('seq-channel', callback);
    await transport.startListening();

    const consumeCallback = mockChannel.consume.mock.calls[0][1];

    // Process multiple messages
    for (let i = 1; i <= 3; i++) {
      const mockMessage = {
        content: Buffer.from(`Message ${i}`, 'utf-8'),
      };
      await consumeCallback(mockMessage);
    }

    expect(processedMessages).toEqual(['Message 1', 'Message 2', 'Message 3']);
    expect(mockChannel.ack).toHaveBeenCalledTimes(3);
  });

  test('should handle message retry after processing failure', async () => {
    transport = new AmqpTransport();

    let attempt = 0;
    const callback = vi.fn(async (msg: string) => {
      attempt++;
      if (attempt === 1) {
        throw new Error('First attempt failed');
      }
      // Second attempt succeeds
    });

    await transport.registerListener('retry-channel', callback);
    await transport.startListening();

    const consumeCallback = mockChannel.consume.mock.calls[0][1];
    const mockMessage = {
      content: Buffer.from('Retry Message', 'utf-8'),
    };

    // First attempt - should fail and nack
    await consumeCallback(mockMessage);
    expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, true);

    // Second attempt - should succeed
    await consumeCallback(mockMessage);
    expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('should handle exchange-based routing', async () => {
    transport = new AmqpTransport({
      exchange: 'integration-exchange',
      exchangeType: 'direct',
    });

    const callback1 = vi.fn();
    const callback2 = vi.fn();

    // Dispatch to different routing keys
    await transport.dispatch('route1', 'Message for route 1');
    await transport.dispatch('route2', 'Message for route 2');

    // Register listeners
    await transport.registerListener('route1', callback1);
    await transport.registerListener('route2', callback2);
    await transport.startListening();

    expect(mockChannel.assertExchange).toHaveBeenCalledWith('integration-exchange', 'direct', {
      durable: true,
    });

    expect(mockChannel.publish).toHaveBeenCalledTimes(2);
    expect(mockChannel.bindQueue).toHaveBeenCalledWith('route1', 'integration-exchange', 'route1');
    expect(mockChannel.bindQueue).toHaveBeenCalledWith('route2', 'integration-exchange', 'route2');
  });

  test('should handle graceful shutdown with pending messages', async () => {
    transport = new AmqpTransport();

    const callback = vi.fn(async (msg: string) => {
      await sleep(100); // Simulate slow processing
    });

    await transport.registerListener('slow-channel', callback);
    await transport.startListening();

    const consumeCallback = mockChannel.consume.mock.calls[0][1];
    const mockMessage = {
      content: Buffer.from('Slow Message', 'utf-8'),
    };

    // Start processing a message
    const processPromise = consumeCallback(mockMessage);

    // Stop listening
    await transport.stopListening();

    // Wait for message processing to complete
    await processPromise;

    expect(mockChannel.cancel).toHaveBeenCalled();
    expect(mockChannel.close).toHaveBeenCalled();
  });
});
