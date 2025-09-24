import { CacheProviderInterface } from './CacheProviderInterface.mjs';

export class Cache {
  constructor(private provider: CacheProviderInterface) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.provider.get(key) as Promise<T | undefined>;
  }

  async put(key: string, value: any, ttl?: number): Promise<void> {
    return this.provider.put(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.provider.has(key);
  }
}
