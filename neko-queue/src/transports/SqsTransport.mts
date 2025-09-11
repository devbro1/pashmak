// import {
//     SQSClient,
//     SendMessageCommand,
//     ReceiveMessageCommand,
//     DeleteMessageCommand,
//     CreateQueueCommand,
//     GetQueueUrlCommand,
//     QueueDoesNotExist
// } from '@aws-sdk/client-sqs';
// import { QueueTransportInterface } from "../Interfaces.mjs";

// export interface SqsConfig {
//     region?: string;
//     accessKeyId?: string;
//     secretAccessKey?: string;
//     endpoint?: string;
//     queuePrefix?: string;
//     messageGroupId?: string;
//     visibilityTimeoutSeconds?: number;
//     waitTimeSeconds?: number;
//     maxReceiveCount?: number;
// }

// export class SqsTransport implements QueueTransportInterface {
//     private client: SQSClient;
//     private config: Required<SqsConfig>;
//     private queueUrls: Map<string, string> = new Map();
//     private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

//     constructor(config: SqsConfig = {}) {
//         this.config = {
//             region: config.region || process.env.AWS_REGION || 'us-east-1',
//             accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
//             secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
//             endpoint: config.endpoint || process.env.AWS_SQS_ENDPOINT || '',
//             queuePrefix: config.queuePrefix || 'neko-queue',
//             messageGroupId: config.messageGroupId || 'default',
//             visibilityTimeoutSeconds: config.visibilityTimeoutSeconds || 30,
//             waitTimeSeconds: config.waitTimeSeconds || 20,
//             maxReceiveCount: config.maxReceiveCount || 3
//         };

//         const clientConfig: any = {
//             region: this.config.region,
//         };

//         // Add credentials if provided
//         if (this.config.accessKeyId && this.config.secretAccessKey) {
//             clientConfig.credentials = {
//                 accessKeyId: this.config.accessKeyId,
//                 secretAccessKey: this.config.secretAccessKey,
//             };
//         }

//         // Add custom endpoint if provided (useful for LocalStack)
//         if (this.config.endpoint) {
//             clientConfig.endpoint = this.config.endpoint;
//         }

//         this.client = new SQSClient(clientConfig);
//     }

//     private getQueueName(channel: string): string {
//         return `${this.config.queuePrefix}-${channel}`;
//     }

//     private async ensureQueue(channel: string): Promise<string> {
//         const queueName = this.getQueueName(channel);

//         // Return cached URL if available
//         if (this.queueUrls.has(channel)) {
//             return this.queueUrls.get(channel)!;
//         }

//         try {
//             // Try to get existing queue URL
//             const getQueueUrlCommand = new GetQueueUrlCommand({
//                 QueueName: queueName
//             });

//             const response = await this.client.send(getQueueUrlCommand);
//             if (response.QueueUrl) {
//                 this.queueUrls.set(channel, response.QueueUrl);
//                 return response.QueueUrl;
//             }
//         } catch (error: any) {
//             // Queue doesn't exist, create it
//             if (error instanceof QueueDoesNotExist || error.name === 'QueueDoesNotExist') {
//                 const createQueueCommand = new CreateQueueCommand({
//                     QueueName: queueName,
//                     Attributes: {
//                         'VisibilityTimeout': this.config.visibilityTimeoutSeconds.toString(),
//                         'ReceiveMessageWaitTimeSeconds': this.config.waitTimeSeconds.toString(),
//                         'MessageRetentionPeriod': '1209600', // 14 days
//                         'DelaySeconds': '0',
//                         'MaxReceiveCount': this.config.maxReceiveCount.toString()
//                     }
//                 });

//                 const createResponse = await this.client.send(createQueueCommand);
//                 if (createResponse.QueueUrl) {
//                     this.queueUrls.set(channel, createResponse.QueueUrl);
//                     return createResponse.QueueUrl;
//                 }
//             } else {
//                 throw error;
//             }
//         }

//         throw new Error(`Failed to ensure queue for channel: ${channel}`);
//     }

//     async dispatch(channel: string, message: string): Promise<void> {
//             const queueUrl = await this.ensureQueue(channel);

//             const messageAttributes: any = {
//                 timestamp: {
//                     DataType: 'String',
//                     StringValue: new Date().toISOString()
//                 },
//                 channel: {
//                     DataType: 'String',
//                     StringValue: channel
//                 }
//             };

