import { JSONValue } from '@devbro/neko-helper';
import { CacheProviderInterface } from './CacheProviderInterface.mjs';
import { createHash } from 'crypto';

export type cacheOptions = {
  ttl?: number;
};

export class Cache {
  constructor(private provider: CacheProviderInterface) {}

  async get<T>(key: JSONValue): Promise<T | undefined> {
    return this.provider.get(this.generateKey(key)) as Promise<T | undefined>;
  }

  async put(key: JSONValue, value: any, ttl?: number): Promise<void> {
    return this.provider.put(this.generateKey(key), value, ttl);
  }

  async delete(key: JSONValue): Promise<void> {
    return this.provider.delete(this.generateKey(key));
  }

  async has(key: JSONValue): Promise<boolean> {
    return this.provider.has(this.generateKey(key));
  }

  async increment(key: JSONValue, amount: number = 1): Promise<number> {
    return this.provider.increment(this.generateKey(key), amount);
  }

  async remember<T>(
    key: JSONValue,
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

  /**
   * Generates a cache key by serializing and concatenating the provided parts.
   * @param parts
   * @returns
   */
  generateKey(key: JSONValue): string {
    if (typeof key === 'string' && key.length <= 250) {
      return key;
    }
    return createHash('md5').update(JSON.stringify(key)).digest('hex');
  }
}
