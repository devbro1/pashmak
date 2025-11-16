import { QueueTransportInterface } from '../Interfaces.mjs';
import type { Channel, Connection, ConsumeMessage } from 'amqplib';
import { connect } from 'amqplib';

/**
 * Configuration options for the AMQP transport.
 */
export type AmqpTransportConfig = {
  /** AMQP connection URL. Defaults to AMQP_URL environment variable or 'amqp://localhost'. */
  url?: string;
  /** Exchange name to use. If not provided, messages will be sent directly to queues. */
  exchange?: string;
  /** Exchange type (e.g., 'direct', 'topic', 'fanout', 'headers'). Defaults to 'direct'. */
  exchangeType?: 'direct' | 'topic' | 'fanout' | 'headers';
  /** Whether the exchange should be durable. Defaults to true. */
  exchangeDurable?: boolean;
  /** Whether queues should be durable. Defaults to true. */
  queueDurable?: boolean;
  /** Prefix to prepend to all queue names. */
  queuePrefix?: string;
  /** Whether to auto-delete queues when no consumers exist. Defaults to false. */
  autoDelete?: boolean;
  /** Number of messages to prefetch per consumer. Defaults to 1. */
  prefetchCount?: number;
  /** Whether to automatically acknowledge messages. Defaults to false (manual ack). */
  noAck?: boolean;
  /** Custom error handler callback. */
  onError?: (error: Error, context: { channel?: string; message?: ConsumeMessage }) => void;
};

/**
 * Internal type representing a registered listener for a channel.
 */
type ListenerInfo = {
  /** Callback function to process messages. */
  callback: (message: string) => Promise<void>;
  /** AMQP consumer tag. */
  consumerTag?: string;
};

/**
 * RabbitMQ/AMQP-based queue transport implementation.
 * Provides message dispatching and consumption using AMQP protocol.
 */
export class AmqpTransport implements QueueTransportInterface {
  private readonly config: Required<Omit<AmqpTransportConfig, 'url' | 'exchange' | 'onError'>> &
    Pick<AmqpTransportConfig, 'url' | 'exchange' | 'onError'>;
  private connection: any = undefined;
  private channel: any = undefined;
  private readonly listeners = new Map<string, ListenerInfo>();
  private listening = false;
  private connecting = false;

  /**
   * Creates a new AMQP transport instance.
   * @param config - Configuration options for the AMQP transport
   */
  constructor(config: AmqpTransportConfig = {}) {
    this.config = {
      url: config.url ?? process.env.AMQP_URL ?? 'amqp://localhost',
      exchange: config.exchange,
      exchangeType: config.exchangeType ?? 'direct',
      exchangeDurable: config.exchangeDurable ?? true,
      queueDurable: config.queueDurable ?? true,
      queuePrefix: config.queuePrefix ?? '',
      autoDelete: config.autoDelete ?? false,
      prefetchCount: config.prefetchCount ?? 1,
      noAck: config.noAck ?? false,
      onError: config.onError,
    };
  }

  /**
   * Establishes connection to AMQP broker and creates a channel.
   */
  private async ensureConnection(): Promise<void> {
    if (this.connection && this.channel) {
      return;
    }

    if (this.connecting) {
      // Wait for existing connection attempt
      while (this.connecting) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      if (this.connection && this.channel) {
        return;
      }
    }

    this.connecting = true;

    try {
      this.connection = await connect(this.config.url!);
      this.channel = await this.connection.createChannel();

      await this.channel!.prefetch(this.config.prefetchCount);

      // Set up exchange if configured
      if (this.config.exchange) {
        await this.channel!.assertExchange(this.config.exchange, this.config.exchangeType, {
          durable: this.config.exchangeDurable,
        });
      }

      // Set up connection error handlers
      this.connection!.on('error', (error: Error) => {
        this.handleError(error, {});
        this.connection = undefined;
        this.channel = undefined;
      });

      this.connection!.on('close', () => {
        this.connection = undefined;
        this.channel = undefined;
      });

      this.channel!.on('error', (error: Error) => {
        this.handleError(error, {});
      });
    } finally {
      this.connecting = false;
    }
  }

  /**
   * Resolves the full queue name by applying the configured prefix to the channel name.
   * @param channel - The channel name
   * @returns The full queue name with prefix
   */
  private resolveQueueName(channel: string): string {
    return `${this.config.queuePrefix}${channel}`;
  }

