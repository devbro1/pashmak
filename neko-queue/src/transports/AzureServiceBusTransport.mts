import { QueueTransportInterface } from '../Interfaces.mjs';
import {
  ServiceBusClient,
  ServiceBusSender,
  ServiceBusReceiver,
  ServiceBusReceivedMessage,
} from '@azure/service-bus';

/**
 * Configuration options for the Azure Service Bus transport.
 */
export type AzureServiceBusTransportConfig = {
  /** Azure Service Bus connection string. Defaults to AZURE_SERVICE_BUS_CONNECTION_STRING environment variable. */
  connectionString?: string;
  /** Queue name prefix to prepend to all queue names. */
  queuePrefix?: string;
  /** Whether to use sessions. Defaults to false. */
  requiresSession?: boolean;
  /** Maximum concurrent calls for message processing. Defaults to 1. */
  maxConcurrentCalls?: number;
  /** Maximum auto lock renewal duration in milliseconds. Defaults to 300000 (5 minutes). */
  maxAutoLockRenewalDurationInMs?: number;
  /** Whether to automatically complete messages after processing. Defaults to false (manual complete). */
  autoCompleteMessages?: boolean;
  /** Message time to live in milliseconds. Defaults to undefined (uses queue default). */
  messageTtl?: number;
  /** Custom error handler callback. */
  onError?: (
    error: Error,
    context: { channel?: string; messageId?: string; body?: string }
  ) => void;
};

/**
 * Internal type representing a registered listener for a channel.
 */
type ListenerInfo = {
  /** Callback function to process messages. */
  callback: (message: string) => Promise<void>;
  /** Azure Service Bus receiver. */
  receiver?: ServiceBusReceiver;
};

/**
 * Azure Service Bus-based queue transport implementation.
 * Provides message sending and receiving using Azure Service Bus queues.
 */
export class AzureServiceBusTransport implements QueueTransportInterface {
  private readonly config: Required<
    Omit<AzureServiceBusTransportConfig, 'connectionString' | 'messageTtl' | 'onError'>
  > &
    Pick<AzureServiceBusTransportConfig, 'connectionString' | 'messageTtl' | 'onError'>;
  private client: ServiceBusClient | undefined = undefined;
  private readonly senders = new Map<string, ServiceBusSender>();
  private readonly listeners = new Map<string, ListenerInfo>();
  private listening = false;

  /**
   * Creates a new Azure Service Bus transport instance.
   * @param config - Configuration options for the Azure Service Bus transport
   */
  constructor(config: AzureServiceBusTransportConfig = {}) {
    this.config = {
      connectionString: config.connectionString ?? process.env.AZURE_SERVICE_BUS_CONNECTION_STRING,
      queuePrefix: config.queuePrefix ?? 'neko-queue',
      requiresSession: config.requiresSession ?? false,
      maxConcurrentCalls: config.maxConcurrentCalls ?? 1,
      maxAutoLockRenewalDurationInMs: config.maxAutoLockRenewalDurationInMs ?? 300000,
      autoCompleteMessages: config.autoCompleteMessages ?? false,
      messageTtl: config.messageTtl,
      onError: config.onError,
    };
  }

  /**
   * Initializes the Service Bus client if not already initialized.
   */
  private ensureClient(): void {
    if (this.client) {
      return;
    }

    if (!this.config.connectionString) {
      throw new Error('Azure Service Bus connection string is required');
    }

    this.client = new ServiceBusClient(this.config.connectionString);
  }

  /**
   * Resolves the queue name with prefix.
   * @param channel - The channel name
   * @returns The full queue name
   */
  private getQueueName(channel: string): string {
    return `${this.config.queuePrefix}-${channel}`;
  }

  /**
   * Gets or creates a sender for the specified channel.
   * @param channel - The channel name
   * @returns The Service Bus sender
   */
  private getSender(channel: string): ServiceBusSender {
    this.ensureClient();

    const queueName = this.getQueueName(channel);
    let sender = this.senders.get(queueName);

    if (sender) {
      return sender;
    }

    sender = this.client!.createSender(queueName);
    this.senders.set(queueName, sender);
    return sender;
  }

  /**
   * Gets or creates a receiver for the specified channel.
   * @param channel - The channel name
   * @returns The Service Bus receiver
   */
  private getReceiver(channel: string): ServiceBusReceiver {
    this.ensureClient();

    const queueName = this.getQueueName(channel);

    return this.client!.createReceiver(queueName, {
      receiveMode: this.config.autoCompleteMessages ? 'receiveAndDelete' : 'peekLock',
      maxAutoLockRenewalDurationInMs: this.config.maxAutoLockRenewalDurationInMs,
    });
  }

