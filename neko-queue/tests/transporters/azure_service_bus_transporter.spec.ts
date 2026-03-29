import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AzureServiceBusTransport } from '../../src/transports/AzureServiceBusTransport.mjs';

// Mock @azure/service-bus
vi.mock('@azure/service-bus', () => {
  const mockSender = {
    sendMessages: vi.fn(),
    close: vi.fn(),
  };

  const mockReceiver = {
    subscribe: vi.fn(),
    completeMessage: vi.fn(),
    abandonMessage: vi.fn(),
    close: vi.fn(),
  };

  const mockClient = {
    createSender: vi.fn(() => mockSender),
    createReceiver: vi.fn(() => mockReceiver),
    close: vi.fn(),
  };

  return {
    ServiceBusClient: vi.fn(() => mockClient),
  };
});

describe('AzureServiceBusTransport', () => {
  let transport: AzureServiceBusTransport;
  let ServiceBusClient: any;
  let mockClient: any;
  let mockSender: any;
  let mockReceiver: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('@azure/service-bus');
    ServiceBusClient = module.ServiceBusClient;
    mockClient = new ServiceBusClient();
    mockSender = mockClient.createSender();
    mockReceiver = mockClient.createReceiver();
    vi.clearAllMocks();
  });

  describe('Configuration and Initialization', () => {
    it('should create instance with default config', () => {
      transport = new AzureServiceBusTransport();
      expect(transport).toBeInstanceOf(AzureServiceBusTransport);
    });

    it('should create instance with custom config', () => {
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
        queuePrefix: 'test-prefix',
        maxConcurrentCalls: 5,
      });
      expect(transport).toBeInstanceOf(AzureServiceBusTransport);
    });

    it('should use environment variable for connection string', () => {
      process.env.AZURE_SERVICE_BUS_CONNECTION_STRING =
        'Endpoint=sb://env.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key';
      transport = new AzureServiceBusTransport();
      expect(transport).toBeInstanceOf(AzureServiceBusTransport);
      delete process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;
    });

    it('should throw error when dispatching without connection string', async () => {
      transport = new AzureServiceBusTransport({});
      await expect(transport.dispatch('test-channel', 'message')).rejects.toThrow(
        'Azure Service Bus connection string is required'
      );
    });

    it('should initialize client lazily on first operation', async () => {
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
      });
      expect(ServiceBusClient).not.toHaveBeenCalled();
      await transport.dispatch('test-channel', 'message');
      expect(ServiceBusClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sender Management', () => {
    beforeEach(() => {
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
      });
    });

    it('should create sender for new queue', async () => {
      await transport.dispatch('test-channel', 'message');
      expect(mockClient.createSender).toHaveBeenCalledWith('neko-queue-test-channel');
      expect(mockClient.createSender).toHaveBeenCalledTimes(1);
    });

    it('should reuse sender for same queue', async () => {
      await transport.dispatch('test-channel', 'message1');
      await transport.dispatch('test-channel', 'message2');
      expect(mockClient.createSender).toHaveBeenCalledTimes(1);
    });

    it('should create separate senders for different queues', async () => {
      await transport.dispatch('channel1', 'message1');
      await transport.dispatch('channel2', 'message2');
      expect(mockClient.createSender).toHaveBeenCalledTimes(2);
      expect(mockClient.createSender).toHaveBeenNthCalledWith(1, 'neko-queue-channel1');
      expect(mockClient.createSender).toHaveBeenNthCalledWith(2, 'neko-queue-channel2');
    });

    it('should use custom queue prefix', async () => {
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
        queuePrefix: 'custom',
      });
      await transport.dispatch('test-channel', 'message');
      expect(mockClient.createSender).toHaveBeenCalledWith('custom-test-channel');
    });
  });

  describe('Message Dispatch', () => {
    beforeEach(() => {
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
      });
    });

    it('should send message to queue', async () => {
      await transport.dispatch('test-channel', 'test-message');
      expect(mockSender.sendMessages).toHaveBeenCalledWith({
        body: 'test-message',
        contentType: 'text/plain',
      });
    });

    it('should send message with TTL when configured', async () => {
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
        messageTtl: 60000,
      });
      await transport.dispatch('test-channel', 'test-message');
      expect(mockSender.sendMessages).toHaveBeenCalledWith({
        body: 'test-message',
        contentType: 'text/plain',
        timeToLive: 60000,
      });
    });

    it('should handle dispatch errors with custom error handler', async () => {
      const errorHandler = vi.fn();
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
        onError: errorHandler,
      });

      const testError = new Error('Send failed');
      mockSender.sendMessages.mockRejectedValueOnce(testError);

      await expect(transport.dispatch('test-channel', 'test-message')).rejects.toThrow(
        'Send failed'
      );
      expect(errorHandler).toHaveBeenCalledWith(testError, {
        channel: 'test-channel',
        body: 'test-message',
      });
    });
  });

  describe('Receiver Management', () => {
    beforeEach(() => {
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
      });
    });

    it('should create receiver when starting to listen', async () => {
      await transport.registerListener('test-channel', async () => {});
      await transport.startListening();
      expect(mockClient.createReceiver).toHaveBeenCalledWith('neko-queue-test-channel', {
        receiveMode: 'peekLock',
        maxAutoLockRenewalDurationInMs: 300000,
      });
    });

    it('should create receiver with receiveAndDelete mode when auto-complete enabled', async () => {
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
        autoCompleteMessages: true,
      });
      await transport.registerListener('test-channel', async () => {});
      await transport.startListening();
      expect(mockClient.createReceiver).toHaveBeenCalledWith('neko-queue-test-channel', {
        receiveMode: 'receiveAndDelete',
        maxAutoLockRenewalDurationInMs: 300000,
      });
    });

    it('should create receiver with custom max auto lock renewal duration', async () => {
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
        maxAutoLockRenewalDurationInMs: 600000,
      });
      await transport.registerListener('test-channel', async () => {});
      await transport.startListening();
      expect(mockClient.createReceiver).toHaveBeenCalledWith('neko-queue-test-channel', {
        receiveMode: 'peekLock',
        maxAutoLockRenewalDurationInMs: 600000,
      });
    });
  });

  describe('Listener Registration', () => {
    beforeEach(() => {
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
      });
    });

    it('should register listener before starting', async () => {
      const callback = vi.fn();
      await transport.registerListener('test-channel', callback);
      expect(mockReceiver.subscribe).not.toHaveBeenCalled();
    });

    it('should start receiver immediately if already listening', async () => {
      await transport.startListening();
      const callback = vi.fn();
      await transport.registerListener('test-channel', callback);
      expect(mockReceiver.subscribe).toHaveBeenCalled();
    });

    it('should update callback for existing listener', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      await transport.registerListener('test-channel', callback1);
      await transport.registerListener('test-channel', callback2);
      await transport.startListening();
      expect(mockClient.createReceiver).toHaveBeenCalledTimes(1);
    });

    it('should register multiple listeners for different channels', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      await transport.registerListener('channel1', callback1);
      await transport.registerListener('channel2', callback2);
      await transport.startListening();
      expect(mockClient.createReceiver).toHaveBeenCalledTimes(2);
    });
  });

  describe('Message Processing', () => {
    beforeEach(() => {
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
      });
    });

    it('should process received message successfully', async () => {
      const callback = vi.fn();
      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      const subscribeCall = mockReceiver.subscribe.mock.calls[0];
      const handlers = subscribeCall[0];

      const message = {
        messageId: 'msg-123',
        body: 'test-message',
      };

      await handlers.processMessage(message);

      expect(callback).toHaveBeenCalledWith('test-message');
      expect(mockReceiver.completeMessage).toHaveBeenCalledWith(message);
    });

    it('should abandon message on processing error in peekLock mode', async () => {
      const callback = vi.fn().mockRejectedValue(new Error('Processing failed'));
      const errorHandler = vi.fn();

      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
        onError: errorHandler,
      });

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      const subscribeCall = mockReceiver.subscribe.mock.calls[0];
      const handlers = subscribeCall[0];

      const message = {
        messageId: 'msg-123',
        body: 'test-message',
      };

      await handlers.processMessage(message);

      expect(mockReceiver.completeMessage).not.toHaveBeenCalled();
      expect(mockReceiver.abandonMessage).toHaveBeenCalledWith(message);
      expect(errorHandler).toHaveBeenCalled();
    });

    it('should not complete/abandon in receiveAndDelete mode', async () => {
      const callback = vi.fn();
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
        autoCompleteMessages: true,
      });

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      const subscribeCall = mockReceiver.subscribe.mock.calls[0];
      const handlers = subscribeCall[0];

      const message = {
        messageId: 'msg-123',
        body: 'test-message',
      };

      await handlers.processMessage(message);

      expect(callback).toHaveBeenCalledWith('test-message');
      expect(mockReceiver.completeMessage).not.toHaveBeenCalled();
    });

    it('should handle object body with JSON.stringify', async () => {
      const callback = vi.fn();
      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      const subscribeCall = mockReceiver.subscribe.mock.calls[0];
      const handlers = subscribeCall[0];

      const message = {
        messageId: 'msg-123',
        body: { key: 'value' },
      };

      await handlers.processMessage(message);

      expect(callback).toHaveBeenCalledWith(JSON.stringify({ key: 'value' }));
    });

    it('should handle processError callback', async () => {
      const errorHandler = vi.fn();
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
        onError: errorHandler,
      });

      await transport.registerListener('test-channel', async () => {});
      await transport.startListening();

      const subscribeCall = mockReceiver.subscribe.mock.calls[0];
      const handlers = subscribeCall[0];

      const testError = new Error('Receiver error');
      await handlers.processError({ error: testError });

      expect(errorHandler).toHaveBeenCalledWith(testError, { channel: 'test-channel' });
    });

    it('should pass maxConcurrentCalls to subscribe options', async () => {
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
        maxConcurrentCalls: 10,
      });

      await transport.registerListener('test-channel', async () => {});
      await transport.startListening();

      const subscribeCall = mockReceiver.subscribe.mock.calls[0];
      const options = subscribeCall[1];

      expect(options).toEqual({
        maxConcurrentCalls: 10,
        autoCompleteMessages: false,
      });
    });
  });

  describe('Lifecycle Management', () => {
    beforeEach(() => {
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
      });
    });

    it('should start listening for all registered listeners', async () => {
      await transport.registerListener('channel1', async () => {});
      await transport.registerListener('channel2', async () => {});
      await transport.startListening();
      expect(mockReceiver.subscribe).toHaveBeenCalledTimes(2);
    });

    it('should not start listening twice', async () => {
      await transport.registerListener('test-channel', async () => {});
      await transport.startListening();
      await transport.startListening();
      expect(mockReceiver.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should close receivers when stopping', async () => {
      await transport.registerListener('test-channel', async () => {});
      await transport.startListening();
      await transport.stopListening();
      expect(mockReceiver.close).toHaveBeenCalled();
    });

    it('should close senders when stopping', async () => {
      await transport.dispatch('test-channel', 'message');
      await transport.stopListening();
      expect(mockSender.close).toHaveBeenCalled();
    });

    it('should close client when stopping', async () => {
      await transport.dispatch('test-channel', 'message');
      await transport.stopListening();
      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should handle errors during stopListening', async () => {
      const errorHandler = vi.fn();
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
        onError: errorHandler,
      });

      await transport.registerListener('test-channel', async () => {});
      await transport.startListening();

      mockReceiver.close.mockRejectedValueOnce(new Error('Close failed'));
      await transport.stopListening();

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should not throw when stopping without starting', async () => {
      await expect(transport.stopListening()).resolves.not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      transport = new AzureServiceBusTransport({
        connectionString:
          'Endpoint=sb://test.servicebus.windows.net/;SharedAccessKeyName=test;SharedAccessKey=key',
      });
    });

    it('should handle full lifecycle with message dispatch and receive', async () => {
      const messages: string[] = [];
      const callback = vi.fn(async (msg: string) => {
        messages.push(msg);
      });

      await transport.registerListener('test-channel', callback);
      await transport.startListening();

      await transport.dispatch('test-channel', 'message1');
      await transport.dispatch('test-channel', 'message2');

      expect(mockSender.sendMessages).toHaveBeenCalledTimes(2);

      const subscribeCall = mockReceiver.subscribe.mock.calls[0];
      const handlers = subscribeCall[0];

      await handlers.processMessage({ messageId: 'msg-1', body: 'message1' });
      await handlers.processMessage({ messageId: 'msg-2', body: 'message2' });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(messages).toEqual(['message1', 'message2']);

      await transport.stopListening();
      expect(mockReceiver.close).toHaveBeenCalled();
      expect(mockSender.close).toHaveBeenCalled();
      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should handle multiple channels concurrently', async () => {
      const channel1Messages: string[] = [];
      const channel2Messages: string[] = [];

      await transport.registerListener('channel1', async (msg: string) => {
        channel1Messages.push(msg);
      });
      await transport.registerListener('channel2', async (msg: string) => {
        channel2Messages.push(msg);
      });

      await transport.startListening();

      await transport.dispatch('channel1', 'msg-c1');
      await transport.dispatch('channel2', 'msg-c2');

      expect(mockClient.createSender).toHaveBeenCalledTimes(2);
      expect(mockClient.createReceiver).toHaveBeenCalledTimes(2);

      await transport.stopListening();
    });

    it('should handle listener registration after start', async () => {
      await transport.startListening();

      const callback = vi.fn();
      await transport.registerListener('late-channel', callback);

      expect(mockClient.createReceiver).toHaveBeenCalledWith(
        'neko-queue-late-channel',
        expect.any(Object)
      );
      expect(mockReceiver.subscribe).toHaveBeenCalled();
    });
  });
});
