import { describe, expect, test, beforeEach, vi, afterEach } from 'vitest';
import { AwsSqsTransport } from '../../src/transports/AwsSqsTransport.mjs';
import { SQSClient } from '@aws-sdk/client-sqs';
import { sleep } from '@devbro/neko-helper';

// Mock SQS Client
vi.mock('@aws-sdk/client-sqs', () => {
  const mockSend = vi.fn();
  return {
    SQSClient: vi.fn(() => ({
      send: mockSend,
    })),
    SendMessageCommand: vi.fn((params) => ({ type: 'SendMessage', params })),
    ReceiveMessageCommand: vi.fn((params) => ({ type: 'ReceiveMessage', params })),
    DeleteMessageCommand: vi.fn((params) => ({ type: 'DeleteMessage', params })),
    GetQueueUrlCommand: vi.fn((params) => ({ type: 'GetQueueUrl', params })),
    CreateQueueCommand: vi.fn((params) => ({ type: 'CreateQueue', params })),
    ChangeMessageVisibilityCommand: vi.fn((params) => ({
      type: 'ChangeMessageVisibility',
      params,
    })),
  };
});

describe('AwsSqsTransport - Unit Tests', () => {
  let transport: AwsSqsTransport;
  let mockSend: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend = vi.fn();
    (SQSClient as any).mockImplementation(() => ({
      send: mockSend,
    }));
  });

  afterEach(async () => {
    if (transport) {
      await transport.stopListening();
    }
  });

  describe('Configuration', () => {
    test('should create transport with default config', async () => {
      transport = new AwsSqsTransport();
      expect(transport).toBeInstanceOf(AwsSqsTransport);
    });

    test('should create transport with custom config', () => {
      transport = new AwsSqsTransport({
        region: 'us-west-2',
        queueNamePrefix: 'test-',
        waitTimeSeconds: 10,
        maxNumberOfMessages: 5,
      });
      expect(transport).toBeInstanceOf(AwsSqsTransport);
    });

    test('should use provided SQS client', () => {
      const customClient = new SQSClient({ region: 'eu-west-1' });
      transport = new AwsSqsTransport({ client: customClient });
      expect(transport).toBeInstanceOf(AwsSqsTransport);
    });

    test('should use environment variables for region', () => {
      const originalRegion = process.env.AWS_REGION;
      process.env.AWS_REGION = 'ap-southeast-1';
      transport = new AwsSqsTransport();
      expect(transport).toBeInstanceOf(AwsSqsTransport);
      if (originalRegion) {
        process.env.AWS_REGION = originalRegion;
      } else {
        delete process.env.AWS_REGION;
      }
    });
  });

  describe('dispatch()', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });
    });

    test('should dispatch message to queue', async () => {
      transport = new AwsSqsTransport();

      // Mock GetQueueUrl response
      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });
      // Mock SendMessage response
      mockSend.mockResolvedValueOnce({ MessageId: 'msg-123' });

      await transport.dispatch('test-channel', 'Hello World');

      expect(mockSend).toHaveBeenCalledTimes(2);
      const sendMessageCall = mockSend.mock.calls[1][0];
      expect(sendMessageCall.type).toBe('SendMessage');
      expect(sendMessageCall.params.MessageBody).toBe('Hello World');
    });

    test('should create queue if it does not exist', async () => {
      transport = new AwsSqsTransport({ createQueue: true });

      // Mock GetQueueUrl to fail with QueueDoesNotExist
      mockSend.mockRejectedValueOnce({ name: 'QueueDoesNotExist' });
      // Mock CreateQueue response
      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/new-queue',
      });
      // Mock SendMessage response
      mockSend.mockResolvedValueOnce({ MessageId: 'msg-456' });

      await transport.dispatch('new-channel', 'Test Message');

      expect(mockSend).toHaveBeenCalledTimes(3);
      const createQueueCall = mockSend.mock.calls[1][0];
      expect(createQueueCall.type).toBe('CreateQueue');
    });

    test('should use queue name prefix', async () => {
      transport = new AwsSqsTransport({ queueNamePrefix: 'prefix-' });

      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/prefix-test',
      });
      mockSend.mockResolvedValueOnce({ MessageId: 'msg-789' });

      await transport.dispatch('test', 'Prefixed Message');

      const getQueueUrlCall = mockSend.mock.calls[0][0];
      expect(getQueueUrlCall.params.QueueName).toBe('prefix-test');
    });

    test('should handle FIFO queues', async () => {
      transport = new AwsSqsTransport({ messageGroupId: 'group-1' });

      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test.fifo',
      });
      mockSend.mockResolvedValueOnce({ MessageId: 'msg-fifo' });

      await transport.dispatch('test.fifo', 'FIFO Message');

      const sendMessageCall = mockSend.mock.calls[1][0];
      expect(sendMessageCall.params.MessageGroupId).toBe('group-1');
    });

    test('should cache queue URLs', async () => {
      transport = new AwsSqsTransport();

      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/cached-queue',
      });
      mockSend.mockResolvedValueOnce({ MessageId: 'msg-1' });
      mockSend.mockResolvedValueOnce({ MessageId: 'msg-2' });

      await transport.dispatch('cached-channel', 'Message 1');
      await transport.dispatch('cached-channel', 'Message 2');

      // Should only call GetQueueUrl once (cached on second dispatch)
      expect(mockSend).toHaveBeenCalledTimes(3);
    });
  });

  describe('registerListener()', () => {
    test('should register a listener for a channel', async () => {
      transport = new AwsSqsTransport();
      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });

      const callback = vi.fn();
      await transport.registerListener('test-channel', callback);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    test('should replace existing listener for same channel', async () => {
      transport = new AwsSqsTransport();
      mockSend.mockResolvedValue({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      await transport.registerListener('test-channel', callback1);
      await transport.registerListener('test-channel', callback2);

      // Should reuse cached queue URL
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('startListening() and stopListening()', () => {
    test('should start listening and process messages', async () => {
      transport = new AwsSqsTransport({ waitTimeSeconds: 1, pollIntervalMs: 100 });

      const messages: string[] = [];
      const callback = vi.fn(async (msg: string) => {
        messages.push(msg);
      });

      // Mock GetQueueUrl
      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });

      await transport.registerListener('test-channel', callback);

      // Mock ReceiveMessage with one message
      mockSend.mockResolvedValueOnce({
        Messages: [{ MessageId: 'msg-1', Body: 'Test Message', ReceiptHandle: 'receipt-1' }],
      });
      // Mock DeleteMessage
      mockSend.mockResolvedValueOnce({});
      // Mock subsequent empty ReceiveMessage
      mockSend.mockImplementation(async (command: any) => {
        await sleep(100); // Simulate network delay
        return { Messages: [] };
      });

      await transport.startListening();
      await sleep(500);
      await transport.stopListening();

      expect(callback).toHaveBeenCalledWith('Test Message');
      expect(messages).toContain('Test Message');
    });

    test('should handle multiple messages in a batch', async () => {
      transport = new AwsSqsTransport({ maxNumberOfMessages: 10, waitTimeSeconds: 1 });

      const messages: string[] = [];
      const callback = vi.fn(async (msg: string) => {
        messages.push(msg);
      });

      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });
      await transport.registerListener('test-channel', callback);

      // Mock batch of messages
      mockSend.mockResolvedValueOnce({
        Messages: [
          { MessageId: 'msg-1', Body: 'Message 1', ReceiptHandle: 'receipt-1' },
          { MessageId: 'msg-2', Body: 'Message 2', ReceiptHandle: 'receipt-2' },
          { MessageId: 'msg-3', Body: 'Message 3', ReceiptHandle: 'receipt-3' },
        ],
      });

      mockSend.mockImplementation(async (command: any) => {
        await sleep(100); // Simulate network delay
        return { Messages: [] };
      });

      await transport.startListening();
      await sleep(500);
      await transport.stopListening();

      expect(callback).toHaveBeenCalledTimes(3);
      expect(messages).toEqual(['Message 1', 'Message 2', 'Message 3']);
    });

    test('should handle message processing errors', async () => {
      transport = new AwsSqsTransport({ errorVisibilityTimeout: 100, waitTimeSeconds: 1 });

      const callback = vi.fn().mockRejectedValueOnce(new Error('Processing failed'));

      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });
      await transport.registerListener('test-channel', callback);

      mockSend.mockResolvedValueOnce({
        Messages: [{ MessageId: 'msg-1', Body: 'Failing Message', ReceiptHandle: 'receipt-1' }],
      });
      // Mock ChangeMessageVisibility for error handling
      mockSend.mockResolvedValueOnce({});
      mockSend.mockImplementation(async (command: any) => {
        await sleep(100); // Simulate network delay
        return { Messages: [] };
      });

      await transport.startListening();
      await sleep(500);
      await transport.stopListening();

      expect(callback).toHaveBeenCalled();
      // Should call ChangeMessageVisibility to reset visibility timeout

      const changeVisibilityCall = mockSend.mock.calls.find(
        (call: any) => call[0].type === 'ChangeMessageVisibility'
      );
      expect(changeVisibilityCall).toBeDefined();
    });

    test('should use custom error handler', async () => {
      const errorHandler = vi.fn();
      transport = new AwsSqsTransport({
        onError: errorHandler,
        waitTimeSeconds: 1,
      });

      const callback = vi.fn().mockRejectedValueOnce(new Error('Custom error'));

      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });
      await transport.registerListener('test-channel', callback);

      mockSend.mockResolvedValueOnce({
        Messages: [{ MessageId: 'msg-1', Body: 'Error Message', ReceiptHandle: 'receipt-1' }],
      });

      mockSend.mockImplementation(async (command: any) => {
        await sleep(100); // Simulate network delay
        return { Messages: [] };
      });

      await transport.startListening();
      await sleep(500);
      await transport.stopListening();

      expect(errorHandler).toHaveBeenCalled();
      expect(errorHandler.mock.calls[0][0].message).toBe('Custom error');
      expect(errorHandler.mock.calls[0][1]).toMatchObject({
        channel: 'test-channel',
        body: 'Error Message',
      });
    });

    test('should stop listening cleanly', async () => {
      transport = new AwsSqsTransport({ waitTimeSeconds: 1 });

      const callback = vi.fn();
      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });
      await transport.registerListener('test-channel', callback);

      mockSend.mockImplementation(async (command: any) => {
        await sleep(100); // Simulate network delay
        return { Messages: [] };
      });

      await transport.startListening();
      await sleep(200);
      await transport.stopListening();

      expect(transport).toBeInstanceOf(AwsSqsTransport);
    });

    test('should not start listening twice', async () => {
      transport = new AwsSqsTransport({ waitTimeSeconds: 1 });

      const callback = vi.fn();
      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });
      await transport.registerListener('test-channel', callback);

      mockSend.mockImplementation(async (command: any) => {
        await sleep(100); // Simulate network delay
        return { Messages: [] };
      });

      await transport.startListening();
      await transport.startListening(); // Should be idempotent

      await sleep(200);
      await transport.stopListening();

      expect(transport).toBeInstanceOf(AwsSqsTransport);
    });
  });

  describe('Queue Creation', () => {
    test('should create standard queue with correct attributes', async () => {
      transport = new AwsSqsTransport({
        createQueue: true,
        visibilityTimeout: 60,
        queueAttributes: { MessageRetentionPeriod: '86400' },
      });

      mockSend.mockRejectedValueOnce({ name: 'QueueDoesNotExist' });
      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/standard-queue',
      });
      mockSend.mockResolvedValueOnce({ MessageId: 'msg-std' });

      await transport.dispatch('standard-queue', 'Test');

      const createQueueCall = mockSend.mock.calls[1][0];
      expect(createQueueCall.type).toBe('CreateQueue');
      expect(createQueueCall.params.Attributes.VisibilityTimeout).toBe('60');
      expect(createQueueCall.params.Attributes.MessageRetentionPeriod).toBe('86400');
    });

    test('should create FIFO queue with correct attributes', async () => {
      transport = new AwsSqsTransport({ createQueue: true });

      mockSend.mockRejectedValueOnce({ name: 'QueueDoesNotExist' });
      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/fifo-queue.fifo',
      });
      mockSend.mockResolvedValueOnce({ MessageId: 'msg-fifo' });

      await transport.dispatch('fifo-queue.fifo', 'Test');

      const createQueueCall = mockSend.mock.calls[1][0];
      expect(createQueueCall.params.Attributes.FifoQueue).toBe('true');
      expect(createQueueCall.params.Attributes.ContentBasedDeduplication).toBe('true');
    });

    test('should not create queue when createQueue is false', async () => {
      transport = new AwsSqsTransport({ createQueue: false });

      mockSend.mockRejectedValueOnce({ name: 'QueueDoesNotExist' });

      await expect(transport.dispatch('non-existent', 'Test')).rejects.toThrow();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('Long Polling', () => {
    test('should use configured wait time for long polling', async () => {
      transport = new AwsSqsTransport({ waitTimeSeconds: 20 });

      const callback = vi.fn();
      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });
      await transport.registerListener('test-channel', callback);

      mockSend.mockImplementation(async (command: any) => {
        await sleep(100); // Simulate network delay
        return { Messages: [] };
      });

      await transport.startListening();
      await sleep(100);
      await transport.stopListening();

      const receiveMessageCall = mockSend.mock.calls.find(
        (call: any) => call[0].type === 'ReceiveMessage'
      );
      expect(receiveMessageCall[0].params.WaitTimeSeconds).toBe(20);
    });

    test('should continue polling after receiving empty response', async () => {
      transport = new AwsSqsTransport({ waitTimeSeconds: 1 });

      const callback = vi.fn();
      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });
      await transport.registerListener('test-channel', callback);

      // First poll: empty
      mockSend.mockResolvedValueOnce({ Messages: [] });
      // Second poll: message
      mockSend.mockResolvedValueOnce({
        Messages: [{ MessageId: 'msg-1', Body: 'Late Message', ReceiptHandle: 'receipt-1' }],
      });
      mockSend.mockImplementation(async (command: any) => {
        await sleep(100); // Simulate network delay
        return { Messages: [] };
      });

      await transport.startListening();
      await sleep(500);
      await transport.stopListening();

      expect(callback).toHaveBeenCalledWith('Late Message');
    });
  });

  describe('Error Handling', () => {
    test('should not change visibility timeout when errorVisibilityTimeout is undefined', async () => {
      transport = new AwsSqsTransport({ errorVisibilityTimeout: undefined, waitTimeSeconds: 1 });

      const callback = vi.fn().mockRejectedValueOnce(new Error('Processing failed'));

      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });
      await transport.registerListener('test-channel', callback);

      mockSend.mockResolvedValueOnce({
        Messages: [{ MessageId: 'msg-1', Body: 'Failing Message', ReceiptHandle: 'receipt-1' }],
      });
      mockSend.mockImplementation(async (command: any) => {
        await sleep(100); // Simulate network delay
        return {};
      });

      await transport.startListening();
      await sleep(500);
      await transport.stopListening();

      const changeVisibilityCall = mockSend.mock.calls.find(
        (call: any) => call[0].type === 'ChangeMessageVisibility'
      );
      expect(changeVisibilityCall).toBeUndefined();
    });

    test('should handle errors during queue URL lookup', async () => {
      const errorHandler = vi.fn();
      transport = new AwsSqsTransport({
        onError: errorHandler,
        waitTimeSeconds: 1,
        errorBackoffMs: 100,
      });

      const callback = vi.fn();
      // First GetQueueUrl succeeds
      mockSend.mockResolvedValueOnce({
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
      });
      await transport.registerListener('test-channel', callback);

      // ReceiveMessage fails
      mockSend.mockRejectedValueOnce(new Error('Network error'));
      // Subsequent polls return empty
      mockSend.mockImplementation(async (command: any) => {
        await sleep(100); // Simulate network delay
        return { Messages: [] };
      });

      await transport.startListening();
      await sleep(300);
      await transport.stopListening();

      expect(errorHandler).toHaveBeenCalled();
    });
  });
});