  /**
   * Dispatches a message to the specified channel (Service Bus queue).
   * @param channel - The channel (queue) name to send the message to
   * @param message - The message content as a string
   */
  async dispatch(channel: string, message: string): Promise<void> {
    try {
      const sender = this.getSender(channel);
      const messageOptions: any = {
        body: message,
        contentType: 'text/plain',
      };

      if (this.config.messageTtl !== undefined) {
        messageOptions.timeToLive = this.config.messageTtl;
      }

      await sender.sendMessages(messageOptions);
    } catch (error) {
      this.handleError(error, { channel, body: message });
      throw error;
    }
  }

  /**
   * Registers a listener callback for a specific channel.
   * If listening has already started, begins receiving immediately.
   * @param channel - The channel (queue) name to listen to
   * @param callback - Callback function to process received messages
   */
  async registerListener(
    channel: string,
    callback: (message: string) => Promise<void>
  ): Promise<void> {
    const existing = this.listeners.get(channel);
    if (existing) {
      existing.callback = callback;
      return;
    }

    const listener: ListenerInfo = { callback };
    this.listeners.set(channel, listener);

    if (this.listening) {
      await this.startReceiver(channel, listener);
    }
  }

  /**
   * Converts a Service Bus message body to a string.
   * @param body - The message body
   * @returns The body as a string
   */
  private convertBodyToString(body: string | number | Buffer): string {
    if (typeof body === 'string') {
      return body;
    }
    if (Buffer.isBuffer(body)) {
      return body.toString('utf-8');
    }
    return JSON.stringify(body);
  }

  /**
   * Starts receiving messages for a specific channel.
   * @param channel - The channel (queue) name
   * @param listener - The listener info containing the callback
   */
  private async startReceiver(channel: string, listener: ListenerInfo): Promise<void> {
    try {
      const receiver = this.getReceiver(channel);
      listener.receiver = receiver;

      receiver.subscribe(
        {
          processMessage: async (message: ServiceBusReceivedMessage) => {
            const messageId = (message.messageId ?? 'unknown') as string;
            // Convert body to string - inline to help DTS builder with type narrowing
            let bodyString: string;
            if (typeof message.body === 'string') {
              bodyString = message.body;
            } else if (Buffer.isBuffer(message.body)) {
              bodyString = message.body.toString('utf-8');
            } else {
              bodyString = JSON.stringify(message.body);
            }

            try {
              await listener.callback(bodyString);

              if (!this.config.autoCompleteMessages) {
                await receiver.completeMessage(message);
              }
            } catch (error) {
              // Note: body omitted from error context due to TypeScript DTS limitations with type narrowing
              this.handleError(error, { channel, messageId });

              if (!this.config.autoCompleteMessages) {
                await receiver.abandonMessage(message);
              }
            }
          },
          processError: async (args: any) => {
            this.handleError(args.error, { channel });
          },
        },
        {
          maxConcurrentCalls: this.config.maxConcurrentCalls,
          autoCompleteMessages: this.config.autoCompleteMessages,
        }
      );
    } catch (error) {
      this.handleError(error, { channel });
      throw error;
    }
  }

  /**
   * Starts listening for messages on all registered channels.
   * Initiates receivers for each registered listener.
   */
  async startListening(): Promise<void> {
    if (this.listening) {
      return;
    }

    this.listening = true;

    await Promise.all(
      Array.from(this.listeners.entries()).map(([channel, listener]) =>
        this.startReceiver(channel, listener)
      )
    );
  }

  /**
   * Stops listening for messages on all channels.
   * Closes all receivers and senders and cleans up resources.
   */
  async stopListening(): Promise<void> {
    this.listening = false;

    // Close all receivers
    await Promise.all(
      Array.from(this.listeners.values())
        .filter((listener) => listener.receiver)
        .map(async (listener) => {
          try {
            await listener.receiver!.close();
            listener.receiver = undefined;
          } catch (error) {
            this.handleError(error, {});
          }
        })
    );

    // Close all senders
    await Promise.all(
      Array.from(this.senders.values()).map(async (sender) => {
        try {
          await sender.close();
        } catch (error) {
          this.handleError(error, {});
        }
      })
    );
    this.senders.clear();

    // Close client
    if (this.client) {
      try {
        await this.client.close();
      } catch (error) {
        this.handleError(error, {});
      }
      this.client = undefined;
    }
  }

  /**
   * Handles errors that occur during message processing or connection management.
   * Uses custom error handler if configured, otherwise logs to console.
   * @param error - The error that occurred
   * @param context - Context information about where the error occurred
   */
  private handleError(
    error: unknown,
    context: { channel?: string; messageId?: string; body?: string }
  ): void {
    const err = error instanceof Error ? error : new Error('Unknown error');

    if (this.config.onError) {
      this.config.onError(err, context);
      return;
    }

    // eslint-disable-next-line no-console
    console.error('[AzureServiceBusTransport] Error', {
      channel: context.channel,
      messageId: context.messageId,
      message: err.message,
    });
  }
}
