import { QueueTransportInterface } from '../Interfaces.mjs';

export class MemoryTransport implements QueueTransportInterface {
  channels = new Map<string, (message: string) => Promise<void>>();
  messageQueues = new Map<string, string[]>();

  constructor(config = {}) {}

  dispatch(channel: string, message: string): Promise<void> {
    if (this.channels.has(channel)) {
      const callback = this.channels.get(channel);
      if (callback) {
        callback(message);
      }
    } else {
      if (!this.messageQueues.has(channel)) {
        this.messageQueues.set(channel, []);
      }
      this.messageQueues.get(channel)?.push(message);
    }

    return Promise.resolve();
  }

  listen(channel: string, callback: (message: string) => Promise<void>): Promise<void> {
    this.channels.set(channel, callback);

    // if we have messages in the queue for this channel, process them
    if (this.messageQueues.has(channel)) {
      const queue = this.messageQueues.get(channel) || [];
      for (const msg of queue) {
        callback(msg);
      }
      this.messageQueues.delete(channel);
    }

    return Promise.resolve();
  }

  stopListening(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
