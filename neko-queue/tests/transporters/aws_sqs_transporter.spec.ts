import { DeleteQueueCommand, ListQueuesCommand, SQSClient } from '@aws-sdk/client-sqs';
import { sleep } from '@devbro/neko-helper';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { AwsSqsTransport } from '../../src/transports/AwsSqsTransport.mjs';

const LOCALSTACK_ENDPOINT = process.env.SQS_ENDPOINT || 'http://localstack:4566';
const AWS_REGION = 'us-east-1';
const AWS_CREDENTIALS = { accessKeyId: 'test', secretAccessKey: 'test' };

const BASE_CONFIG = {
  endpoint: LOCALSTACK_ENDPOINT,
  region: AWS_REGION,
  credentials: AWS_CREDENTIALS,
  createQueue: true,
  waitTimeSeconds: 1,
  pollIntervalMs: 100,
};

async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 10000,
  interval = 100
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await sleep(interval);
  }
  throw new Error('Timed out waiting for condition');
}

describe('AwsSqsTransport', () => {
  let transport: AwsSqsTransport;
  let cleanupClient: SQSClient;
  let testPrefix: string;

  beforeAll(() => {
    cleanupClient = new SQSClient({
      endpoint: LOCALSTACK_ENDPOINT,
      region: AWS_REGION,
      credentials: AWS_CREDENTIALS,
    });
  });

  afterAll(() => {
    cleanupClient.destroy();
  });

  beforeEach(() => {
    testPrefix = `test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-`;
  });

  afterEach(async () => {
    if (transport) {
      await transport.stopListening();
    }
    const listResult = await cleanupClient.send(
      new ListQueuesCommand({ QueueNamePrefix: testPrefix })
    );
    await Promise.all(
      (listResult.QueueUrls ?? []).map((queueUrl) =>
        cleanupClient.send(new DeleteQueueCommand({ QueueUrl: queueUrl })).catch(() => undefined)
      )
    );
  });

  describe('Configuration', () => {
    test('should create transport with default config', () => {
      transport = new AwsSqsTransport();
      expect(transport).toBeInstanceOf(AwsSqsTransport);
    });

    test('should create transport with custom config', () => {
      transport = new AwsSqsTransport({
        ...BASE_CONFIG,
        queueNamePrefix: testPrefix,
        waitTimeSeconds: 10,
        maxNumberOfMessages: 5,
      });
      expect(transport).toBeInstanceOf(AwsSqsTransport);
    });

    test('should accept a provided SQS client', () => {
      const customClient = new SQSClient({
        endpoint: LOCALSTACK_ENDPOINT,
        region: AWS_REGION,
        credentials: AWS_CREDENTIALS,
      });
      transport = new AwsSqsTransport({ client: customClient });
      expect(transport).toBeInstanceOf(AwsSqsTransport);
    });
  });

  describe('dispatch()', () => {
    test('should dispatch message to queue', async () => {
      transport = new AwsSqsTransport({ ...BASE_CONFIG, queueNamePrefix: testPrefix });

      await expect(transport.dispatch('test-channel', 'Hello World')).resolves.not.toThrow();
    });

    test('should auto-create queue if it does not exist', async () => {
      transport = new AwsSqsTransport({
        ...BASE_CONFIG,
        queueNamePrefix: testPrefix,
        createQueue: true,
      });

      await transport.dispatch('new-channel', 'Test Message');

      const listResult = await cleanupClient.send(
        new ListQueuesCommand({ QueueNamePrefix: `${testPrefix}new-channel` })
      );
      expect(listResult.QueueUrls?.length).toBeGreaterThan(0);
    });

    test('should use queue name prefix', async () => {
      transport = new AwsSqsTransport({ ...BASE_CONFIG, queueNamePrefix: testPrefix });

      await transport.dispatch('test', 'Prefixed Message');

      const listResult = await cleanupClient.send(
        new ListQueuesCommand({ QueueNamePrefix: `${testPrefix}test` })
      );
      expect(listResult.QueueUrls?.length).toBeGreaterThan(0);
    });

    test('should cache queue URLs across multiple dispatches', async () => {
      transport = new AwsSqsTransport({ ...BASE_CONFIG, queueNamePrefix: testPrefix });

      await transport.dispatch('cached-channel', 'Message 1');
      await transport.dispatch('cached-channel', 'Message 2');
      await transport.dispatch('cached-channel', 'Message 3');

      // Only one queue should exist for the channel
      const listResult = await cleanupClient.send(
        new ListQueuesCommand({ QueueNamePrefix: `${testPrefix}cached-channel` })
      );
      expect(listResult.QueueUrls?.length).toBe(1);
    });

    test('should throw when createQueue is false and queue does not exist', async () => {
      transport = new AwsSqsTransport({
        ...BASE_CONFIG,
        queueNamePrefix: testPrefix,
        createQueue: false,
      });

      await expect(transport.dispatch('non-existent', 'Test')).rejects.toThrow();
    });
  });

  describe('registerListener()', () => {
    test('should register a listener and resolve the queue URL', async () => {
      transport = new AwsSqsTransport({ ...BASE_CONFIG, queueNamePrefix: testPrefix });

      await expect(
        transport.registerListener('test-channel', async () => {})
      ).resolves.not.toThrow();
    });

    test('should replace existing listener for same channel', async () => {
      transport = new AwsSqsTransport({ ...BASE_CONFIG, queueNamePrefix: testPrefix });

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

    test('should start processing immediately when already listening', async () => {
      transport = new AwsSqsTransport({ ...BASE_CONFIG, queueNamePrefix: testPrefix });

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

  describe('startListening() and stopListening()', () => {
    test('should start listening and process messages', async () => {
      transport = new AwsSqsTransport({ ...BASE_CONFIG, queueNamePrefix: testPrefix });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'Test Message');

      await waitFor(() => received.length > 0);
      expect(received).toContain('Test Message');
    });

    test('should handle multiple messages', async () => {
      transport = new AwsSqsTransport({
        ...BASE_CONFIG,
        queueNamePrefix: testPrefix,
        maxNumberOfMessages: 10,
      });

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

    test('should call error handler on processing failure', async () => {
      const errors: Error[] = [];
      transport = new AwsSqsTransport({
        ...BASE_CONFIG,
        queueNamePrefix: testPrefix,
        errorVisibilityTimeout: 1,
        onError: (err) => errors.push(err),
      });

      await transport.registerListener('test-channel', async () => {
        throw new Error('Processing failed');
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'Failing Message');

      await waitFor(() => errors.length > 0);
      expect(errors[0].message).toBe('Processing failed');
    });

    test('should pass channel and body to custom error handler', async () => {
      const errorContexts: Array<{ error: Error; context: Record<string, string | undefined> }> =
        [];
      transport = new AwsSqsTransport({
        ...BASE_CONFIG,
        queueNamePrefix: testPrefix,
        onError: (error, context) => errorContexts.push({ error, context }),
      });

      await transport.registerListener('test-channel', async () => {
        throw new Error('Custom error');
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'Error Message');

      await waitFor(() => errorContexts.length > 0);
      expect(errorContexts[0].error.message).toBe('Custom error');
      expect(errorContexts[0].context).toMatchObject({
        channel: 'test-channel',
        body: 'Error Message',
      });
    });

    test('should stop listening cleanly', async () => {
      transport = new AwsSqsTransport({ ...BASE_CONFIG, queueNamePrefix: testPrefix });

      await transport.registerListener('test-channel', async () => {});
      await transport.startListening();

      await expect(transport.stopListening()).resolves.not.toThrow();
    });

    test('should not start listening twice', async () => {
      transport = new AwsSqsTransport({ ...BASE_CONFIG, queueNamePrefix: testPrefix });

      const received: string[] = [];
      await transport.registerListener('test-channel', async (msg) => {
        received.push(msg);
      });

      await transport.startListening();
      await transport.startListening(); // Second call should be idempotent

      await transport.dispatch('test-channel', 'test message');

      await waitFor(() => received.length > 0);
      await sleep(300);
      expect(received).toHaveLength(1);
    });
  });

  describe('Queue Creation', () => {
    test('should create standard queue with configured attributes', async () => {
      transport = new AwsSqsTransport({
        ...BASE_CONFIG,
        queueNamePrefix: testPrefix,
        visibilityTimeout: 60,
        queueAttributes: { MessageRetentionPeriod: '86400' },
      });

      await transport.dispatch('standard-queue', 'Test');

      const listResult = await cleanupClient.send(
        new ListQueuesCommand({ QueueNamePrefix: `${testPrefix}standard-queue` })
      );
      expect(listResult.QueueUrls?.length).toBeGreaterThan(0);
    });

    test('should create FIFO queue with .fifo suffix', async () => {
      transport = new AwsSqsTransport({
        ...BASE_CONFIG,
        queueNamePrefix: testPrefix,
        createQueue: true,
      });

      await transport.dispatch('fifo-queue.fifo', 'Test');

      const listResult = await cleanupClient.send(
        new ListQueuesCommand({ QueueNamePrefix: `${testPrefix}fifo-queue.fifo` })
      );
      expect(listResult.QueueUrls?.length).toBeGreaterThan(0);
    });

    test('should not create queue when createQueue is false', async () => {
      transport = new AwsSqsTransport({
        ...BASE_CONFIG,
        queueNamePrefix: testPrefix,
        createQueue: false,
      });

      await expect(transport.dispatch('non-existent', 'Test')).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should not change visibility timeout when errorVisibilityTimeout is undefined', async () => {
      const errors: Error[] = [];
      transport = new AwsSqsTransport({
        ...BASE_CONFIG,
        queueNamePrefix: testPrefix,
        errorVisibilityTimeout: undefined,
        onError: (err) => errors.push(err),
      });

      await transport.registerListener('test-channel', async () => {
        throw new Error('Processing failed');
      });
      await transport.startListening();

      await transport.dispatch('test-channel', 'Failing Message');

      await waitFor(() => errors.length > 0);
      expect(errors[0].message).toBe('Processing failed');
    });
  });

  describe('Integration Tests', () => {
    test('should handle full message lifecycle: dispatch -> receive -> process -> delete', async () => {
      transport = new AwsSqsTransport({ ...BASE_CONFIG, queueNamePrefix: testPrefix });

      const received: string[] = [];
      await transport.registerListener('integration-channel', async (msg) => {
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('integration-channel', 'Integration Test Message');

      await waitFor(() => received.length > 0);
      expect(received).toContain('Integration Test Message');
    });

    test('should handle multiple channels concurrently', async () => {
      transport = new AwsSqsTransport({ ...BASE_CONFIG, queueNamePrefix: testPrefix });

      const channel1Messages: string[] = [];
      const channel2Messages: string[] = [];

      await transport.registerListener('channel1', async (msg) => {
        channel1Messages.push(msg);
      });
      await transport.registerListener('channel2', async (msg) => {
        channel2Messages.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('channel1', 'Channel 1 Message');
      await transport.dispatch('channel2', 'Channel 2 Message');

      await waitFor(() => channel1Messages.length > 0 && channel2Messages.length > 0);
      expect(channel1Messages).toContain('Channel 1 Message');
      expect(channel2Messages).toContain('Channel 2 Message');
    });

    test('should reprocess message after processing failure', async () => {
      let attempt = 0;
      const received: string[] = [];
      transport = new AwsSqsTransport({
        ...BASE_CONFIG,
        queueNamePrefix: testPrefix,
        errorVisibilityTimeout: 0,
        visibilityTimeout: 1,
      });

      await transport.registerListener('retry-channel', async (msg) => {
        attempt++;
        if (attempt === 1) throw new Error('First attempt failed');
        received.push(msg);
      });
      await transport.startListening();

      await transport.dispatch('retry-channel', 'Retry Message');

      await waitFor(() => received.length > 0, 15000);
      expect(attempt).toBeGreaterThanOrEqual(2);
      expect(received).toContain('Retry Message');
    });
  });
});
