// import * as amqp from 'amqplib';
// import { QueueTransportInterface } from "../Interfaces.mjs";

// export interface RabbitMqConfig {
//     url?: string;
//     connectionOptions?: amqp.Options.Connect;
//     exchangeName?: string;
//     exchangeType?: string;
//     queueOptions?: amqp.Options.AssertQueue;
// }

// export class AmqpTransport implements QueueTransportInterface {
//     private connection: amqp.Connection | null = null;
//     private channel: amqp.Channel | null = null;
//     private config: Required<RabbitMqConfig>;
//     private isConnecting: boolean = false;

//     constructor(config: RabbitMqConfig = {}) {
//         this.config = {
//             url: config.url || process.env.RABBITMQ_URL || 'amqp://localhost',
//             connectionOptions: config.connectionOptions || {},
//             exchangeName: config.exchangeName || 'neko_queue',
//             exchangeType: config.exchangeType || 'direct',
//             queueOptions: config.queueOptions || { durable: true }
//         };
//     }

//     private async ensureConnection(): Promise<void> {
//         if (this.connection && this.channel) {
//             return;
//         }

//         if (this.isConnecting) {
//             // Wait for the connection to be established
//             while (this.isConnecting) {
//                 await new Promise(resolve => setTimeout(resolve, 10));
//             }
//             return;
//         }

//         this.isConnecting = true;

//         try {
//             if (!this.connection) {
//                 this.connection = await amqp.connect(this.config.url, this.config.connectionOptions);

//                 // Handle connection events
//                 this.connection.on('error', (err) => {
//                     console.error('RabbitMQ connection error:', err);
//                     this.connection = null;
//                     this.channel = null;
//                 });

//                 this.connection.on('close', () => {
//                     console.log('RabbitMQ connection closed');
//                     this.connection = null;
//                     this.channel = null;
//                 });
//             }

//             if (!this.channel) {
//                 this.channel = await this.connection.createChannel();

//                 // Declare the exchange
//                 await this.channel.assertExchange(
//                     this.config.exchangeName,
//                     this.config.exchangeType,
//                     { durable: true }
//                 );

//                 // Handle channel events
//                 this.channel.on('error', (err) => {
//                     console.error('RabbitMQ channel error:', err);
//                     this.channel = null;
//                 });

//                 this.channel.on('close', () => {
//                     console.log('RabbitMQ channel closed');
//                     this.channel = null;
//                 });
//             }
//         } finally {
//             this.isConnecting = false;
//         }
//     }

//     async dispatch(channel: string, message: string): Promise<void> {
//         await this.ensureConnection();

//         if (!this.channel) {
//             throw new Error('Failed to establish RabbitMQ channel');
//         }

//         // Declare the queue for the specific channel
//         await this.channel.assertQueue(channel, this.config.queueOptions);

//         // Bind the queue to the exchange with the channel as routing key
//         await this.channel.bindQueue(channel, this.config.exchangeName, channel);

//         // Publish the message
//         const published = this.channel.publish(
//             this.config.exchangeName,
//             channel,
//             Buffer.from(message),
//             {
//                 persistent: true,
//                 timestamp: Date.now(),
//                 messageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
//             }
//         );

//         if (!published) {
//             throw new Error('Failed to publish message to RabbitMQ');
//         }
//     }

//     async listen(channel: string, callback: (message: string) => Promise<void>): Promise<void> {
//         await this.ensureConnection();

//         if (!this.channel) {
//             throw new Error('Failed to establish RabbitMQ channel');
//         }

//         // Declare the queue for the specific channel
//         await this.channel.assertQueue(channel, this.config.queueOptions);

//         // Bind the queue to the exchange with the channel as routing key
//         await this.channel.bindQueue(channel, this.config.exchangeName, channel);

//         // Set prefetch to process one message at a time
//         await this.channel.prefetch(1);

//         // Start consuming messages
//         await this.channel.consume(channel, async (msg) => {
//             if (msg === null) {
//                 return;
//             }

//             const messageContent = msg.content.toString();

//             try {
//                 await callback(messageContent);

//                 // Acknowledge the message only after successful processing
//                 this.channel?.ack(msg);
//             } catch (error) {
//                 console.error(`Error processing message from channel ${channel}:`, error);
//                 console.error('Message content:', messageContent);

//                 // Reject the message and requeue it for retry
//                 // You might want to implement a retry limit or dead letter queue
//                 this.channel?.nack(msg, false, true);
//             }
//         });
//     }

//     async close(): Promise<void> {
//             if (this.channel) {
//                 await this.channel.close();
//                 this.channel = null;
//             }

//             if (this.connection) {
//                 await this.connection.close();
//                 this.connection = null;
//             }
//     }

//     // Utility method to check connection status
//     isConnected(): boolean {
//         return this.connection !== null && this.channel !== null;
//     }

//     // Utility method to get connection info
//     getConnectionInfo(): { connected: boolean; url: string; exchange: string } {
//         return {
//             connected: this.isConnected(),
//             url: this.config.url,
//             exchange: this.config.exchangeName
//         };
//     }
// }
