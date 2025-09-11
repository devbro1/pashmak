// import { createClient, RedisClientType, RedisDefaultModules, RedisFunctions, RedisModules, RedisScripts } from 'redis';
// import { QueueTransportInterface } from "../Interfaces.mjs";

// export interface RedisTransportConfig {
//     url?: string;
//     host?: string;
//     port?: number;
//     password?: string;
//     database?: number;
//     username?: string;
//     keyPrefix?: string;
//     maxRetries?: number;
//     retryDelayOnFailover?: number;
//     connectTimeout?: number;
//     lazyConnect?: boolean;
// }

// interface QueueMessage {
//     id: string;
//     content: string;
//     timestamp: number;
//     attempts: number;
//     maxRetries: number;
// }

// interface ChannelSubscription {
//     callback: (message: string) => Promise<void>;
//     isActive: boolean;
// }

// export class RedisTransport implements QueueTransportInterface {
//     private client: RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>;
//     private subscriber: RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>;
//     private config: Required<RedisTransportConfig>;
//     private subscriptions: Map<string, ChannelSubscription[]> = new Map();
//     private processingIntervals: Map<string, NodeJS.Timeout> = new Map();
//     private isConnected: boolean = false;
//     private isConnecting: boolean = false;
//     private isShuttingDown: boolean = false;

//     constructor(config: RedisTransportConfig = {}) {
//         this.config = {
//             url: config.url || process.env.REDIS_URL || '',
//             host: config.host || process.env.REDIS_HOST || 'localhost',
//             port: config.port || parseInt(process.env.REDIS_PORT || '6379'),
//             password: config.password || process.env.REDIS_PASSWORD || '',
//             database: config.database || parseInt(process.env.REDIS_DB || '0'),
//             username: config.username || process.env.REDIS_USERNAME || '',
//             keyPrefix: config.keyPrefix || 'neko-queue',
//             maxRetries: config.maxRetries || 3,
//             retryDelayOnFailover: config.retryDelayOnFailover || 100,
//             connectTimeout: config.connectTimeout || 10000,
//             lazyConnect: config.lazyConnect ?? true
//         };

//         this.client = this.createRedisClient();
//         this.subscriber = this.createRedisClient();

//         if (!this.config.lazyConnect) {
//             this.connect();
//         }
//     }

//     private createRedisClient(): RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts> {
//         const clientConfig: any = {
//             socket: {
//                 host: this.config.host,
//                 port: this.config.port,
//                 connectTimeout: this.config.connectTimeout,
//                 reconnectStrategy: (retries: number) => {
//                     if (retries > this.config.maxRetries) {
//                         return new Error('Max retries reached');
//                     }
//                     return Math.min(retries * this.config.retryDelayOnFailover, 3000);
//                 }
//             },
//             database: this.config.database
//         };

//         // Use URL if provided, otherwise use individual connection parameters
//         if (this.config.url) {
//             clientConfig.url = this.config.url;
//         }

//         // Add authentication if provided
//         if (this.config.password) {
//             clientConfig.password = this.config.password;
//         }

//         if (this.config.username) {
//             clientConfig.username = this.config.username;
//         }

//         const client = createClient(clientConfig);

//         // Set up event handlers
//         // client.on('error', (err: Error) => {
//         //     console.error('Redis client error:', err);
//         // });

//         client.on('connect', () => {
//             this.isConnected = true;
//         });

//         client.on('disconnect', () => {
//             this.isConnected = false;
//         });

//         // client.on('reconnecting', () => {
//         //     console.log('Redis client reconnecting...');
//         // });

//         return client;
//     }

//     private async connect(): Promise<void> {
//         if (this.isConnected || this.isConnecting) {
//             return;
//         }

//         this.isConnecting = true;

//         try {
//             await Promise.all([
//                 this.client.connect(),
//                 this.subscriber.connect()
//             ]);
//             this.isConnected = true;
//         } finally {
//             this.isConnecting = false;
//         }
//     }

//     private async ensureConnection(): Promise<void> {
//         if (!this.isConnected && !this.isConnecting) {
//             await this.connect();
//         }

//         // Wait for connection to be established
//         while (this.isConnecting) {
//             await new Promise(resolve => setTimeout(resolve, 10));
//         }

//         if (!this.isConnected) {
//             throw new Error('Failed to establish Redis connection');
//         }
//     }

//     private getQueueKey(channel: string): string {
//         return `${this.config.keyPrefix}:queue:${channel}`;
//     }

//     private getProcessingKey(channel: string): string {
//         return `${this.config.keyPrefix}:processing:${channel}`;
//     }

