import { QueueTransportInterface } from '../Interfaces.mjs';
import { PubSub, Topic, Subscription } from '@google-cloud/pubsub';

/**
 * Configuration options for the Google Pub/Sub transport.
 */
export type GooglePubSubTransportConfig = {
  /** Google Cloud project ID. Defaults to GOOGLE_CLOUD_PROJECT environment variable. */
  projectId?: string;
  /** Path to the service account key JSON file. */
  keyFilename?: string;
  /** Service account credentials as an object. */
  credentials?: any;
  /** Topic name prefix to prepend to all topic names. */
  topicPrefix?: string;
  /** Subscription name prefix to prepend to all subscription names. */
  subscriptionPrefix?: string;
  /** Whether to create topics if they don't exist. Defaults to true. */
  autoCreateTopics?: boolean;
  /** Whether to create subscriptions if they don't exist. Defaults to true. */
  autoCreateSubscriptions?: boolean;
  /** Maximum number of messages to receive at once. Defaults to 10. */
  maxMessages?: number;
  /** Acknowledgment deadline in seconds. Defaults to 60. */
  ackDeadlineSeconds?: number;
  /** Message retention duration in seconds. Defaults to 604800 (7 days). */
  retentionDurationSeconds?: number;
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
  /** Google Pub/Sub subscription. */
  subscription?: Subscription;
};

/**
 * Google Cloud Pub/Sub-based queue transport implementation.
 * Provides message publishing and subscription using Google Cloud Pub/Sub.
 */
export class GooglePubSubTransport implements QueueTransportInterface {
  private readonly config: Required<
    Omit<GooglePubSubTransportConfig, 'projectId' | 'keyFilename' | 'credentials' | 'onError'>
  > &
    Pick<GooglePubSubTransportConfig, 'projectId' | 'keyFilename' | 'credentials' | 'onError'>;
  private client: PubSub | undefined = undefined;
  private readonly topics = new Map<string, Topic>();
  private readonly listeners = new Map<string, ListenerInfo>();
  private listening = false;

  /**
   * Creates a new Google Pub/Sub transport instance.
   * @param config - Configuration options for the Google Pub/Sub transport
   */
  constructor(config: GooglePubSubTransportConfig = {}) {
    this.config = {
      projectId: config.projectId ?? process.env.GOOGLE_CLOUD_PROJECT,
      keyFilename: config.keyFilename,
      credentials: config.credentials,
      topicPrefix: config.topicPrefix ?? 'neko-queue',
      subscriptionPrefix: config.subscriptionPrefix ?? 'neko-queue',
      autoCreateTopics: config.autoCreateTopics ?? true,
      autoCreateSubscriptions: config.autoCreateSubscriptions ?? true,
      maxMessages: config.maxMessages ?? 10,
      ackDeadlineSeconds: config.ackDeadlineSeconds ?? 60,
      retentionDurationSeconds: config.retentionDurationSeconds ?? 604800,
      onError: config.onError,
    };
  }

  /**
   * Initializes the Pub/Sub client if not already initialized.
   */
  private ensureClient(): void {
    if (this.client) {
      return;
    }

    const clientConfig: any = {};

    if (this.config.projectId) {
      clientConfig.projectId = this.config.projectId;
    }

    if (this.config.keyFilename) {
      clientConfig.keyFilename = this.config.keyFilename;
    }

    if (this.config.credentials) {
      clientConfig.credentials = this.config.credentials;
    }

    this.client = new PubSub(clientConfig);
  }

  /**
   * Resolves the topic name with prefix.
   * @param channel - The channel name
   * @returns The full topic name
   */
  private getTopicName(channel: string): string {
    return `${this.config.topicPrefix}-${channel}`;
  }

  /**
   * Resolves the subscription name with prefix.
   * @param channel - The channel name
   * @returns The full subscription name
   */
  private getSubscriptionName(channel: string): string {
    return `${this.config.subscriptionPrefix}-${channel}`;
  }

