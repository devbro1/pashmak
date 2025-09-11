import { QueueTransportInterface } from '../Interfaces.mjs';

export interface MemoryTransportConfig {
  maxQueueSize?: number;
  processingDelay?: number;
  enableLogging?: boolean;
  persistToDisk?: boolean;
  diskPath?: string;
}

interface QueueMessage {
  id: string;
  content: string;
  timestamp: number;
  channel: string;
  attempts: number;
  maxRetries: number;
}

interface ChannelListener {
  callback: (message: string) => Promise<void>;
  isActive: boolean;
}

export class MemoryTransport implements QueueTransportInterface {
  private queues: Map<string, QueueMessage[]> = new Map();
  private listeners: Map<string, ChannelListener[]> = new Map();
  private config: Required<MemoryTransportConfig>;
  private messageCounter: number = 0;
  private processingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isShuttingDown: boolean = false;

  constructor(config: MemoryTransportConfig = {}) {
    this.config = {
      maxQueueSize: config.maxQueueSize || 1000,
      processingDelay: config.processingDelay || 10,
      enableLogging: config.enableLogging ?? false,
      persistToDisk: config.persistToDisk ?? false,
      diskPath: config.diskPath || './memory-transport-data.json',
    };

    // Load persisted data if enabled
    if (this.config.persistToDisk) {
      this.loadFromDisk();
    }

    // Set up graceful shutdown
    process.on('SIGINT', () => this.gracefulShutdown());
    process.on('SIGTERM', () => this.gracefulShutdown());
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${++this.messageCounter}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private ensureQueue(channel: string): void {
    if (!this.queues.has(channel)) {
      this.queues.set(channel, []);
    }
  }

  private ensureListeners(channel: string): void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
  }

  async dispatch(channel: string, message: string): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Transport is shutting down, cannot dispatch messages');
    }

    this.ensureQueue(channel);
    const queue = this.queues.get(channel)!;

    // Check queue size limit
    if (queue.length >= this.config.maxQueueSize) {
      throw new Error(
        `Queue for channel "${channel}" has reached maximum size of ${this.config.maxQueueSize}`
      );
    }

    const queueMessage: QueueMessage = {
      id: this.generateMessageId(),
      content: message,
      timestamp: Date.now(),
      channel: channel,
      attempts: 0,
      maxRetries: 3,
    };

    queue.push(queueMessage);

    // Persist to disk if enabled
    if (this.config.persistToDisk) {
      await this.persistToDisk();
    }

    // Try to process the message immediately if there are listeners
    this.processChannelMessages(channel);
  }

  async listen(channel: string, callback: (message: string) => Promise<void>): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Transport is shutting down, cannot add listeners');
    }

    this.ensureListeners(channel);
    const listeners = this.listeners.get(channel)!;

    const listener: ChannelListener = {
      callback,
      isActive: true,
    };

    listeners.push(listener);

    // Start processing messages for this channel if not already started
    this.startChannelProcessing(channel);

    // Process any existing messages
    this.processChannelMessages(channel);
  }

  private startChannelProcessing(channel: string): void {
    if (this.processingIntervals.has(channel)) {
      return; // Already processing
    }

    const processInterval = setInterval(() => {
      if (!this.isShuttingDown) {
        this.processChannelMessages(channel);
      }
    }, this.config.processingDelay);

    this.processingIntervals.set(channel, processInterval);
  }

  private async processChannelMessages(channel: string): Promise<void> {
    const queue = this.queues.get(channel);
    const listeners = this.listeners.get(channel);

    if (!queue || queue.length === 0 || !listeners || listeners.length === 0) {
      return;
    }

    const activeListeners = listeners.filter((l) => l.isActive);
    if (activeListeners.length === 0) {
      return;
    }

    // Process messages one by one
    while (queue.length > 0 && activeListeners.length > 0) {
      const message = queue.shift()!;

      try {
        // Round-robin distribution among active listeners
        const listenerIndex = message.attempts % activeListeners.length;
        const listener = activeListeners[listenerIndex];

        message.attempts++;

        await listener.callback(message.content);
      } catch (error) {
        // Retry logic
        if (message.attempts < message.maxRetries) {
          // Put message back in queue for retry
          queue.push(message);
        } else {
          // Optionally, you could emit a 'failed' event or send to a dead letter queue
          this.handleFailedMessage(message, error as Error);
        }
      }

      // Persist to disk after processing if enabled
      if (this.config.persistToDisk) {
        await this.persistToDisk();
      }
    }
  }

  private handleFailedMessage(message: QueueMessage, error: Error): void {
    // In a real implementation, you might want to:
    // 1. Send to a dead letter queue
    // 2. Store in a failed messages table
    // 3. Emit an event for external handling
    // 4. Send alerts/notifications
  }

  private async persistToDisk(): Promise<void> {
    if (!this.config.persistToDisk) {
      return;
    }

    try {
      const fs = await import('fs/promises');

      const data = {
        queues: Object.fromEntries(this.queues),
        timestamp: Date.now(),
        version: '1.0.0',
      };

      await fs.writeFile(this.config.diskPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error persisting to disk:', error);
    }
  }

  private async loadFromDisk(): Promise<void> {
    if (!this.config.persistToDisk) {
      return;
    }

    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(this.config.diskPath, 'utf-8');
      const parsed = JSON.parse(data);

      if (parsed.queues) {
        this.queues = new Map(Object.entries(parsed.queues));
      }
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        console.error('Error loading from disk:', error);
      }
    }
  }

  async close(): Promise<void> {
    this.isShuttingDown = true;

    // Stop all processing intervals
    for (const [channel, intervalId] of this.processingIntervals) {
      clearInterval(intervalId);
    }
    this.processingIntervals.clear();

    // Mark all listeners as inactive
    for (const [channel, listeners] of this.listeners) {
      listeners.forEach((listener) => (listener.isActive = false));
    }

    // Persist final state to disk if enabled
    if (this.config.persistToDisk) {
      await this.persistToDisk();
    }
  }

  private async gracefulShutdown(): Promise<void> {
    try {
      await this.close();
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  // Utility methods

  getQueueStats(): Record<string, { messageCount: number; listenerCount: number }> {
    const stats: Record<string, { messageCount: number; listenerCount: number }> = {};

    for (const [channel, queue] of this.queues) {
      const listeners = this.listeners.get(channel) || [];
      stats[channel] = {
        messageCount: queue.length,
        listenerCount: listeners.filter((l) => l.isActive).length,
      };
    }

    return stats;
  }

  getTotalMessageCount(): number {
    return Array.from(this.queues.values()).reduce((sum, queue) => sum + queue.length, 0);
  }

  getChannels(): string[] {
    return Array.from(this.queues.keys());
  }

  clearQueue(channel: string): void {
    const queue = this.queues.get(channel);
    if (queue) {
      const clearedCount = queue.length;
      queue.length = 0;
    }
  }

  clearAllQueues(): void {
    for (const channel of this.queues.keys()) {
      this.clearQueue(channel);
    }
  }

  removeListener(channel: string, callback: (message: string) => Promise<void>): boolean {
    const listeners = this.listeners.get(channel);
    if (!listeners) {
      return false;
    }

    const index = listeners.findIndex((l) => l.callback === callback);
    if (index >= 0) {
      listeners[index].isActive = false;
      listeners.splice(index, 1);
      return true;
    }

    return false;
  }

  getConfig(): Required<MemoryTransportConfig> {
    return { ...this.config };
  }
}