describe('AwsSqsTransport - Integration Tests', () => {
  let transport: AwsSqsTransport;
  let mockSend: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend = vi.fn();
    (SQSClient as any).mockImplementation(() => ({
      send: mockSend,
    }));
  });

  afterEach(async () => {
    if (transport) {
      await transport.stopListening();
    }
  });

  test('should handle full message lifecycle: dispatch -> receive -> process -> delete', async () => {
    transport = new AwsSqsTransport({ waitTimeSeconds: 1 });

    const processedMessages: string[] = [];
    const callback = vi.fn(async (msg: string) => {
      processedMessages.push(msg);
    });

    // Setup: GetQueueUrl for dispatch
    mockSend.mockResolvedValueOnce({
      QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/integration-queue',
    });

    // Dispatch
    mockSend.mockResolvedValueOnce({ MessageId: 'msg-integration' });
    await transport.dispatch('integration-channel', 'Integration Test Message');

    // Register listener (reuses cached URL)
    await transport.registerListener('integration-channel', callback);

    // Receive message
    mockSend.mockResolvedValueOnce({
      Messages: [
        {
          MessageId: 'msg-integration',
          Body: 'Integration Test Message',
          ReceiptHandle: 'receipt-int',
        },
      ],
    });

    // Delete message
    mockSend.mockResolvedValueOnce({});
    // Subsequent polls
    mockSend.mockResolvedValue({ Messages: [] });

    mockSend.mockImplementation(async (command: any) => {
      await sleep(100); // Simulate network delay
      return { Messages: [] };
    });

    await transport.startListening();
    await sleep(500);
    await transport.stopListening();

    expect(processedMessages).toContain('Integration Test Message');

    // Verify sequence: GetQueueUrl -> SendMessage -> ReceiveMessage -> DeleteMessage
    expect(mockSend.mock.calls[0][0].type).toBe('GetQueueUrl');
    expect(mockSend.mock.calls[1][0].type).toBe('SendMessage');
    expect(mockSend.mock.calls[2][0].type).toBe('ReceiveMessage');
    expect(mockSend.mock.calls[3][0].type).toBe('DeleteMessage');
  });

  test('should handle multiple channels concurrently', async () => {
    transport = new AwsSqsTransport({ waitTimeSeconds: 1 });

    const channel1Messages: string[] = [];
    const channel2Messages: string[] = [];

    const callback1 = vi.fn(async (msg: string) => {
      channel1Messages.push(msg);
    });
    const callback2 = vi.fn(async (msg: string) => {
      channel2Messages.push(msg);
    });

    // GetQueueUrl for channel1
    mockSend.mockResolvedValueOnce({
      QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/channel1',
    });
    // GetQueueUrl for channel2
    mockSend.mockResolvedValueOnce({
      QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/channel2',
    });

    await transport.registerListener('channel1', callback1);
    await transport.registerListener('channel2', callback2);

    // Channel1 receives message
    mockSend.mockResolvedValueOnce({
      Messages: [{ MessageId: 'msg-ch1', Body: 'Channel 1 Message', ReceiptHandle: 'receipt-ch1' }],
    });
    // Channel2 receives message
    mockSend.mockResolvedValueOnce({
      Messages: [{ MessageId: 'msg-ch2', Body: 'Channel 2 Message', ReceiptHandle: 'receipt-ch2' }],
    });
    // Delete responses and subsequent empty polls
    mockSend.mockImplementation(async (command: any) => {
      await sleep(100); // Simulate network delay
      return { Messages: [] };
    });

    await transport.startListening();
    await sleep(500);
    await transport.stopListening();

    expect(channel1Messages).toContain('Channel 1 Message');
    expect(channel2Messages).toContain('Channel 2 Message');
  });

  test('should handle message retry after processing failure', async () => {
    transport = new AwsSqsTransport({
      errorVisibilityTimeout: 0,
      waitTimeSeconds: 1,
    });

    let attempt = 0;
    const callback = vi.fn(async (msg: string) => {
      attempt++;
      if (attempt === 1) {
        throw new Error('First attempt failed');
      }
      // Second attempt succeeds
    });

    mockSend.mockResolvedValueOnce({
      QueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/retry-queue',
    });
    await transport.registerListener('retry-channel', callback);

    // First receive
    mockSend.mockResolvedValueOnce({
      Messages: [{ MessageId: 'msg-retry', Body: 'Retry Message', ReceiptHandle: 'receipt-1' }],
    });
    // ChangeMessageVisibility after error
    mockSend.mockResolvedValueOnce({});
    // Second receive (retry)
    mockSend.mockResolvedValueOnce({
      Messages: [{ MessageId: 'msg-retry', Body: 'Retry Message', ReceiptHandle: 'receipt-2' }],
    });
    // Delete after success
    mockSend.mockResolvedValueOnce({});
    mockSend.mockImplementation(async (command: any) => {
      await sleep(100); // Simulate network delay
      return { Messages: [] };
    });

    await transport.startListening();
    await sleep(800);
    await transport.stopListening();

    expect(callback).toHaveBeenCalledTimes(2);
  });
});
