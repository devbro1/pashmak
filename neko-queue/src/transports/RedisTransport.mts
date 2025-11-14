import { QueueTransportInterface } from '../Interfaces.mjs';
import { createClient, RedisClientType } from 'redis';

/**
 * Configuration options for the Redis transport.
 */
export type RedisTransportConfig = {
  /** Redis connection URL. Defaults to REDIS_URL environment variable or 'redis://localhost:6379'. */
  url?: string;
  /** Redis host. Defaults to 'localhost'. */
  host?: string;
  /** Redis port. Defaults to 6379. */
  port?: number;
  /** Redis password for authentication. */
  password?: string;
  /** Redis database number. Defaults to 0. */
  database?: number;
  /** Redis username for authentication. */
  username?: string;
  /** Key prefix for all Redis keys. Defaults to 'neko-queue'. */
  keyPrefix?: string;
  /** Maximum number of retry attempts. Defaults to 3. */
  maxRetries?: number;
  /** Delay before retrying on failover (in milliseconds). Defaults to 100. */
  retryDelayOnFailover?: number;
  /** Connection timeout (in milliseconds). Defaults to 10000. */
  connectTimeout?: number;
  /** Whether to connect lazily. Defaults to true. */
  lazyConnect?: boolean;
  /** Polling interval (in milliseconds) for checking messages. Defaults to 1000. */
  pollInterval?: number;
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
  /** Polling interval ID. */
  intervalId?: NodeJS.Timeout;
};

/**
 * Redis-based queue transport implementation.
 * Uses Redis lists for message queuing and pub/sub for real-time notifications.
 */
export class RedisTransport implements QueueTransportInterface {
  private readonly config: Required<
    Omit<RedisTransportConfig, 'url' | 'host' | 'port' | 'password' | 'username' | 'onError'>
  > &
    Pick<RedisTransportConfig, 'url' | 'host' | 'port' | 'password' | 'username' | 'onError'>;
  private client: RedisClientType | undefined = undefined;
  private subscriber: RedisClientType | undefined = undefined;
  private readonly listeners = new Map<string, ListenerInfo>();
  private listening = false;
  private connecting = false;

  /**
   * Creates a new Redis transport instance.
   * @param config - Configuration options for the Redis transport
   */
  constructor(config: RedisTransportConfig = {}) {
    this.config = {
      url: config.url,
      host: config.host,
      port: config.port,
      password: config.password,
      username: config.username,
      database: config.database ?? 0,
      keyPrefix: config.keyPrefix ?? 'neko-queue',
      maxRetries: config.maxRetries ?? 3,
      retryDelayOnFailover: config.retryDelayOnFailover ?? 100,
      connectTimeout: config.connectTimeout ?? 10000,
      lazyConnect: config.lazyConnect ?? true,
      pollInterval: config.pollInterval ?? 1000,
      onError: config.onError,
    };
  }

  /**
   * Establishes connection to Redis server and creates subscriber client.
   */
  private async ensureConnection(): Promise<void> {
    if (this.client && this.subscriber && this.client.isOpen && this.subscriber.isOpen) {
      return;
    }

    if (this.connecting) {
      // Wait for existing connection attempt
      while (this.connecting) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      if (this.client && this.subscriber && this.client.isOpen && this.subscriber.isOpen) {
        return;
      }
    }

    this.connecting = true;

    try {
      const clientConfig: any = {
        database: this.config.database,
        socket: {
          connectTimeout: this.config.connectTimeout,
          reconnectStrategy: (retries: number) => {
            if (retries > this.config.maxRetries) {
              return new Error('Max retries reached');
            }
            return Math.min(retries * this.config.retryDelayOnFailover, 3000);
          },
        },
      };

      // Use URL if provided, otherwise use host/port
      if (this.config.url) {
        clientConfig.url = this.config.url;
      } else {
        clientConfig.socket.host = this.config.host ?? 'localhost';
        clientConfig.socket.port = this.config.port ?? 6379;
      }

      // Add authentication if provided
      if (this.config.password) {
        clientConfig.password = this.config.password;
      }

      if (this.config.username) {
        clientConfig.username = this.config.username;
      }

      // Create main client
      this.client = createClient(clientConfig);
      this.subscriber = createClient(clientConfig);

      // Set up error handlers
      this.client.on('error', (error: Error) => {
        this.handleError(error, {});
      });

      this.subscriber.on('error', (error: Error) => {
        this.handleError(error, {});
      });

      // Connect clients
      await Promise.all([this.client.connect(), this.subscriber.connect()]);
    } finally {
      this.connecting = false;
    }
  }

