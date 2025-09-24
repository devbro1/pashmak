import { CacheProviderInterface } from './CacheProviderInterface.mjs';

export type cacheOptions = {
  ttl?: number;
};

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

  async remember<T>(
    key: string,
    callback: () => Promise<T>,
    options: cacheOptions = {}
  ): Promise<T> {
    options.ttl = options.ttl ?? 3600; // default TTL 1 hour

    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    const result = await callback();
    await this.put(key, result, options.ttl);
    return result;
  }
}