  /**
   * Gets or creates a topic for the specified channel.
   * @param channel - The channel name
   * @returns The Pub/Sub topic
   */
  private async getTopic(channel: string): Promise<Topic> {
    this.ensureClient();

    const topicName = this.getTopicName(channel);
    let topic = this.topics.get(topicName);

    if (topic) {
      return topic;
    }

    topic = this.client!.topic(topicName);

    if (this.config.autoCreateTopics) {
      const [exists] = await topic.exists();
      if (!exists) {
        await topic.create();
      }
    }

    this.topics.set(topicName, topic);
    return topic;
  }

  /**
   * Gets or creates a subscription for the specified channel.
   * @param channel - The channel name
   * @returns The Pub/Sub subscription
   */
  private async getSubscription(channel: string): Promise<Subscription> {
    this.ensureClient();

    const topicName = this.getTopicName(channel);
    const subscriptionName = this.getSubscriptionName(channel);

    const topic = await this.getTopic(channel);
    const subscription = this.client!.subscription(subscriptionName);

    if (this.config.autoCreateSubscriptions) {
      const [exists] = await subscription.exists();
      if (!exists) {
        await subscription.create({
          topic: topicName,
          ackDeadlineSeconds: this.config.ackDeadlineSeconds,
          retainAckedMessages: false,
          messageRetentionDuration: {
            seconds: this.config.retentionDurationSeconds,
          },
        });
      }
    }

    return subscription;
  }

  /**
   * Dispatches a message to the specified channel (Pub/Sub topic).
   * @param channel - The channel (topic) name to send the message to
   * @param message - The message content as a string
   */
  async dispatch(channel: string, message: string): Promise<void> {
    try {
      const topic = await this.getTopic(channel);
      const dataBuffer = Buffer.from(message, 'utf-8');
      await topic.publishMessage({ data: dataBuffer });
    } catch (error) {
      this.handleError(error, { channel, body: message });
      throw error;
    }
  }

  /**
   * Registers a listener callback for a specific channel.
   * If listening has already started, begins consuming immediately.
   * @param channel - The channel (topic) name to listen to
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
      await this.startSubscription(channel, listener);
    }
  }

  /**
   * Starts consuming messages for a specific channel.
   * @param channel - The channel (topic) name
   * @param listener - The listener info containing the callback
   */
  private async startSubscription(channel: string, listener: ListenerInfo): Promise<void> {
    try {
      const subscription = await this.getSubscription(channel);
      listener.subscription = subscription;

      subscription.on('message', async (message: any) => {
        const messageId = message.id;
        const body = message.data.toString('utf-8');

        try {
          await listener.callback(body);
          message.ack();
        } catch (error) {
          this.handleError(error, { channel, messageId, body });
          message.nack();
        }
      });

      subscription.on('error', (error: Error) => {
        this.handleError(error, { channel });
      });
    } catch (error) {
      this.handleError(error, { channel });
      throw error;
    }
  }

  /**
   * Starts listening for messages on all registered channels.
   * Initiates subscriptions for each registered listener.
   */
  async startListening(): Promise<void> {
    if (this.listening) {
      return;
    }

    this.listening = true;

    await Promise.all(
      Array.from(this.listeners.entries()).map(([channel, listener]) =>
        this.startSubscription(channel, listener)
      )
    );
  }

  /**
   * Stops listening for messages on all channels.
   * Closes all subscriptions and cleans up resources.
   */
  async stopListening(): Promise<void> {
    if (!this.listening) {
      return;
    }

    this.listening = false;

    // Close all subscriptions
    await Promise.all(
      Array.from(this.listeners.values())
        .filter((listener) => listener.subscription)
        .map(async (listener) => {
          try {
            await listener.subscription!.close();
            listener.subscription = undefined;
          } catch (error) {
            this.handleError(error, {});
          }
        })
    );

    // Close topics
    for (const topic of this.topics.values()) {
      try {
        await topic.flush();
      } catch (error) {
        this.handleError(error, {});
      }
    }

    this.topics.clear();

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
    console.error('[GooglePubSubTransport] Error', {
      channel: context.channel,
      messageId: context.messageId,
      message: err.message,
    });
  }
}