  /**
   * Resolves the Redis key for a queue.
   * @param channel - The channel name
   * @returns The Redis key for the queue
   */
  private getQueueKey(channel: string): string {
    return `${this.config.keyPrefix}:queue:${channel}`;
  }

  /**
   * Resolves the Redis key for processing list.
   * @param channel - The channel name
   * @returns The Redis key for the processing list
   */
  private getProcessingKey(channel: string): string {
    return `${this.config.keyPrefix}:processing:${channel}`;
  }

  /**
   * Resolves the Redis key for pub/sub notifications.
   * @param channel - The channel name
   * @returns The Redis key for notifications
   */
  private getNotificationKey(channel: string): string {
    return `${this.config.keyPrefix}:notify:${channel}`;
  }

  /**
   * Generates a unique message ID.
   * @returns A unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Dispatches a message to the specified channel (Redis list).
   * @param channel - The channel (queue) name to send the message to
   * @param message - The message content as a string
   */
  async dispatch(channel: string, message: string): Promise<void> {
    await this.ensureConnection();

    if (!this.client) {
      throw new Error('Redis client not available');
    }

    const queueKey = this.getQueueKey(channel);
    const notificationKey = this.getNotificationKey(channel);

    const queueMessage = {
      id: this.generateMessageId(),
      content: message,
      timestamp: Date.now(),
      attempts: 0,
    };

    // Add message to queue
    await this.client.lPush(queueKey, JSON.stringify(queueMessage));

    // Notify listeners that a new message is available
    await this.client.publish(notificationKey, '1');
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
      return;
    }

    const listener: ListenerInfo = { callback };
    this.listeners.set(channel, listener);

