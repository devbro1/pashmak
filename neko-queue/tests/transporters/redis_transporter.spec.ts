import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createClient } from 'redis';
import { RedisTransport } from '../../src/transports/RedisTransport.mjs';

const REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';

async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error('Timed out waiting for condition');
}

describe('RedisTransport', () => {
  let transport: RedisTransport;
  let cleanupClient: ReturnType<typeof createClient>;
  let testPrefix: string;

  beforeAll(async () => {
    cleanupClient = createClient({
      socket: { host: REDIS_HOST, port: 6379 },
    });
    await cleanupClient.connect();
  });

  afterAll(async () => {
    await cleanupClient.quit();
  });

  beforeEach(() => {
    testPrefix = `test:${Date.now()}:${Math.random().toString(36).substring(2, 8)}`;
  });

  afterEach(async () => {
    if (transport) {
      await transport.stopListening();
    }
    const keys = await cleanupClient.keys(`${testPrefix}:*`);
    if (keys.length > 0) {
      await cleanupClient.del(keys);
    }
  });

  describe('Configuration', () => {
    it('should connect with host and port configuration', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        port: 6379,
        keyPrefix: testPrefix,
      });

      await transport.dispatch('test-channel', 'test message');

      const length = await transport.getQueueLength('test-channel');
      expect(length).toBe(1);
    });

    it('should connect with URL configuration', async () => {
      transport = new RedisTransport({
        url: `redis://${REDIS_HOST}:6379`,
        keyPrefix: testPrefix,
      });

      await transport.dispatch('test-channel', 'test message');

      const length = await transport.getQueueLength('test-channel');
      expect(length).toBe(1);
    });

    it('should use custom key prefix for queue keys', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
      });

      await transport.dispatch('test-channel', 'test message');

      const exists = await cleanupClient.exists(`${testPrefix}:queue:test-channel`);
      expect(exists).toBe(1);
    });

    it('should use custom error handler on processing error', async () => {
      const errors: Error[] = [];
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        maxRetries: 0,
        pollInterval: 100,
        onError: (err) => errors.push(err),
      });

      await transport.registerListener('test-channel', async () => {
        throw new Error('processing error');
      });
      await transport.startListening();
      await transport.dispatch('test-channel', 'test message');

      await waitFor(() => errors.length > 0);
      expect(errors[0].message).toBe('processing error');
    });
  });

  describe('Connection Management', () => {
    it('should connect lazily on first operation', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
      });

      // No dispatch yet — verify dispatch works on first call
      await transport.dispatch('test-channel', 'test message');

      const length = await transport.getQueueLength('test-channel');
      expect(length).toBeGreaterThan(0);
    });

    it('should reuse connection across multiple dispatches', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
      });

      await transport.dispatch('test-channel', 'message 1');
      await transport.dispatch('test-channel', 'message 2');
      await transport.dispatch('test-channel', 'message 3');

      const length = await transport.getQueueLength('test-channel');
      expect(length).toBe(3);
    });

    it('should handle concurrent connection attempts', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
      });

      await Promise.all([
        transport.dispatch('channel1', 'message1'),
        transport.dispatch('channel2', 'message2'),
        transport.dispatch('channel3', 'message3'),
      ]);

      const [l1, l2, l3] = await Promise.all([
        transport.getQueueLength('channel1'),
        transport.getQueueLength('channel2'),
        transport.getQueueLength('channel3'),
      ]);
      expect(l1).toBe(1);
      expect(l2).toBe(1);
      expect(l3).toBe(1);
    });

    it('should close connections on stopListening', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
      });

      await transport.registerListener('test-channel', async () => {});
      await transport.startListening();
      await transport.dispatch('test-channel', 'test message');

      // stopListening should resolve without error
      await expect(transport.stopListening()).resolves.not.toThrow();
    });
  });

  describe('Message Dispatch', () => {
    it('should dispatch message to queue', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
      });

      await transport.dispatch('test-channel', 'test message');

      const rawMessage = await cleanupClient.rPop(`${testPrefix}:queue:test-channel`);
      expect(rawMessage).toBeTruthy();
      const parsed = JSON.parse(rawMessage ?? '');
      expect(parsed.content).toBe('test message');
    });

    it('should include message metadata', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
      });

      await transport.dispatch('test-channel', 'test message');

      const rawMessage = await cleanupClient.rPop(`${testPrefix}:queue:test-channel`);
      const message = JSON.parse(rawMessage ?? '');
      expect(message).toMatchObject({
        id: expect.stringMatching(/^msg_\d+_[a-z0-9]+$/),
        content: 'test message',
        timestamp: expect.any(Number),
        attempts: 0,
      });
    });

    it('should dispatch to different channels', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
      });

      await transport.dispatch('channel1', 'message1');
      await transport.dispatch('channel2', 'message2');

      const [l1, l2] = await Promise.all([
        transport.getQueueLength('channel1'),
        transport.getQueueLength('channel2'),
      ]);
      expect(l1).toBe(1);
      expect(l2).toBe(1);
    });

    it('should throw if connection fails', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        port: 19999, // non-existent port
        keyPrefix: testPrefix,
        connectTimeout: 500,
        maxRetries: 0,
      });

      await expect(transport.dispatch('test-channel', 'test message')).rejects.toThrow();
    });
  });

  describe('Listener Registration', () => {
    it('should not process messages before startListening is called', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });

      await transport.dispatch('test-channel', 'queued message');
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(received).toHaveLength(0);
    });

    it('should process queued messages after startListening is called', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });

      await transport.dispatch('test-channel', 'queued message');

      await transport.startListening();

      await waitFor(() => received.length > 0);
      expect(received).toContain('queued message');
    });

    it('should replace existing listener for same channel', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      const received1: string[] = [];
      const received2: string[] = [];

      await transport.registerListener('test-channel', async (msg) => {
        received1.push(msg);
      });
      await transport.registerListener('test-channel', async (msg) => {
        received2.push(msg);
      });

      await transport.startListening();
      await transport.dispatch('test-channel', 'test message');

      await waitFor(() => received2.length > 0);
      expect(received2).toContain('test message');
      expect(received1).toHaveLength(0);
    });

    it('should start processing immediately if already listening', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      await transport.startListening();

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });

      await transport.dispatch('test-channel', 'test message');

      await waitFor(() => received.length > 0);
      expect(received).toContain('test message');
    });
  });

  describe('Message Processing', () => {
    it('should process messages when notified', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'test message');

      await waitFor(() => received.length > 0);
      expect(received).toContain('test message');
    });

    it('should use atomic move from queue to processing list', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'test message');

      await waitFor(() => received.length > 0);

      // After successful processing, processing list should be empty
      const processingLength = await transport.getProcessingLength('test-channel');
      expect(processingLength).toBe(0);
    });

    it('should handle empty queue gracefully', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      // No messages dispatched - wait a bit and ensure no errors
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(received).toHaveLength(0);
    });

    it('should poll for messages periodically', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 200,
      });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      // Dispatch after a short delay so polling picks it up
      await new Promise((resolve) => setTimeout(resolve, 100));
      await transport.dispatch('test-channel', 'polled message');

      await waitFor(() => received.length > 0, 3000);
      expect(received).toContain('polled message');
    });

    it('should process messages in FIFO order', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'first');
      await transport.dispatch('test-channel', 'second');
      await transport.dispatch('test-channel', 'third');

      await waitFor(() => received.length >= 3);
      expect(received).toEqual(['first', 'second', 'third']);
    });
  });

  describe('Error Handling and Retry', () => {
    it('should retry failed messages up to maxRetries', async () => {
      let callCount = 0;
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        maxRetries: 3,
        pollInterval: 100,
      });

      await transport.registerListener('test-channel', async () => {
        callCount++;
        throw new Error('Processing failed');
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'test message');

      await waitFor(() => callCount >= 3, 10000);
      expect(callCount).toBeGreaterThanOrEqual(3);
    });

    it('should move message to failed queue after max retries', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        maxRetries: 1,
        pollInterval: 100,
      });

      await transport.registerListener('test-channel', async () => {
        throw new Error('Processing failed');
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'test message');

      await waitFor(async () => {
        const failedLength = await transport.getFailedLength('test-channel');
        return failedLength > 0;
      }, 10000);

      const failedLength = await transport.getFailedLength('test-channel');
      expect(failedLength).toBe(1);
    });

    it('should include error details in failed messages', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        maxRetries: 0,
        pollInterval: 100,
      });

      await transport.registerListener('test-channel', async () => {
        throw new Error('Processing failed');
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'test message');

      await waitFor(async () => {
        const failedLength = await transport.getFailedLength('test-channel');
        return failedLength > 0;
      }, 10000);

      const rawFailed = await cleanupClient.rPop(`${testPrefix}:failed:test-channel`);
      const parsed = JSON.parse(rawFailed ?? '');
      expect(parsed).toMatchObject({
        content: 'test message',
        error: 'Processing failed',
        failedAt: expect.any(Number),
      });
    });

    it('should call error handler on processing error', async () => {
      const errorContexts: Array<{ error: Error; context: Record<string, string> }> = [];
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        maxRetries: 0,
        pollInterval: 100,
        onError: (error, context) => errorContexts.push({ error, context }),
      });

      await transport.registerListener('test-channel', async () => {
        throw new Error('Processing failed');
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'test message');

      await waitFor(() => errorContexts.length > 0);
      expect(errorContexts[0].error.message).toBe('Processing failed');
      expect(errorContexts[0].context).toMatchObject({
        channel: 'test-channel',
        body: 'test message',
      });
    });
  });

  describe('Lifecycle Management', () => {
    it('should start listening on all registered channels', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      const received1: string[] = [];
      const received2: string[] = [];
      await transport.registerListener('channel1', async (msg) => {
        received1.push(msg);
      });
      await transport.registerListener('channel2', async (msg) => {
        received2.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('channel1', 'msg1');
      await transport.dispatch('channel2', 'msg2');

      await waitFor(() => received1.length > 0 && received2.length > 0);
      expect(received1).toContain('msg1');
      expect(received2).toContain('msg2');
    });

    it('should not start listening twice', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });

      await transport.startListening();
      await transport.startListening(); // Second call is a no-op

      await transport.dispatch('test-channel', 'test message');

      await waitFor(() => received.length > 0);
      // Message should be received exactly once
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(received).toHaveLength(1);
    });

    it('should stop listening and clean up', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      await transport.registerListener('test-channel', async () => {});
      await transport.startListening();

      await expect(transport.stopListening()).resolves.not.toThrow();
    });

    it('should not stop listening twice', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      await transport.registerListener('test-channel', async () => {});
      await transport.startListening();
      await transport.stopListening();

      // Second stopListening should be safe
      await expect(transport.stopListening()).resolves.not.toThrow();
    });

    it('should stop processing messages after stopListening', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'before stop');
      await waitFor(() => received.length > 0);

      await transport.stopListening();

      // Dispatch after stop; message will sit in queue unprocessed
      await transport.dispatch('test-channel', 'after stop');
      await new Promise((resolve) => setTimeout(resolve, 400));

      expect(received).not.toContain('after stop');
    });
  });

  describe('Queue Metrics', () => {
    it('should get queue length', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
      });

      await transport.dispatch('test-channel', 'message 1');
      await transport.dispatch('test-channel', 'message 2');
      await transport.dispatch('test-channel', 'message 3');

      const length = await transport.getQueueLength('test-channel');
      expect(length).toBe(3);
    });

    it('should report zero queue length when empty', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
      });

      const length = await transport.getQueueLength('empty-channel');
      expect(length).toBe(0);
    });

    it('should get processing length', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
      });

      // Start processing is 0 before any messages
      const length = await transport.getProcessingLength('test-channel');
      expect(length).toBe(0);
    });

    it('should get failed messages count', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        maxRetries: 0,
        pollInterval: 100,
      });

      await transport.registerListener('test-channel', async () => {
        throw new Error('always fails');
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'message 1');
      await transport.dispatch('test-channel', 'message 2');

      await waitFor(async () => {
        const count = await transport.getFailedLength('test-channel');
        return count >= 2;
      }, 10000);

      const failedCount = await transport.getFailedLength('test-channel');
      expect(failedCount).toBe(2);
    });
  });

  describe('Integration Tests', () => {
    it('should handle full message lifecycle', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'message 1');
      await transport.dispatch('test-channel', 'message 2');

      await waitFor(() => received.length >= 2);
      expect(received).toContain('message 1');
      expect(received).toContain('message 2');

      // Queue should be empty after processing
      const queueLength = await transport.getQueueLength('test-channel');
      expect(queueLength).toBe(0);
    });

    it('should handle multiple channels concurrently', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

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

      await waitFor(() => channel1Messages.length >= 2 && channel2Messages.length >= 1);
      expect(channel1Messages).toContain('msg1-1');
      expect(channel1Messages).toContain('msg1-2');
      expect(channel2Messages).toContain('msg2-1');
    });

    it('should handle graceful shutdown', async () => {
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        pollInterval: 100,
      });

      await transport.registerListener('channel1', async () => {});
      await transport.registerListener('channel2', async () => {});
      await transport.startListening();

      await expect(transport.stopListening()).resolves.not.toThrow();
    });

    it('should handle retry and eventual success', async () => {
      let attemptCount = 0;
      transport = new RedisTransport({
        host: REDIS_HOST,
        keyPrefix: testPrefix,
        maxRetries: 3,
        pollInterval: 100,
      });

      await transport.registerListener('test-channel', async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Not yet');
        }
        // Success on third attempt
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'test message');

      await waitFor(() => attemptCount >= 3, 10000);
      expect(attemptCount).toBeGreaterThanOrEqual(3);

      // After eventual success, nothing should be in the failed queue
      await new Promise((resolve) => setTimeout(resolve, 300));
      const failedLength = await transport.getFailedLength('test-channel');
      expect(failedLength).toBe(0);
    });
  });
});