//             const sendMessageCommand = new SendMessageCommand({
//                 QueueUrl: queueUrl,
//                 MessageBody: message,
//                 MessageAttributes: messageAttributes,
//                 // Add MessageGroupId for FIFO queues (optional)
//                 ...(queueUrl.endsWith('.fifo') && {
//                     MessageGroupId: this.config.messageGroupId,
//                     MessageDeduplicationId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
//                 })
//             });

//             const response = await this.client.send(sendMessageCommand);

//             if (!response.MessageId) {
//                 throw new Error('Failed to send message to SQS');
//             }
//     }

//     async listen(channel: string, callback: (message: string) => Promise<void>): Promise<void> {
//             const queueUrl = await this.ensureQueue(channel);

//             // Stop any existing polling for this channel
//             this.stopPolling(channel);

//             // Start polling for messages
//             const poll = async () => {
//                 try {
//                     const receiveMessageCommand = new ReceiveMessageCommand({
//                         QueueUrl: queueUrl,
//                         MaxNumberOfMessages: 1,
//                         WaitTimeSeconds: this.config.waitTimeSeconds,
//                         MessageAttributeNames: ['All'],
//                         AttributeNames: ['All']
//                     });

//                     const response = await this.client.send(receiveMessageCommand);

//                     if (response.Messages && response.Messages.length > 0) {
//                         for (const sqsMessage of response.Messages) {
//                             if (sqsMessage.Body && sqsMessage.ReceiptHandle) {
//                                 try {
//                                     // Process the message
//                                     await callback(sqsMessage.Body);

//                                     // Delete the message after successful processing
//                                     const deleteMessageCommand = new DeleteMessageCommand({
//                                         QueueUrl: queueUrl,
//                                         ReceiptHandle: sqsMessage.ReceiptHandle
//                                     });

//                                     await this.client.send(deleteMessageCommand);
//                                 } catch (processingError) {
//                                     console.error(`Error processing SQS message from channel ${channel}:`, processingError);
//                                     console.error('Message content:', sqsMessage.Body);

//                                     // Message will be returned to queue after visibility timeout
//                                     // You might want to implement dead letter queue handling here
//                                 }
//                             }
//                         }
//                     }
//                 } catch (pollError) {
//                     console.error(`Error polling SQS queue for channel ${channel}:`, pollError);
//                 }

//                 // Continue polling if the interval is still active
//                 if (this.pollingIntervals.has(channel)) {
//                     setTimeout(poll, 100); // Small delay before next poll
//                 }
//             };

//             // Start the polling loop
//             const intervalId = setTimeout(poll, 0);
//             this.pollingIntervals.set(channel, intervalId);
//     }

//     private stopPolling(channel: string): void {
//         const intervalId = this.pollingIntervals.get(channel);
//         if (intervalId) {
//             clearTimeout(intervalId);
//             this.pollingIntervals.delete(channel);
//         }
//     }

//     async close(): Promise<void> {
//             // Stop all polling intervals
//             for (const [channel] of this.pollingIntervals) {
//                 this.stopPolling(channel);
//             }

//             // Clear queue URL cache
//             this.queueUrls.clear();

//             // The AWS SDK client doesn't need explicit closing
//             console.log('SQS Transport closed successfully');
//     }

//     // Utility method to check if transport is properly configured
//     isConfigured(): boolean {
//         return !!(this.config.region && (
//             // Either using default credentials or explicit credentials
//             (!this.config.accessKeyId && !this.config.secretAccessKey) ||
//             (this.config.accessKeyId && this.config.secretAccessKey)
//         ));
//     }

//     // Utility method to get configuration info
//     getConfigInfo(): { region: string; queuePrefix: string; endpoint?: string } {
//         return {
//             region: this.config.region,
//             queuePrefix: this.config.queuePrefix,
//             ...(this.config.endpoint && { endpoint: this.config.endpoint })
//         };
//     }

//     // Utility method to get queue URL for a channel
//     async getQueueUrl(channel: string): Promise<string> {
//         return await this.ensureQueue(channel);
//     }

//     // Utility method to list all cached queue URLs
//     getCachedQueues(): Record<string, string> {
//         const result: Record<string, string> = {};
//         for (const [channel, url] of this.queueUrls) {
//             result[channel] = url;
//         }
//         return result;
//     }
// }
