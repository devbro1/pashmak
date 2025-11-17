import { QueueTransportInterface } from '../Interfaces.mjs';

export class AsyncTransport implements QueueTransportInterface {
  // in-memory async transport implementation
  private listeners = new Map<string, Set<(message: string) => Promise<void>>>();
  private queue: Array<{ channel: string; message: string }> = [];
  private running = false;
  private processing = false;

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      while (this.running && this.queue.length > 0) {
        const { channel, message } = this.queue.shift()!;
        const set = this.listeners.get(channel);
        if (!set || set.size === 0) continue;
        // run all listeners for this message and wait for them to complete,
        // but don't let one rejection stop others
        await Promise.all(
          Array.from(set).map((cb) =>
            cb(message).catch((err) => {
              // keep transport robust; surface error to console for debugging
              console.error('AsyncTransport listener error:', err);
            })
          )
        );
      }
    } finally {
      this.processing = false;
    }
  }

  dispatch(channel: string, message: string): Promise<void> {
    // enqueue message and kick off processing if started
    this.queue.push({ channel, message });
    if (this.running) {
      // fire-and-forget processing loop
      void this.processQueue();
    }
    return Promise.resolve();
  }

  registerListener(channel: string, callback: (message: string) => Promise<void>): Promise<void> {
    let set = this.listeners.get(channel);
    if (!set) {
      set = new Set();
      this.listeners.set(channel, set);
    }
    set.add(callback);
    return Promise.resolve();
  }

  startListening(): Promise<void> {
    if (!this.running) {
      this.running = true;
      // start processing any queued messages
      void this.processQueue();
    }
    return Promise.resolve();
  }

  stopListening(): Promise<void> {
    // stop accepting new processing; wait for current processing to finish
    this.running = false;
    return new Promise((resolve) => {
      const check = () => {
        if (!this.processing) resolve();
        else setTimeout(check, 10);
      };
      check();
    });
  }
}
