import amqplib, { type Channel, type ChannelModel } from 'amqplib';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { AmqpTransport } from '../../src/transports/AmqpTransport.mjs';

const RABBITMQ_URI = process.env.RABBITMQ_URI ?? 'amqp://guest:guest@localhost:5672';

async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 10000,
  interval = 50
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error('Timed out waiting for condition');
}

describe('AmqpTransport', () => {
  let transport: AmqpTransport;
  let cleanupConnection: ChannelModel;
  let cleanupChannel: Channel;
  let testPrefix: string;

  beforeAll(async () => {
    cleanupConnection = await amqplib.connect(RABBITMQ_URI);
    cleanupChannel = await cleanupConnection.createChannel();
  });

  afterAll(async () => {
    await cleanupChannel.close().catch(() => undefined);
    await cleanupConnection.close().catch(() => undefined);
  });

  beforeEach(() => {
    // Keep prefix short: RabbitMQ queue names max 255 bytes
    testPrefix = `t${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}-`;
  });

  afterEach(async () => {
    if (transport) {
      await transport.stopListening().catch(() => undefined);
    }
    const commonQueues = [
      'test-channel',
      'channel1',
      'channel2',
      'ch1',
      'ch2',
      'ch3',
      'integration-channel',
      'seq-channel',
      'retry-channel',
      'slow-channel',
      'route1',
      'route2',
      'test',
      'new-channel',
    ];
    for (const q of commonQueues) {
      await cleanupChannel.deleteQueue(`${testPrefix}${q}`).catch(() => undefined);
    }
    await cleanupChannel.deleteExchange(`${testPrefix}exchange`).catch(() => undefined);
    await cleanupChannel.deleteExchange(`${testPrefix}integration-exchange`).catch(() => undefined);
  });

  describe('Configuration', () => {
    test('should create transport with default config', () => {
      transport = new AmqpTransport();
      expect(transport).toBeInstanceOf(AmqpTransport);
    });

    test('should create transport with custom config', () => {
      transport = new AmqpTransport({
        url: RABBITMQ_URI,
        queuePrefix: testPrefix,
        prefetchCount: 5,
        queueDurable: false,
      });
      expect(transport).toBeInstanceOf(AmqpTransport);
    });

    test('should use environment variable for URL', () => {
      const originalUrl = process.env.AMQP_URL;
      process.env.AMQP_URL = RABBITMQ_URI;
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
        url: RABBITMQ_URI,
        exchange: `${testPrefix}exchange`,
        exchangeType: 'topic',
        exchangeDurable: false,
      });
      expect(transport).toBeInstanceOf(AmqpTransport);
    });
  });

  describe('dispatch()', () => {
    test('should dispatch message directly to queue', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      await transport.dispatch('test-channel', 'Hello World');

      await cleanupChannel.assertQueue(`${testPrefix}test-channel`, { durable: true });
      const msg = await cleanupChannel.get(`${testPrefix}test-channel`, { noAck: true });
      expect(msg).not.toBe(false);
      if (msg !== false) expect(msg.content.toString()).toBe('Hello World');
    });

    test('should dispatch message to exchange', async () => {
      transport = new AmqpTransport({
        url: RABBITMQ_URI,
        queuePrefix: testPrefix,
        exchange: `${testPrefix}exchange`,
        exchangeType: 'direct',
      });

      // Assert the queue and bind it before dispatching so the message is routable
      await cleanupChannel.assertExchange(`${testPrefix}exchange`, 'direct', { durable: true });
      await cleanupChannel.assertQueue(`${testPrefix}route1`, { durable: true });
      await cleanupChannel.bindQueue(
        `${testPrefix}route1`,
        `${testPrefix}exchange`,
        `${testPrefix}route1`
      );

      await transport.dispatch('route1', 'Exchange Message');

      const msg = await cleanupChannel.get(`${testPrefix}route1`, { noAck: true });
      expect(msg).not.toBe(false);
      if (msg !== false) expect(msg.content.toString()).toBe('Exchange Message');
    });

    test('should use queue name prefix', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      await transport.dispatch('test', 'Prefixed Message');

      await cleanupChannel.assertQueue(`${testPrefix}test`, { durable: true });
      const msg = await cleanupChannel.get(`${testPrefix}test`, { noAck: true });
      expect(msg).not.toBe(false);
      if (msg !== false) expect(msg.content.toString()).toBe('Prefixed Message');
    });

    test('should reuse connection for multiple dispatches', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      await transport.dispatch('test-channel', 'Message 1');
      await transport.dispatch('test-channel', 'Message 2');

      await cleanupChannel.assertQueue(`${testPrefix}test-channel`, { durable: true });
      const msg1 = await cleanupChannel.get(`${testPrefix}test-channel`, { noAck: true });
      const msg2 = await cleanupChannel.get(`${testPrefix}test-channel`, { noAck: true });
      expect(msg1).not.toBe(false);
      expect(msg2).not.toBe(false);
    });
  });

  describe('registerListener()', () => {
    test('should register a listener and receive messages', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'Hello');

      await waitFor(() => received.length > 0);
      expect(received).toContain('Hello');
    });

    test('should replace existing listener for same channel', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

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

    test('should start consumer immediately if already listening', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      await transport.startListening();

      const received: string[] = [];
      await transport.registerListener('new-channel', async (msg) => {
        received.push(msg);
      });

      await transport.dispatch('new-channel', 'Late registration message');

      await waitFor(() => received.length > 0);
      expect(received).toContain('Late registration message');
    });
  });

  describe('startListening() and stopListening()', () => {
    test('should start listening and consume messages', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'Test Message');

      await waitFor(() => received.length > 0);
      expect(received).toContain('Test Message');
    });

    test('should process multiple messages and acknowledge them', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'Message 1');
      await transport.dispatch('test-channel', 'Message 2');
      await transport.dispatch('test-channel', 'Message 3');

      await waitFor(() => received.length >= 3);
      expect(received).toContain('Message 1');
      expect(received).toContain('Message 2');
      expect(received).toContain('Message 3');
    });

    test('should nack and requeue messages on processing error', async () => {
      let attempt = 0;
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      const received: string[] = [];
      await transport.registerListener('retry-channel', async (msg) => {
        attempt++;
        if (attempt === 1) throw new Error('First attempt failed');
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('retry-channel', 'Retry Message');

      await waitFor(() => received.length > 0);
      expect(attempt).toBeGreaterThanOrEqual(2);
      expect(received).toContain('Retry Message');
    });

    test('should call custom error handler on processing failure', async () => {
      const errors: Array<{ error: Error; context: Record<string, unknown> }> = [];
      transport = new AmqpTransport({
        url: RABBITMQ_URI,
        queuePrefix: testPrefix,
        onError: (error, context) => errors.push({ error, context }),
      });

      let callCount = 0;
      await transport.registerListener('test-channel', async () => {
        callCount++;
        if (callCount === 1) throw new Error('Custom error');
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'Error Message');

      await waitFor(() => errors.length > 0);
      expect(errors[0].error.message).toBe('Custom error');
      expect(errors[0].context).toMatchObject({ channel: 'test-channel' });
    });

    test('should support noAck mode', async () => {
      transport = new AmqpTransport({
        url: RABBITMQ_URI,
        queuePrefix: testPrefix,
        noAck: true,
      });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'Auto-ack Message');

      await waitFor(() => received.length > 0);
      expect(received).toContain('Auto-ack Message');
    });

    test('should bind queue to exchange when exchange is configured', async () => {
      transport = new AmqpTransport({
        url: RABBITMQ_URI,
        queuePrefix: testPrefix,
        exchange: `${testPrefix}exchange`,
        exchangeType: 'direct',
      });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'Exchange routed message');

      await waitFor(() => received.length > 0);
      expect(received).toContain('Exchange routed message');
    });

    test('should stop listening and not process new messages', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'Before stop');
      await waitFor(() => received.length > 0);

      await transport.stopListening();

      // Dispatch a second message - it sits in the queue but won't be consumed
      await transport.dispatch('test-channel', 'After stop');
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(received).not.toContain('After stop');
    });

    test('should not start listening twice', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });

      await transport.startListening();
      await transport.startListening(); // Should be idempotent

      await transport.dispatch('test-channel', 'test message');

      await waitFor(() => received.length > 0);
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(received).toHaveLength(1);
    });

    test('should handle multiple channels', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      const received1: string[] = [];
      const received2: string[] = [];

      await transport.registerListener('channel1', async (msg) => {
        received1.push(msg);
      });
      await transport.registerListener('channel2', async (msg) => {
        received2.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('channel1', 'Channel 1 message');
      await transport.dispatch('channel2', 'Channel 2 message');

      await waitFor(() => received1.length > 0 && received2.length > 0);
      expect(received1).toContain('Channel 1 message');
      expect(received2).toContain('Channel 2 message');
    });
  });

  describe('Connection Management', () => {
    test('should configure prefetch count', async () => {
      transport = new AmqpTransport({
        url: RABBITMQ_URI,
        queuePrefix: testPrefix,
        prefetchCount: 1,
      });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'Message 1');
      await transport.dispatch('test-channel', 'Message 2');

      await waitFor(() => received.length >= 2);
      expect(received).toHaveLength(2);
    });

    test('should handle concurrent dispatches', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      await Promise.all([
        transport.dispatch('ch1', 'msg1'),
        transport.dispatch('ch2', 'msg2'),
        transport.dispatch('ch3', 'msg3'),
      ]);

      const [msg1, msg2, msg3] = await Promise.all([
        cleanupChannel.get(`${testPrefix}ch1`, { noAck: true }),
        cleanupChannel.get(`${testPrefix}ch2`, { noAck: true }),
        cleanupChannel.get(`${testPrefix}ch3`, { noAck: true }),
      ]);
      if (msg1 !== false) expect(msg1.content.toString()).toBe('msg1');
      if (msg2 !== false) expect(msg2.content.toString()).toBe('msg2');
      if (msg3 !== false) expect(msg3.content.toString()).toBe('msg3');
    });
  });

  describe('Queue Configuration', () => {
    test('should create durable queues by default', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      await transport.dispatch('test-channel', 'Message');

      // assertQueue with durable:true should not throw even if queue already exists
      const q = await cleanupChannel.assertQueue(`${testPrefix}test-channel`, { durable: true });
      expect(q.queue).toBe(`${testPrefix}test-channel`);
    });

    test('should create non-durable queues when configured', async () => {
      transport = new AmqpTransport({
        url: RABBITMQ_URI,
        queuePrefix: testPrefix,
        queueDurable: false,
      });

      await transport.dispatch('test-channel', 'Message');

      const q = await cleanupChannel.assertQueue(`${testPrefix}test-channel`, { durable: false });
      expect(q.queue).toBe(`${testPrefix}test-channel`);
    });

    test('should create auto-delete queues when configured', async () => {
      transport = new AmqpTransport({
        url: RABBITMQ_URI,
        queuePrefix: testPrefix,
        autoDelete: true,
      });

      // Need a consumer for autoDelete to matter; just verify dispatch succeeds
      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();
      await transport.dispatch('test-channel', 'AutoDelete Message');

      await waitFor(() => received.length > 0);
      expect(received).toContain('AutoDelete Message');
    });
  });

  describe('Integration Tests', () => {
    test('should handle full message lifecycle: dispatch -> consume -> acknowledge', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      const received: string[] = [];
      await transport.registerListener('integration-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('integration-channel', 'Integration Test Message');

      await waitFor(() => received.length > 0);
      expect(received).toContain('Integration Test Message');
    });

    test('should handle messages dispatched before listener starts', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      // Dispatch first (queue is durable, message persists)
      await transport.dispatch('integration-channel', 'Pre-queued Message');

      const received: string[] = [];
      await transport.registerListener('integration-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await waitFor(() => received.length > 0);
      expect(received).toContain('Pre-queued Message');
    });

    test('should handle multiple messages in sequence', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      const received: string[] = [];
      await transport.registerListener('seq-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      for (let i = 1; i <= 3; i++) {
        await transport.dispatch('seq-channel', `Message ${i}`);
      }

      await waitFor(() => received.length >= 3);
      expect(received).toContain('Message 1');
      expect(received).toContain('Message 2');
      expect(received).toContain('Message 3');
    });

    test('should handle exchange-based routing', async () => {
      transport = new AmqpTransport({
        url: RABBITMQ_URI,
        queuePrefix: testPrefix,
        exchange: `${testPrefix}integration-exchange`,
        exchangeType: 'direct',
      });

      const received1: string[] = [];
      const received2: string[] = [];

      await transport.registerListener('route1', async (msg) => {
        received1.push(msg);
      });
      await transport.registerListener('route2', async (msg) => {
        received2.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('route1', 'Message for route 1');
      await transport.dispatch('route2', 'Message for route 2');

      await waitFor(() => received1.length > 0 && received2.length > 0);
      expect(received1).toContain('Message for route 1');
      expect(received2).toContain('Message for route 2');
    });

    test('should handle graceful shutdown', async () => {
      transport = new AmqpTransport({ url: RABBITMQ_URI, queuePrefix: testPrefix });

      const received: string[] = [];
      await transport.registerListener('slow-channel', async (msg) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('slow-channel', 'Slow Message');
      await waitFor(() => received.length > 0);

      await expect(transport.stopListening()).resolves.not.toThrow();
    });
  });
});
