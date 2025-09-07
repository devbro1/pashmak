export interface EventEmittor<T extends string[]> {
  on(event: T[number], listener: (...args: any[]) => void): this;
  off(event: T[number], listener: (...args: any[]) => void): this;
  emit(event: T[number], ...args: any[]): Promise<boolean>;
}

export class EventManager<T extends string[]> implements EventEmittor<T> {
  private listeners: { [K in T[number]]?: Array<(...args: any[]) => void> } = {};

  on(event: T[number], listener: (...args: any[]) => void): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
    return this;
  }

  off(event: T[number], listener: (...args: any[]) => void): this {
    const arr = this.listeners[event];
    if (arr) {
      this.listeners[event] = arr.filter((l) => l !== listener);
    }
    return this;
  }

  async emit(event: T[number], ...args: any[]): Promise<boolean> {
    const arr = this.listeners[event];
    if (arr && arr.length > 0) {
      await Promise.all(arr.map((listener) => listener(...args)));
      return true;
    }
    return false;
  }
}

export class EventEmittorBase<T extends string[]> implements EventEmittor<T> {
  protected event_manager = new EventManager<T>();

  on(event: T[number], listener: (...args: any[]) => void): this {
    this.event_manager.on(event, listener);
    return this;
  }

  off(event: T[number], listener: (...args: any[]) => void): this {
    this.event_manager.off(event, listener);
    return this;
  }

  async emit(event: T[number], ...args: any[]): Promise<boolean> {
    return await this.event_manager.emit(event, ...args);
  }
}
