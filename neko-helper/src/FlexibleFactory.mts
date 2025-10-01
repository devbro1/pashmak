export interface FlexibleFactoryInterface<T> {
  register<T>(key: string, factory: (...args: any[]) => T): void;
  create<T>(key: string, ...args: any[]): Promise<T>;
}

export class FlexibleFactory<T> {
  registry: Map<string, any> = new Map();

  register<T>(key: string, ctor: (...args: any[]) => T) {
    this.registry.set(key, ctor);
  }

  create<T>(key: string, ...args: any[]): T {
    const ctor = this.registry.get(key);
    if (!ctor) {
      throw new Error(`No class registered for key: ${key}`);
    }
    return ctor(...args);
  }
}
