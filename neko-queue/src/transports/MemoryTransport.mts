import { QueueTransportInterface } from '../Interfaces.mjs';
import { createRepeater } from '@devbro/neko-helper';

export type MemoryTransportConfig = {
  interval: number; // interval in milliseconds to check for messages
};
export class MemoryTransport implements QueueTransportInterface {
  config: MemoryTransportConfig = {
    interval: 10_000, // check for messages every 10 seconds
  };
  channels = new Map<string, (message: string) => Promise<void>>();
  messageQueues: { channel: string; message: string }[] = [];
  repeater: ReturnType<typeof createRepeater>;

  processMessage = async () => {
    while (this.messageQueues.length > 0) {
      const { channel, message } = this.messageQueues.shift()!;
      const callback = this.channels.get(channel);
      if (callback) {
        await callback(message);
      }
    }
  };

  constructor(config: Partial<MemoryTransportConfig> = {}) {
    this.config = { ...this.config, ...config };
    this.repeater = createRepeater(this.processMessage, this.config.interval);
  }

  async dispatch(channel: string, message: string): Promise<void> {
    this.messageQueues.push({ channel, message });
  }

  async registerListener(
    channel: string,
    callback: (message: string) => Promise<void>
  ): Promise<void> {
    this.channels.set(channel, callback);
  }

  async startListening(): Promise<void> {
    this.repeater.start();
  }

  async stopListening(): Promise<void> {
    this.repeater.stop();
  }
}