//     private getNotificationKey(channel: string): string {
//         return `${this.config.keyPrefix}:notify:${channel}`;
//     }

//     private generateMessageId(): string {
//         return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//     }

//     async dispatch(channel: string, message: string): Promise<void> {
//         if (this.isShuttingDown) {
//             throw new Error('Transport is shutting down, cannot dispatch messages');
//         }

//         await this.ensureConnection();

//         const queueKey = this.getQueueKey(channel);
//         const notificationKey = this.getNotificationKey(channel);

//         const queueMessage: QueueMessage = {
//             id: this.generateMessageId(),
//             content: message,
//             timestamp: Date.now(),
//             attempts: 0,
//             maxRetries: this.config.maxRetries
//         };

//         // Add message to queue
//         await this.client.lPush(queueKey, JSON.stringify(queueMessage));

//         // Notify listeners that a new message is available
//         await this.client.publish(notificationKey, '1');
//     }

//     async listen(channel: string, callback: (message: string) => Promise<void>): Promise<void> {
//         if (this.isShuttingDown) {
//             throw new Error('Transport is shutting down, cannot add listeners');
//         }

//         await this.ensureConnection();

//         if (!this.subscriptions.has(channel)) {
//             this.subscriptions.set(channel, []);
//         }

//         const subscriptions = this.subscriptions.get(channel)!;

//         const subscription: ChannelSubscription = {
//             callback,
//             isActive: true
//         };

//         subscriptions.push(subscription);

//         // Start processing for this channel if not already started
//         await this.startChannelProcessing(channel);

//         // Process any existing messages
//         this.processChannelMessages(channel);
//     }

//     private async startChannelProcessing(channel: string): Promise<void> {
//         if (this.processingIntervals.has(channel)) {
//             return; // Already processing
//         }

//         const notificationKey = this.getNotificationKey(channel);

//         // Subscribe to notifications for this channel
//         await this.subscriber.subscribe(notificationKey, () => {
//             this.processChannelMessages(channel);
//         });

//         // Also start a polling interval as backup
//         const processInterval = setInterval(() => {
//             if (!this.isShuttingDown) {
//                 this.processChannelMessages(channel);
//             }
//         }, 1000); // Poll every second as backup

//         this.processingIntervals.set(channel, processInterval);
//     }

//     private async processChannelMessages(channel: string): Promise<void> {
//         const subscriptions = this.subscriptions.get(channel);
//         if (!subscriptions || subscriptions.length === 0) {
//             return;
//         }

//         const activeSubscriptions = subscriptions.filter(s => s.isActive);
//         if (activeSubscriptions.length === 0) {
//             return;
//         }

//             await this.ensureConnection();

//             const queueKey = this.getQueueKey(channel);
//             const processingKey = this.getProcessingKey(channel);

//             // Move message from queue to processing list atomically
//             const messageData = await this.client.bRPopLPush(queueKey, processingKey, 1);

//             if (!messageData) {
//                 return; // No messages available
//             }

//             let queueMessage: QueueMessage;
//             try {
//                 queueMessage = JSON.parse(messageData);
//             } catch (parseError) {
//                 // Remove malformed message from processing
//                 await this.client.lRem(processingKey, 1, messageData);
//                 return;
//             }

//             try {
//                 // Round-robin distribution among active subscriptions
//                 const subscriptionIndex = queueMessage.attempts % activeSubscriptions.length;
//                 const subscription = activeSubscriptions[subscriptionIndex];

//                 queueMessage.attempts++;

//                 await subscription.callback(queueMessage.content);

//                 // Message processed successfully, remove from processing list
//                 await this.client.lRem(processingKey, 1, messageData);

//             } catch (error) {

//                 // Remove from processing list
//                 await this.client.lRem(processingKey, 1, messageData);

//                 // Retry logic
//                 if (queueMessage.attempts < queueMessage.maxRetries) {
//                     // Put message back in queue for retry
//                     await this.client.lPush(queueKey, JSON.stringify(queueMessage));
//                 } else {
//                     // Max retries exceeded, handle failed message
//                     await this.handleFailedMessage(channel, queueMessage, error as Error);
//                 }
//             }
//     }

//     private async handleFailedMessage(channel: string, message: QueueMessage, error: Error): Promise<void> {
//         // Store failed message in a dead letter queue
//         const deadLetterKey = `${this.config.keyPrefix}:failed:${channel}`;
//         const failedMessage = {
//             ...message,
//             failedAt: Date.now(),
//             error: error.message,
//             stack: error.stack
//         };

//             await this.client.lPush(deadLetterKey, JSON.stringify(failedMessage));

//             // Optionally, set an expiration on failed messages (e.g., 7 days)
//             await this.client.expire(deadLetterKey, 604800); // 7 days in seconds