  /**
   * Dispatches a message to the specified channel (queue or exchange).
   * @param channel - The channel (queue) name to send the message to
   * @param message - The message content as a string
   */
  async dispatch(channel: string, message: string): Promise<void> {
    await this.ensureConnection();

    if (!this.channel) {
      throw new Error('AMQP channel not available');
    }

    const queueName = this.resolveQueueName(channel);
    const buffer = Buffer.from(message, 'utf-8');

    if (this.config.exchange) {
      // Publish to exchange with routing key
      const published = this.channel.publish(this.config.exchange, queueName, buffer, {
        persistent: this.config.queueDurable,
      });

      if (!published) {
        // Channel buffer is full, wait for drain
        await new Promise<void>((resolve) => {
          this.channel!.once('drain', resolve);
        });
      }
    } else {
      // Send directly to queue
      await this.channel.assertQueue(queueName, {
        durable: this.config.queueDurable,
        autoDelete: this.config.autoDelete,
      });

      const sent = this.channel.sendToQueue(queueName, buffer, {
        persistent: this.config.queueDurable,
      });

      if (!sent) {
        // Channel buffer is full, wait for drain
        await new Promise<void>((resolve) => {
          this.channel!.once('drain', resolve);
        });
      }
    }
  }

  /**
   * Registers a listener callback for a specific channel.
   * If listening has already started, begins consuming immediately.
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
      await this.startConsumer(channel, listener);
    }
  }

  /**
   * Starts consuming messages for a specific channel.
   * @param channel - The channel (queue) name
   * @param listener - The listener info containing the callback
   */
  private async startConsumer(channel: string, listener: ListenerInfo): Promise<void> {
    await this.ensureConnection();

    if (!this.channel) {
      throw new Error('AMQP channel not available');
    }

    const queueName = this.resolveQueueName(channel);

    // Assert queue exists
    await this.channel.assertQueue(queueName, {
      durable: this.config.queueDurable,
      autoDelete: this.config.autoDelete,
    });

    // Bind queue to exchange if exchange is configured
    if (this.config.exchange) {
      await this.channel.bindQueue(queueName, this.config.exchange, queueName);
    }

    // Start consuming
    const { consumerTag } = await this.channel.consume(
      queueName,
      async (msg: ConsumeMessage | null) => {
        if (!msg) {
          return;
        }

        const content = msg.content.toString('utf-8');

        try {
          await listener.callback(content);

          // Acknowledge message if not auto-ack
          if (!this.config.noAck && this.channel) {
            this.channel.ack(msg);
          }
        } catch (error) {
          this.handleError(error, { channel, message: msg });

          // Reject message and requeue if not auto-ack
          if (!this.config.noAck && this.channel) {
            this.channel.nack(msg, false, true);
          }
        }
      },
      { noAck: this.config.noAck }
    );

    listener.consumerTag = consumerTag;
  }

  /**
   * Starts listening for messages on all registered channels.
   * Initiates consumers for each registered listener.
   */
  async startListening(): Promise<void> {
    if (this.listening) {
      return;
    }

    this.listening = true;

    await this.ensureConnection();

    // Start consumers for all registered listeners
    await Promise.all(
      Array.from(this.listeners.entries()).map(([channel, listener]) =>
        this.startConsumer(channel, listener)
      )
    );
  }

  /**
   * Stops listening for messages on all channels.
   * Cancels all active consumers and closes the connection.
   */
  async stopListening(): Promise<void> {
    if (!this.listening) {
      return;
    }

    this.listening = false;

    if (this.channel) {
      // Cancel all consumers
      await Promise.all(
        Array.from(this.listeners.values())
          .filter((listener) => listener.consumerTag)
          .map((listener) => this.channel!.cancel(listener.consumerTag!))
      );
    }

    // Clear consumer tags
    for (const listener of this.listeners.values()) {
      listener.consumerTag = undefined;
    }

    // Close channel and connection
    if (this.channel) {
      await this.channel.close();
      this.channel = undefined;
    }

    if (this.connection) {
      await this.connection!.close();
      this.connection = undefined;
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
    context: { channel?: string; message?: ConsumeMessage }
  ): void {
    const err = error instanceof Error ? error : new Error('Unknown error');

    if (this.config.onError) {
      this.config.onError(err, context);
      return;
    }

    // eslint-disable-next-line no-console
    console.error('[AmqpTransport] Error', {
      channel: context.channel,
      message: err.message,
    });
  }
}