    if (this.listening) {
      await this.startChannelProcessing(channel, listener);
    }
  }

  /**
   * Starts processing messages for a specific channel.
   * @param channel - The channel (queue) name
   * @param listener - The listener info containing the callback
   */
  private async startChannelProcessing(channel: string, listener: ListenerInfo): Promise<void> {
    await this.ensureConnection();

    if (!this.client || !this.subscriber) {
      throw new Error('Redis clients not available');
    }

    const notificationKey = this.getNotificationKey(channel);

    // Subscribe to pub/sub notifications
    await this.subscriber.subscribe(notificationKey, () => {
      this.processChannelMessages(channel, listener);
    });

    // Start polling interval as backup
    listener.intervalId = setInterval(() => {
      if (this.listening) {
        this.processChannelMessages(channel, listener);
      }
    }, this.config.pollInterval);

    // Process any existing messages
    this.processChannelMessages(channel, listener);
  }

  /**
   * Processes messages from a channel queue.
   * @param channel - The channel (queue) name
   * @param listener - The listener info containing the callback
   */
  private async processChannelMessages(channel: string, listener: ListenerInfo): Promise<void> {
    if (!this.client) {
      return;
    }

    const queueKey = this.getQueueKey(channel);
    const processingKey = this.getProcessingKey(channel);

    try {
      // Move message from queue to processing list atomically
      const messageData = await this.client.rPopLPush(queueKey, processingKey);

      if (!messageData) {
        return; // No messages available
      }

      let queueMessage: any;
      try {
        queueMessage = JSON.parse(messageData);
      } catch (parseError) {
        // Remove malformed message from processing
        await this.client.lRem(processingKey, 1, messageData);
        return;
      }

      try {
        queueMessage.attempts++;

        await listener.callback(queueMessage.content);

        // Message processed successfully, remove from processing list
        await this.client.lRem(processingKey, 1, messageData);
      } catch (error) {
        this.handleError(error, {
          channel,
          messageId: queueMessage.id,
          body: queueMessage.content,
        });

        // Remove from processing list
        await this.client.lRem(processingKey, 1, messageData);

        // Retry logic: put message back in queue
        if (queueMessage.attempts < this.config.maxRetries) {
          await this.client.lPush(queueKey, JSON.stringify(queueMessage));
        } else {
          // Max retries exceeded, handle failed message
          await this.handleFailedMessage(channel, queueMessage, error as Error);
        }
      }
    } catch (error) {
      this.handleError(error, { channel });
    }
  }

  /**
   * Handles a message that exceeded max retries.
   * @param channel - The channel name
   * @param message - The failed message
   * @param error - The error that caused the failure
   */
  private async handleFailedMessage(channel: string, message: any, error: Error): Promise<void> {
    if (!this.client) {
      return;
    }

    const deadLetterKey = `${this.config.keyPrefix}:failed:${channel}`;
    const failedMessage = {
      ...message,
      failedAt: Date.now(),
      error: error.message,
      stack: error.stack,
    };

    try {
      await this.client.lPush(deadLetterKey, JSON.stringify(failedMessage));

      // Set expiration on failed messages (7 days)
      await this.client.expire(deadLetterKey, 604800);
    } catch (err) {
      this.handleError(err, { channel, messageId: message.id });
    }
  }

  /**
   * Starts listening for messages on all registered channels.
   * Initiates polling and pub/sub for each registered listener.
   */
  async startListening(): Promise<void> {
    if (this.listening) {
      return;
    }

    this.listening = true;

    await this.ensureConnection();

    // Start processing for all registered listeners
    await Promise.all(
      Array.from(this.listeners.entries()).map(([channel, listener]) =>
        this.startChannelProcessing(channel, listener)
      )
    );
  }

  /**
   * Stops listening for messages on all channels.
   * Cancels all polling intervals and closes connections.
   */
  async stopListening(): Promise<void> {
    if (!this.listening) {
      return;
    }

    this.listening = false;

    // Stop all polling intervals
    for (const listener of this.listeners.values()) {
      if (listener.intervalId) {
        clearInterval(listener.intervalId);
        listener.intervalId = undefined;
      }
    }

    // Unsubscribe from all channels
    if (this.subscriber) {
      for (const channel of this.listeners.keys()) {
        const notificationKey = this.getNotificationKey(channel);
        try {
          await this.subscriber.unsubscribe(notificationKey);
        } catch (error) {
          this.handleError(error, { channel });
        }
      }
    }

    // Close connections
    if (this.client) {
      await this.client.quit();
      this.client = undefined;
    }

    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = undefined;
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
    console.error('[RedisTransport] Error', {
      channel: context.channel,
      messageId: context.messageId,
      message: err.message,
    });
  }

  /**
   * Gets the number of messages in a queue.
   * @param channel - The channel name
   * @returns The queue length
   */
  async getQueueLength(channel: string): Promise<number> {
    await this.ensureConnection();
    if (!this.client) {
      throw new Error('Redis client not available');
    }
    const queueKey = this.getQueueKey(channel);
    return await this.client.lLen(queueKey);
  }

  /**
   * Gets the number of messages being processed.
   * @param channel - The channel name
   * @returns The processing list length
   */
  async getProcessingLength(channel: string): Promise<number> {
    await this.ensureConnection();
    if (!this.client) {
      throw new Error('Redis client not available');
    }
    const processingKey = this.getProcessingKey(channel);
    return await this.client.lLen(processingKey);
  }

  /**
   * Gets the number of failed messages.
   * @param channel - The channel name
   * @returns The failed messages count
   */
  async getFailedLength(channel: string): Promise<number> {
    await this.ensureConnection();
    if (!this.client) {
      throw new Error('Redis client not available');
    }
    const deadLetterKey = `${this.config.keyPrefix}:failed:${channel}`;
    return await this.client.lLen(deadLetterKey);
  }
}
