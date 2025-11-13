import { QueueTransportInterface } from '../Interfaces.mjs';
import {
  ChangeMessageVisibilityCommand,
  CreateQueueCommand,
  DeleteMessageCommand,
  GetQueueUrlCommand,
  ReceiveMessageCommand,
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import type { SQSClientConfig } from '@aws-sdk/client-sqs';

/**
 * Configuration options for the SQS transport.
 */
export type AwsSqsTransportConfig = {
  /** Pre-configured SQS client instance. If not provided, a new client will be created. */
  client?: SQSClient;
  /** AWS region for the SQS client. Defaults to AWS_REGION environment variable or 'us-east-1'. */
  region?: string;
  /** Custom endpoint URL for SQS (useful for local development with LocalStack). */
  endpoint?: string;
  /** AWS credentials for authentication. */
  credentials?: SQSClientConfig['credentials'];
  /** Prefix to prepend to all queue names. */
  queueNamePrefix?: string;
  /** Maximum wait time (in seconds) for long polling. Defaults to 20. */
  waitTimeSeconds?: number;
  /** Maximum number of messages to retrieve per request. Defaults to 10. */
  maxNumberOfMessages?: number;
  /** Visibility timeout (in seconds) for messages during processing. Defaults to 30. */
  visibilityTimeout?: number;
  /** Visibility timeout (in seconds) to set when message processing fails. Set to 0 for immediate retry. Defaults to 0. */
  errorVisibilityTimeout?: number;
  /** Interval (in milliseconds) between polls when no messages are received. Defaults to 5000. */
  pollIntervalMs?: number;
  /** Backoff delay (in milliseconds) after an error occurs. Defaults to 2000. */
  errorBackoffMs?: number;
  /** Whether to automatically create queues if they don't exist. Defaults to true. */
  createQueue?: boolean;
  /** Additional queue attributes to set when creating queues. */
  queueAttributes?: Record<string, string>;
  /** Message group ID for FIFO queues. If not set, the channel name will be used. */
  messageGroupId?: string;
  /** Custom error handler callback. */
  onError?: (error: Error, context: { channel: string; messageId?: string; body?: string }) => void;
};

/**
 * Internal type representing a registered listener for a channel.
 */
type ListenerInfo = {
  /** Callback function to process messages. */
  callback: (message: string) => Promise<void>;
  /** Cached queue URL for the channel. */
  queueUrl?: string;
};

/**
 * Internal type representing an active polling task.
 */
type PollerInfo = {
  /** Abort controller for stopping the polling loop. */
  controller: AbortController;
  /** Promise representing the polling task. */
  promise: Promise<void>;
};

/**
 * AWS SQS-based queue transport implementation.
 * Provides message dispatching, listener registration, and long-polling with automatic retries.
 */
export class AwsSqsTransport implements QueueTransportInterface {
  private readonly client: SQSClient;
  private readonly config: Required<
    Omit<
      AwsSqsTransportConfig,
      | 'client'
      | 'endpoint'
      | 'messageGroupId'
      | 'onError'
      | 'credentials'
      | 'errorVisibilityTimeout'
    >
  > &
    Pick<
      AwsSqsTransportConfig,
      'endpoint' | 'messageGroupId' | 'onError' | 'credentials' | 'errorVisibilityTimeout'
    >;
  private readonly queueUrls = new Map<string, string>();
  private readonly queueUrlPromises = new Map<string, Promise<string>>();
  private readonly listeners = new Map<string, ListenerInfo>();
  private readonly pollers = new Map<string, PollerInfo>();
  private listening = false;

  /**
   * Creates a new SQS transport instance.
   * @param config - Configuration options for the SQS transport
   */
  constructor(config: AwsSqsTransportConfig = {}) {
    this.config = {
      region: config.region ?? process.env.AWS_REGION ?? 'us-east-1',
      endpoint: config.endpoint ?? process.env.AWS_SQS_ENDPOINT,
      waitTimeSeconds: config.waitTimeSeconds ?? 20,
      maxNumberOfMessages: config.maxNumberOfMessages ?? 10,
      visibilityTimeout: config.visibilityTimeout ?? 30,
      errorVisibilityTimeout: config.errorVisibilityTimeout ?? 0,
      pollIntervalMs: config.pollIntervalMs ?? 5_000,
      errorBackoffMs: config.errorBackoffMs ?? 2_000,
      createQueue: config.createQueue ?? true,
      queueNamePrefix: config.queueNamePrefix ?? '',
      queueAttributes: { ...(config.queueAttributes ?? {}) },
      messageGroupId: config.messageGroupId,
      onError: config.onError,
      credentials: config.credentials,
    };

    if (config.client) {
      this.client = config.client;
    } else {
      const clientConfig: SQSClientConfig = {
        region: this.config.region,
      };
      if (this.config.endpoint) {
        clientConfig.endpoint = this.config.endpoint;
      }
      if (this.config.credentials) {
        clientConfig.credentials = this.config.credentials;
      }
      this.client = new SQSClient(clientConfig);
    }
  }

  /**
   * Dispatches a message to the specified channel (SQS queue).
   * @param channel - The channel (queue) name to send the message to
   * @param message - The message content as a string
   */
  async dispatch(channel: string, message: string): Promise<void> {
    const queueUrl = await this.ensureQueueUrl(channel);
    const queueName = this.resolveQueueName(channel);
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: message,
      MessageGroupId: queueName.endsWith('.fifo')
        ? (this.config.messageGroupId ?? channel)
        : undefined,
    });
    await this.client.send(command);
  }

  /**
   * Registers a listener callback for a specific channel.
   * If listening has already started, begins polling immediately.
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
      existing.queueUrl = existing.queueUrl ?? (await this.ensureQueueUrl(channel));
      if (this.listening) {
        this.startPolling(channel, existing);
      }
      return;
    }

    const listener: ListenerInfo = { callback };
    this.listeners.set(channel, listener);
    listener.queueUrl = await this.ensureQueueUrl(channel);
    if (this.listening) {
      this.startPolling(channel, listener);
    }
  }

  /**
   * Starts listening for messages on all registered channels.
   * Initiates long-polling loops for each registered listener.
   */
  async startListening(): Promise<void> {
    if (this.listening) {
      return;
    }
    this.listening = true;

    await Promise.all(
      Array.from(this.listeners.entries()).map(async ([channel, listener]) => {
        listener.queueUrl = listener.queueUrl ?? (await this.ensureQueueUrl(channel));
        this.startPolling(channel, listener);
      })
    );
  }

  /**
   * Stops listening for messages on all channels.
   * Aborts all active polling loops and waits for them to complete.
   */
  async stopListening(): Promise<void> {
    if (!this.listening && this.pollers.size === 0) {
      return;
    }

    this.listening = false;
    const pollerEntries = Array.from(this.pollers.entries());
    this.pollers.clear();

    for (const [, { controller }] of pollerEntries) {
      controller.abort();
    }

    await Promise.all(pollerEntries.map(([, { promise }]) => promise.catch(() => undefined)));
  }

  /**
   * Starts a polling loop for a specific channel.
   * @param channel - The channel (queue) name to poll
   * @param listener - The listener info containing the callback and queue URL
   */
  private startPolling(channel: string, listener: ListenerInfo): void {
    if (this.pollers.has(channel)) {
      return;
    }
    const controller = new AbortController();
    const pollPromise = this.pollLoop(channel, listener, controller.signal)
      .catch((error) => {
        if (!this.isAbortError(error)) {
          this.handleError(error, channel);
        }
      })
      .finally(() => {
        const current = this.pollers.get(channel);
        if (current && current.controller === controller) {
          this.pollers.delete(channel);
        }
      });

    this.pollers.set(channel, { controller, promise: pollPromise });
  }

  /**
   * Main polling loop that continuously receives and processes messages from SQS.
   * Uses long-polling to efficiently wait for messages.
   * @param channel - The channel (queue) name being polled
   * @param listener - The listener info containing the callback
   * @param signal - Abort signal to stop the polling loop
   */
  private async pollLoop(
    channel: string,
    listener: ListenerInfo,
    signal: AbortSignal
  ): Promise<void> {
    let queueUrl: string = listener.queueUrl ?? (await this.ensureQueueUrl(channel));
    let counter = 0;

    while (!signal.aborted && this.listening) {
      console.log('looping', counter++);
      try {
        const receiveCommand = new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: this.config.maxNumberOfMessages,
          WaitTimeSeconds: this.config.waitTimeSeconds,
          VisibilityTimeout: this.config.visibilityTimeout,
        });
        console.log('looping A');
        const response = await this.client.send(receiveCommand, { abortSignal: signal });
        console.log('looping B');
        const messages = response.Messages ?? [];

        console.log('looping', counter++, messages.length, signal.aborted, this.listening);
        if (messages.length === 0 || signal.aborted || !this.listening) {
          continue;
        }

        for (const sqsMessage of messages) {
          const body = sqsMessage.Body ?? '';
          try {
            await listener.callback(body);
            if (sqsMessage.ReceiptHandle) {
              const deleteCommand = new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: sqsMessage.ReceiptHandle,
              });
              await this.client.send(deleteCommand, { abortSignal: signal });
            }
          } catch (processingError) {
            this.handleError(processingError, channel, body, sqsMessage.MessageId);
            if (sqsMessage.ReceiptHandle && this.config.errorVisibilityTimeout !== undefined) {
              try {
                const visibilityCommand = new ChangeMessageVisibilityCommand({
                  QueueUrl: queueUrl,
                  ReceiptHandle: sqsMessage.ReceiptHandle,
                  VisibilityTimeout: this.config.errorVisibilityTimeout,
                });
                await this.client.send(visibilityCommand, { abortSignal: signal });
              } catch (visibilityError) {
                this.handleError(visibilityError, channel, body, sqsMessage.MessageId);
              }
            }
          }
        }
      } catch (error) {
        if (this.isAbortError(error) || signal.aborted) {
          return;
        }
        this.handleError(error, channel);
      }
    }
    console.log('finished looping');
  }

  /**
   * Ensures a queue URL is available for the specified channel, using cache when possible.
   * Prevents duplicate lookups for the same channel by deduplicating concurrent requests.
   * @param channel - The channel (queue) name
   * @returns The queue URL
   */
  private async ensureQueueUrl(channel: string): Promise<string> {
    const cached = this.queueUrls.get(channel);
    if (cached) {
      return cached;
    }

    const pending = this.queueUrlPromises.get(channel);
    if (pending) {
      return pending;
    }

    const promise = this.lookupQueueUrl(channel);
    this.queueUrlPromises.set(channel, promise);

    try {
      const queueUrl = await promise;
      this.queueUrls.set(channel, queueUrl);
      const listener = this.listeners.get(channel);
      if (listener) {
        listener.queueUrl = queueUrl;
      }
      return queueUrl;
    } finally {
      this.queueUrlPromises.delete(channel);
    }
  }

  /**
   * Looks up the queue URL for a channel, creating the queue if it doesn't exist and auto-creation is enabled.
   * @param channel - The channel (queue) name
   * @returns The queue URL
   * @throws Error if the queue doesn't exist and auto-creation is disabled
   */
  private async lookupQueueUrl(channel: string): Promise<string> {
    const queueName = this.resolveQueueName(channel);

    try {
      const result = await this.client.send(new GetQueueUrlCommand({ QueueName: queueName }));
      if (!result.QueueUrl) {
        throw new Error(`SQS did not return a queue URL for ${queueName}`);
      }
      return result.QueueUrl;
    } catch (error) {
      if (!this.config.createQueue || !this.isQueueNotFoundError(error)) {
        throw error;
      }

      const attributes = this.buildQueueAttributes(queueName);
      const result = await this.client.send(
        new CreateQueueCommand({ QueueName: queueName, Attributes: attributes })
      );

      if (!result.QueueUrl) {
        throw new Error(`Failed to create queue URL for ${queueName}`);
      }
      return result.QueueUrl;
    }
  }

  /**
   * Resolves the full queue name by applying the configured prefix to the channel name.
   * @param channel - The channel name
   * @returns The full queue name with prefix
   */
  private resolveQueueName(channel: string): string {
    return `${this.config.queueNamePrefix}${channel}`;
  }

  /**
   * Builds queue attributes for queue creation, including FIFO-specific settings.
   * @param queueName - The queue name to build attributes for
   * @returns Queue attributes as key-value pairs
   */
  private buildQueueAttributes(queueName: string): Record<string, string> {
    const attributes: Record<string, string> = { ...this.config.queueAttributes };

    if (!attributes.VisibilityTimeout) {
      attributes.VisibilityTimeout = String(this.config.visibilityTimeout);
    }

    if (queueName.endsWith('.fifo')) {
      attributes.FifoQueue = 'true';
      if (!attributes.ContentBasedDeduplication) {
        attributes.ContentBasedDeduplication = 'true';
      }
    }

    return attributes;
  }

  /**
   * Checks if an error indicates that a queue does not exist.
   * @param error - The error to check
   * @returns True if the error indicates a non-existent queue
   */
  private isQueueNotFoundError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const err = error as { name?: string; Code?: string; message?: string };
    return (
      err.name === 'QueueDoesNotExist' ||
      err.Code === 'AWS.SimpleQueueService.NonExistentQueue' ||
      (typeof err.message === 'string' && err.message.includes('NonExistentQueue'))
    );
  }

  /**
   * Checks if an error is an abort error from a cancelled operation.
   * @param error - The error to check
   * @returns True if the error is an AbortError
   */
  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
  }

  /**
   * Handles errors that occur during message processing or polling.
   * Uses custom error handler if configured, otherwise logs to console.
   * @param error - The error that occurred
   * @param channel - The channel where the error occurred
   * @param body - Optional message body that caused the error
   * @param messageId - Optional SQS message ID
   */
  private handleError(error: unknown, channel: string, body?: string, messageId?: string): void {
    const err = error instanceof Error ? error : new Error('Unknown error');

    if (this.config.onError) {
      this.config.onError(err, { channel, body, messageId });
      return;
    }

    // eslint-disable-next-line no-console
    console.error('[SqsTransport] Error', { channel, messageId, message: err.message });
  }
}
