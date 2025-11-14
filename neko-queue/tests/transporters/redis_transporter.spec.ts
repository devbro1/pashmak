import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RedisTransport } from '../../src/transports/RedisTransport.mjs';

// Mock redis module
vi.mock('redis', () => {
  const mockClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue(undefined),
    lPush: vi.fn().mockResolvedValue(1),
    rPopLPush: vi.fn().mockResolvedValue(null),
    lRem: vi.fn().mockResolvedValue(1),
    lLen: vi.fn().mockResolvedValue(0),
    publish: vi.fn().mockResolvedValue(1),
    subscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    expire: vi.fn().mockResolvedValue(1),
    on: vi.fn(),
    isOpen: true,
  };

  return {
    createClient: vi.fn(() => ({ ...mockClient })),
  };
});

describe('RedisTransport', () => {
  let transport: RedisTransport;
  let mockCreateClient: any;
  let mockClient: any;
  let mockSubscriber: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const redis = await import('redis');
    mockCreateClient = redis.createClient as any;

    // Create separate mocks for client and subscriber
    mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      quit: vi.fn().mockResolvedValue(undefined),
      lPush: vi.fn().mockResolvedValue(1),
      rPopLPush: vi.fn().mockResolvedValue(null),
      lRem: vi.fn().mockResolvedValue(1),
      lLen: vi.fn().mockResolvedValue(0),
      publish: vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(1),
      on: vi.fn(),
      isOpen: true,
    };

    mockSubscriber = {
      connect: vi.fn().mockResolvedValue(undefined),
      quit: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue(undefined),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      isOpen: true,
    };

    // Mock createClient to return different instances
    let callCount = 0;
    mockCreateClient.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? mockClient : mockSubscriber;
    });
  });

  afterEach(async () => {
    if (transport) {
      await transport.stopListening();
    }
  });

  describe('Configuration', () => {
    it('should create transport with default configuration', async () => {
      transport = new RedisTransport();

      await transport.dispatch('test-channel', 'test message');

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.objectContaining({
          database: 0,
          socket: expect.objectContaining({
            host: 'localhost',
            port: 6379,
            connectTimeout: 10000,
          }),
        })
      );
    });

    it('should create transport with URL configuration', async () => {
      transport = new RedisTransport({
        url: 'redis://redis-server:6380',
      });

      await transport.dispatch('test-channel', 'test message');

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'redis://redis-server:6380',
          database: 0,
        })
      );
    });

    it('should create transport with host and port configuration', async () => {
      transport = new RedisTransport({
        host: 'custom-redis',
        port: 6380,
        database: 2,
      });

      await transport.dispatch('test-channel', 'test message');

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.objectContaining({
          database: 2,
          socket: expect.objectContaining({
            host: 'custom-redis',
            port: 6380,
          }),
        })
      );
    });

    it('should create transport with authentication', async () => {
      transport = new RedisTransport({
        username: 'admin',
        password: 'secret',
      });

      await transport.dispatch('test-channel', 'test message');

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'admin',
          password: 'secret',
        })
      );
    });

    it('should create transport with custom key prefix', async () => {
      transport = new RedisTransport({
        keyPrefix: 'my-app',
      });

      await transport.dispatch('test-channel', 'test message');

      expect(mockClient.lPush).toHaveBeenCalledWith(
        'my-app:queue:test-channel',
        expect.any(String)
      );
    });

    it('should use custom error handler', async () => {
      const onError = vi.fn();
      transport = new RedisTransport({ onError });

      await transport.dispatch('test-channel', 'test message');

      // Trigger error
      const errorHandler = mockClient.on.mock.calls.find((call: any) => call[0] === 'error')?.[1];
      const testError = new Error('Redis error');
      errorHandler(testError);

      expect(onError).toHaveBeenCalledWith(testError, {});
    });
  });

  describe('Connection Management', () => {
    it('should connect lazily on first operation', async () => {
      transport = new RedisTransport();

      expect(mockCreateClient).not.toHaveBeenCalled();

      await transport.dispatch('test-channel', 'test message');

      expect(mockCreateClient).toHaveBeenCalledTimes(2); // client + subscriber
      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockSubscriber.connect).toHaveBeenCalled();
    });

    it('should reuse existing connection', async () => {
      transport = new RedisTransport();

      await transport.dispatch('test-channel', 'message 1');
      await transport.dispatch('test-channel', 'message 2');

      expect(mockCreateClient).toHaveBeenCalledTimes(2); // Only once for client + subscriber
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent connection attempts', async () => {
      transport = new RedisTransport();

      // Delay connection
      mockClient.connect.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50))
      );
      mockSubscriber.connect.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50))
      );

      // Make concurrent calls
      await Promise.all([
        transport.dispatch('channel1', 'message1'),
        transport.dispatch('channel2', 'message2'),
        transport.dispatch('channel3', 'message3'),
      ]);

      // Should only create clients once despite concurrent calls
      expect(mockCreateClient).toHaveBeenCalledTimes(2);
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should set up error handlers on clients', async () => {
      transport = new RedisTransport();

      await transport.dispatch('test-channel', 'test message');

      expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockSubscriber.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should close connections on stopListening', async () => {
      transport = new RedisTransport();

      await transport.dispatch('test-channel', 'test message');
      await transport.registerListener('test-channel', async () => {});
      await transport.startListening();
      await transport.stopListening();

      expect(mockClient.quit).toHaveBeenCalled();
      expect(mockSubscriber.quit).toHaveBeenCalled();
    });
  });

  describe('Message Dispatch', () => {
    it('should dispatch message to queue', async () => {
      transport = new RedisTransport();

      await transport.dispatch('test-channel', 'test message');

      expect(mockClient.lPush).toHaveBeenCalledWith(
        'neko-queue:queue:test-channel',
        expect.stringContaining('"content":"test message"')
      );
    });

    it('should include message metadata', async () => {
      transport = new RedisTransport();

      await transport.dispatch('test-channel', 'test message');

      const messageStr = mockClient.lPush.mock.calls[0][1];
      const message = JSON.parse(messageStr);

      expect(message).toMatchObject({
        id: expect.stringMatching(/^msg_\d+_[a-z0-9]+$/),
        content: 'test message',
        timestamp: expect.any(Number),
        attempts: 0,
      });
    });

    it('should publish notification after dispatching', async () => {
      transport = new RedisTransport();

      await transport.dispatch('test-channel', 'test message');

      expect(mockClient.publish).toHaveBeenCalledWith('neko-queue:notify:test-channel', '1');
    });

    it('should dispatch to different channels', async () => {
      transport = new RedisTransport();

      await transport.dispatch('channel1', 'message1');
      await transport.dispatch('channel2', 'message2');

      expect(mockClient.lPush).toHaveBeenCalledWith(
        'neko-queue:queue:channel1',
        expect.any(String)
      );
      expect(mockClient.lPush).toHaveBeenCalledWith(
        'neko-queue:queue:channel2',
        expect.any(String)
      );
    });

    it('should throw error if client not available', async () => {
      transport = new RedisTransport();

      mockClient.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(transport.dispatch('test-channel', 'test message')).rejects.toThrow();
    });
  });

  describe('Listener Registration', () => {
    it('should register listener for channel', async () => {
      transport = new RedisTransport();
      const callback = vi.fn().mockResolvedValue(undefined);

      await transport.registerListener('test-channel', callback);

      // Listener registered but not started yet
      expect(mockSubscriber.subscribe).not.toHaveBeenCalled();
    });

    it('should replace existing listener for same channel', async () => {
      transport = new RedisTransport();
      const callback1 = vi.fn().mockResolvedValue(undefined);
      const callback2 = vi.fn().mockResolvedValue(undefined);

      await transport.registerListener('test-channel', callback1);
      await transport.registerListener('test-channel', callback2);

      await transport.startListening();

      // Simulate message
      mockClient.rPopLPush.mockResolvedValueOnce(
        JSON.stringify({
          id: 'msg_1',
          content: 'test message',
          timestamp: Date.now(),
          attempts: 0,
        })
      );

      const subscribeCallback = mockSubscriber.subscribe.mock.calls[0][1];
      await subscribeCallback();

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(callback2).toHaveBeenCalled();
      expect(callback1).not.toHaveBeenCalled();
    });

    it('should start processing if already listening', async () => {
      transport = new RedisTransport();
      const callback = vi.fn().mockResolvedValue(undefined);

      await transport.startListening();
      await transport.registerListener('test-channel', callback);

      expect(mockSubscriber.subscribe).toHaveBeenCalledWith(
        'neko-queue:notify:test-channel',
        expect.any(Function)
      );
    });
  });

  describe('Message Processing', () => {
    it('should process messages when notified', async () => {
      transport = new RedisTransport();
      const callback = vi.fn().mockResolvedValue(undefined);

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      // Mock message in queue
      mockClient.rPopLPush.mockResolvedValueOnce(
        JSON.stringify({
          id: 'msg_1',
          content: 'test message',
          timestamp: Date.now(),
          attempts: 0,
        })
      );

      // Trigger notification
      const subscribeCallback = mockSubscriber.subscribe.mock.calls[0][1];
      await subscribeCallback();

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(callback).toHaveBeenCalledWith('test message');
      expect(mockClient.lRem).toHaveBeenCalledWith(
        'neko-queue:processing:test-channel',
        1,
        expect.any(String)
      );
    });

    it('should use rPopLPush for atomic message retrieval', async () => {
      transport = new RedisTransport();
      const callback = vi.fn().mockResolvedValue(undefined);

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      mockClient.rPopLPush.mockResolvedValueOnce(
        JSON.stringify({
          id: 'msg_1',
          content: 'test message',
          timestamp: Date.now(),
          attempts: 0,
        })
      );

      const subscribeCallback = mockSubscriber.subscribe.mock.calls[0][1];
      await subscribeCallback();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockClient.rPopLPush).toHaveBeenCalledWith(
        'neko-queue:queue:test-channel',
        'neko-queue:processing:test-channel'
      );
    });

    it('should handle malformed messages', async () => {
      transport = new RedisTransport();
      const callback = vi.fn().mockResolvedValue(undefined);

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      mockClient.rPopLPush.mockResolvedValueOnce('invalid json');

      const subscribeCallback = mockSubscriber.subscribe.mock.calls[0][1];
      await subscribeCallback();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(callback).not.toHaveBeenCalled();
      expect(mockClient.lRem).toHaveBeenCalled(); // Remove malformed message
    });

    it('should handle empty queue', async () => {
      transport = new RedisTransport();
      const callback = vi.fn().mockResolvedValue(undefined);

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      mockClient.rPopLPush.mockResolvedValueOnce(null);

      const subscribeCallback = mockSubscriber.subscribe.mock.calls[0][1];
      await subscribeCallback();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(callback).not.toHaveBeenCalled();
    });

    it('should poll for messages periodically', async () => {
      transport = new RedisTransport({ pollInterval: 50 });
      const callback = vi.fn().mockResolvedValue(undefined);

      await transport.registerListener('test-channel', callback);

      // Mock no message initially
      mockClient.rPopLPush.mockResolvedValue(null);

      await transport.startListening();

      // Wait for initial processing to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now mock a message for the next poll
      mockClient.rPopLPush.mockResolvedValueOnce(
        JSON.stringify({
          id: 'msg_1',
          content: 'test message',
          timestamp: Date.now(),
          attempts: 0,
        })
      );

      // Wait for next poll cycle
      await new Promise((resolve) => setTimeout(resolve, 70));

      expect(callback).toHaveBeenCalledWith('test message');
    });
  });

  describe('Error Handling and Retry', () => {
    it('should retry failed messages', async () => {
      transport = new RedisTransport({ maxRetries: 3 });
      const callback = vi.fn().mockRejectedValue(new Error('Processing failed'));

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      const message = {
        id: 'msg_1',
        content: 'test message',
        timestamp: Date.now(),
        attempts: 0,
      };

      mockClient.rPopLPush.mockResolvedValueOnce(JSON.stringify(message));

      const subscribeCallback = mockSubscriber.subscribe.mock.calls[0][1];
      await subscribeCallback();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(callback).toHaveBeenCalled();
      expect(mockClient.lPush).toHaveBeenCalledWith(
        'neko-queue:queue:test-channel',
        expect.stringContaining('"attempts":1')
      );
    });

    it('should move message to failed queue after max retries', async () => {
      transport = new RedisTransport({ maxRetries: 2 });
      const callback = vi.fn().mockRejectedValue(new Error('Processing failed'));

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      const message = {
        id: 'msg_1',
        content: 'test message',
        timestamp: Date.now(),
        attempts: 2, // Already at max attempts
      };

      mockClient.rPopLPush.mockResolvedValueOnce(JSON.stringify(message));

      const subscribeCallback = mockSubscriber.subscribe.mock.calls[0][1];
      await subscribeCallback();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockClient.lPush).toHaveBeenCalledWith(
        'neko-queue:failed:test-channel',
        expect.stringContaining('"failedAt"')
      );
      expect(mockClient.expire).toHaveBeenCalledWith('neko-queue:failed:test-channel', 604800);
    });

    it('should include error details in failed messages', async () => {
      transport = new RedisTransport({ maxRetries: 1 });
      const testError = new Error('Processing failed');
      const callback = vi.fn().mockRejectedValue(testError);

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      const message = {
        id: 'msg_1',
        content: 'test message',
        timestamp: Date.now(),
        attempts: 1,
      };

      mockClient.rPopLPush.mockResolvedValueOnce(JSON.stringify(message));

      const subscribeCallback = mockSubscriber.subscribe.mock.calls[0][1];
      await subscribeCallback();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const failedMessage = mockClient.lPush.mock.calls.find(
        (call: any) => call[0] === 'neko-queue:failed:test-channel'
      )?.[1];

      expect(failedMessage).toBeTruthy();
      const parsed = JSON.parse(failedMessage);
      expect(parsed).toMatchObject({
        id: 'msg_1',
        content: 'test message',
        error: 'Processing failed',
        failedAt: expect.any(Number),
      });
    });

    it('should call error handler on processing error', async () => {
      const onError = vi.fn();
      transport = new RedisTransport({ onError });
      const callback = vi.fn().mockRejectedValue(new Error('Processing failed'));

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      mockClient.rPopLPush.mockResolvedValueOnce(
        JSON.stringify({
          id: 'msg_1',
          content: 'test message',
          timestamp: Date.now(),
          attempts: 0,
        })
      );

      const subscribeCallback = mockSubscriber.subscribe.mock.calls[0][1];
      await subscribeCallback();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          channel: 'test-channel',
          messageId: 'msg_1',
          body: 'test message',
        })
      );
    });
  });

  describe('Lifecycle Management', () => {
    it('should start listening on all registered channels', async () => {
      transport = new RedisTransport();

      await transport.registerListener('channel1', vi.fn());
      await transport.registerListener('channel2', vi.fn());
      await transport.startListening();

      expect(mockSubscriber.subscribe).toHaveBeenCalledWith(
        'neko-queue:notify:channel1',
        expect.any(Function)
      );
      expect(mockSubscriber.subscribe).toHaveBeenCalledWith(
        'neko-queue:notify:channel2',
        expect.any(Function)
      );
    });

    it('should not start listening twice', async () => {
      transport = new RedisTransport();

      await transport.registerListener('test-channel', vi.fn());
      await transport.startListening();
      await transport.startListening();

      expect(mockSubscriber.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should stop listening and clean up', async () => {
      transport = new RedisTransport();

      await transport.registerListener('test-channel', vi.fn());
      await transport.startListening();
      await transport.stopListening();

      expect(mockSubscriber.unsubscribe).toHaveBeenCalledWith('neko-queue:notify:test-channel');
      expect(mockClient.quit).toHaveBeenCalled();
      expect(mockSubscriber.quit).toHaveBeenCalled();
    });

    it('should not stop listening twice', async () => {
      transport = new RedisTransport();

      await transport.registerListener('test-channel', vi.fn());
      await transport.startListening();
      await transport.stopListening();

      mockClient.quit.mockClear();
      mockSubscriber.quit.mockClear();

      await transport.stopListening();

      expect(mockClient.quit).not.toHaveBeenCalled();
      expect(mockSubscriber.quit).not.toHaveBeenCalled();
    });

    it('should clear polling intervals on stop', async () => {
      vi.useFakeTimers();

      transport = new RedisTransport({ pollInterval: 1000 });
      await transport.registerListener('test-channel', vi.fn());
      await transport.startListening();

      await transport.stopListening();

      // Advance timers to ensure no polling happens
      mockClient.rPopLPush.mockClear();
      vi.advanceTimersByTime(2000);

      expect(mockClient.rPopLPush).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Queue Metrics', () => {
    it('should get queue length', async () => {
      transport = new RedisTransport();
      mockClient.lLen.mockResolvedValueOnce(5);

      const length = await transport.getQueueLength('test-channel');

      expect(length).toBe(5);
      expect(mockClient.lLen).toHaveBeenCalledWith('neko-queue:queue:test-channel');
    });

    it('should get processing length', async () => {
      transport = new RedisTransport();
      mockClient.lLen.mockResolvedValueOnce(2);

      const length = await transport.getProcessingLength('test-channel');

      expect(length).toBe(2);
      expect(mockClient.lLen).toHaveBeenCalledWith('neko-queue:processing:test-channel');
    });

    it('should get failed messages count', async () => {
      transport = new RedisTransport();
      mockClient.lLen.mockResolvedValueOnce(3);

      const length = await transport.getFailedLength('test-channel');

      expect(length).toBe(3);
      expect(mockClient.lLen).toHaveBeenCalledWith('neko-queue:failed:test-channel');
    });
  });

  describe('Integration Tests', () => {
    it('should handle full message lifecycle', async () => {
      transport = new RedisTransport();
      const messages: string[] = [];
      const callback = vi.fn(async (msg: string) => {
        messages.push(msg);
      });

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      // Dispatch messages
      await transport.dispatch('test-channel', 'message 1');
      await transport.dispatch('test-channel', 'message 2');

      expect(mockClient.lPush).toHaveBeenCalledTimes(2);
      expect(mockClient.publish).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple channels concurrently', async () => {
      transport = new RedisTransport();
      const channel1Messages: string[] = [];
      const channel2Messages: string[] = [];

      await transport.registerListener('channel1', async (msg) => {
        channel1Messages.push(msg);
      });
      await transport.registerListener('channel2', async (msg) => {
        channel2Messages.push(msg);
      });

      await transport.startListening();

      await transport.dispatch('channel1', 'msg1-1');
      await transport.dispatch('channel2', 'msg2-1');
      await transport.dispatch('channel1', 'msg1-2');

      expect(mockClient.lPush).toHaveBeenCalledWith(
        'neko-queue:queue:channel1',
        expect.any(String)
      );
      expect(mockClient.lPush).toHaveBeenCalledWith(
        'neko-queue:queue:channel2',
        expect.any(String)
      );
    });

    it('should handle graceful shutdown', async () => {
      transport = new RedisTransport();

      await transport.registerListener('channel1', vi.fn());
      await transport.registerListener('channel2', vi.fn());
      await transport.startListening();

      await transport.stopListening();

      expect(mockSubscriber.unsubscribe).toHaveBeenCalledTimes(2);
      expect(mockClient.quit).toHaveBeenCalled();
      expect(mockSubscriber.quit).toHaveBeenCalled();
    });

    it('should process messages in order', async () => {
      transport = new RedisTransport();
      const processedMessages: string[] = [];
      const callback = vi.fn(async (msg: string) => {
        processedMessages.push(msg);
      });

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      // Mock messages coming in order
      const messages = [
        { id: 'msg_1', content: 'first', timestamp: Date.now(), attempts: 0 },
        { id: 'msg_2', content: 'second', timestamp: Date.now(), attempts: 0 },
        { id: 'msg_3', content: 'third', timestamp: Date.now(), attempts: 0 },
      ];

      for (const msg of messages) {
        mockClient.rPopLPush.mockResolvedValueOnce(JSON.stringify(msg));

        const subscribeCallback = mockSubscriber.subscribe.mock.calls[0][1];
        await subscribeCallback();

        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      expect(processedMessages).toEqual(['first', 'second', 'third']);
    });

    it('should handle retry and eventual success', async () => {
      transport = new RedisTransport({ maxRetries: 3 });
      let attemptCount = 0;
      const callback = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Not yet');
        }
        // Success on third attempt
      });

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      const message = {
        id: 'msg_1',
        content: 'test message',
        timestamp: Date.now(),
        attempts: 0,
      };

      // First attempt
      mockClient.rPopLPush.mockResolvedValueOnce(JSON.stringify(message));
      const subscribeCallback = mockSubscriber.subscribe.mock.calls[0][1];
      await subscribeCallback();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(callback).toHaveBeenCalledTimes(1);
      expect(mockClient.lPush).toHaveBeenCalledWith(
        'neko-queue:queue:test-channel',
        expect.stringContaining('"attempts":1')
      );

      // Second attempt
      mockClient.rPopLPush.mockResolvedValueOnce(JSON.stringify({ ...message, attempts: 1 }));
      await subscribeCallback();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(callback).toHaveBeenCalledTimes(2);
      expect(mockClient.lPush).toHaveBeenCalledWith(
        'neko-queue:queue:test-channel',
        expect.stringContaining('"attempts":2')
      );

      // Third attempt (success)
      mockClient.rPopLPush.mockResolvedValueOnce(JSON.stringify({ ...message, attempts: 2 }));
      await subscribeCallback();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(callback).toHaveBeenCalledTimes(3);
      expect(mockClient.lRem).toHaveBeenCalledWith(
        'neko-queue:processing:test-channel',
        1,
        expect.any(String)
      );
    });
  });
});
