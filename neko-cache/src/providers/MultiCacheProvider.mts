import { CacheProviderInterface } from '../CacheProviderInterface.mjs';
import { JSONValue, JSONObject } from '@devbro/neko-helper';

/**
 * Configuration options for the multi-cache provider.
 */
export type MultiCacheConfig = {
  /** Array of cache provider instances to use in order */
  caches: CacheProviderInterface[];
};

/**
 * A cache provider that cascades through multiple cache backends.
 * Checks caches in order and returns the first hit. Writes go to all caches.
 * Useful for creating multi-tier cache hierarchies (e.g., memory -> redis -> file).
 */
export class MultiCacheProvider implements CacheProviderInterface {
  private caches: CacheProviderInterface[];

  /**
   * Creates a new MultiCacheProvider instance.
   * @param config - Configuration object containing array of cache providers
   * @throws Error if caches array is empty or not provided
   */
  constructor(config: MultiCacheConfig) {
    if (!config.caches || config.caches.length < 1) {
      throw new Error('MultiCacheProvider requires at least one cache provider');
    }
    this.caches = config.caches;
  }

  /**
   * Retrieves a value from the cache by checking each cache in order.
   * Returns the first value found.
   * @param key - The cache key
   * @returns The cached value or undefined if not found in any cache
   */
  async get(key: string): Promise<JSONValue | JSONObject | undefined> {
    for (const cache of this.caches) {
      const value = await cache.get(key);
      if (value !== undefined) {
        return value;
      }
    }
    return undefined;
  }

  /**
   * Stores a value in all caches.
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  async put(key: string, value: JSONValue | JSONObject, ttl?: number): Promise<void> {
    await Promise.all(this.caches.map((cache) => cache.put(key, value, ttl)));
  }

  /**
   * Deletes a value from all caches.
   * @param key - The cache key to delete
   */
  async delete(key: string): Promise<void> {
    await Promise.all(this.caches.map((cache) => cache.delete(key)));
  }

  /**
   * Checks if a key exists in any cache.
   * @param key - The cache key to check
   * @returns True if the key exists in at least one cache, false otherwise
   */
  async has(key: string): Promise<boolean> {
    for (const cache of this.caches) {
      if (await cache.has(key)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Increments a numeric value in the first cache only.
   * This ensures atomic increments without conflicts between caches.
   * @param key - The cache key to increment
   * @param amount - The amount to increment by (default: 1)
   * @returns The new value after incrementing
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    // Only increment in the first cache to maintain atomicity
    const newValue = await this.caches[0].increment(key, amount);

    // Optionally sync the new value to other caches
    if (this.caches.length > 1) {
      const promises = this.caches.slice(1).map((cache) => cache.put(key, newValue));
      await Promise.all(promises);
    }

    return newValue;
  }
}