//     }

//     async close(): Promise<void> {
//         this.isShuttingDown = true;

//         // Stop all processing intervals
//         for (const [channel, intervalId] of this.processingIntervals) {
//             clearInterval(intervalId);
//         }
//         this.processingIntervals.clear();

//         // Mark all subscriptions as inactive
//         for (const [channel, subscriptions] of this.subscriptions) {
//             subscriptions.forEach(sub => sub.isActive = false);
//         }

//         // Unsubscribe from all channels
//         for (const channel of this.subscriptions.keys()) {
//             const notificationKey = this.getNotificationKey(channel);

//                 await this.subscriber.unsubscribe(notificationKey);
//         }

//         // Close Redis connections
//             await Promise.all([
//                 this.client.quit(),
//                 this.subscriber.quit()
//             ]);

//         this.isConnected = false;
//     }

//     // Utility methods

//     async getQueueLength(channel: string): Promise<number> {
//         await this.ensureConnection();
//         const queueKey = this.getQueueKey(channel);
//         return await this.client.lLen(queueKey);
//     }

//     async getProcessingLength(channel: string): Promise<number> {
//         await this.ensureConnection();
//         const processingKey = this.getProcessingKey(channel);
//         return await this.client.lLen(processingKey);
//     }

//     async getFailedLength(channel: string): Promise<number> {
//         await this.ensureConnection();
//         const deadLetterKey = `${this.config.keyPrefix}:failed:${channel}`;
//         return await this.client.lLen(deadLetterKey);
//     }

//     async getChannelStats(channel: string): Promise<{ queue: number; processing: number; failed: number }> {
//         await this.ensureConnection();

//         const [queue, processing, failed] = await Promise.all([
//             this.getQueueLength(channel),
//             this.getProcessingLength(channel),
//             this.getFailedLength(channel)
//         ]);

//         return { queue, processing, failed };
//     }

//     async clearQueue(channel: string): Promise<number> {
//         await this.ensureConnection();
//         const queueKey = this.getQueueKey(channel);
//         const length = await this.client.lLen(queueKey);
//         await this.client.del(queueKey);
//         return length;
//     }

//     async clearProcessing(channel: string): Promise<number> {
//         await this.ensureConnection();
//         const processingKey = this.getProcessingKey(channel);
//         const length = await this.client.lLen(processingKey);
//         await this.client.del(processingKey);
//         return length;
//     }

//     async clearFailed(channel: string): Promise<number> {
//         await this.ensureConnection();
//         const deadLetterKey = `${this.config.keyPrefix}:failed:${channel}`;
//         const length = await this.client.lLen(deadLetterKey);
//         await this.client.del(deadLetterKey);
//         return length;
//     }

//     async getFailedMessages(channel: string, limit: number = 10): Promise<any[]> {
//         await this.ensureConnection();
//         const deadLetterKey = `${this.config.keyPrefix}:failed:${channel}`;
//         const messages = await this.client.lRange(deadLetterKey, 0, limit - 1);

//         return messages.map((msg: string) => {
//             try {
//                 return JSON.parse(msg);
//             } catch (error: unknown) {
//                 return { raw: msg, parseError: (error as Error).message };
//             }
//         });
//     }

//     async retryFailedMessage(channel: string, messageIndex: number = 0): Promise<boolean> {
//         await this.ensureConnection();

//         const deadLetterKey = `${this.config.keyPrefix}:failed:${channel}`;
//         const queueKey = this.getQueueKey(channel);

//         // Get the failed message
//         const messages = await this.client.lRange(deadLetterKey, messageIndex, messageIndex);
//         if (messages.length === 0) {
//             return false;
//         }

//             const failedMessage = JSON.parse(messages[0]);

//             // Reset the message for retry
//             const retryMessage: QueueMessage = {
//                 id: failedMessage.id,
//                 content: failedMessage.content,
//                 timestamp: Date.now(),
//                 attempts: 0,
//                 maxRetries: this.config.maxRetries
//             };

//             // Move from failed to queue
//             await this.client.lPush(queueKey, JSON.stringify(retryMessage));
//             await this.client.lRem(deadLetterKey, 1, messages[0]);

//             // Notify listeners
//             const notificationKey = this.getNotificationKey(channel);
//             await this.client.publish(notificationKey, '1');

//             return true;

//     }

//     isConnectionActive(): boolean {
//         return this.isConnected;
//     }

//     getConfig(): Required<RedisTransportConfig> {
//         return { ...this.config };
//     }

//     async ping(): Promise<string> {
//         await this.ensureConnection();
//         return await this.client.ping();
//     }
// }
