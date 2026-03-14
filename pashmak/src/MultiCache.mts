import { Cache, cacheOptions } from "@devbro/neko-cache";
import { JSONValue } from "@devbro/neko-helper";

/**
 * A multi-tier cache that cascades through multiple Cache instances.
 * Checks caches in order and returns the first hit. Writes go to all caches.
 * Useful for creating cache hierarchies (e.g., memory -> redis -> file).
 */
export class MultiCache {
  private caches: Cache[];

  /**
   * Creates a new MultiCache instance.
   * @param caches - Array of Cache instances to cascade through
   * @throws Error if caches array is empty
   */
  constructor(caches: Cache[]) {
    if (!caches || caches.length < 1) {
      throw new Error("MultiCache requires at least one cache");
    }
    this.caches = caches;
  }

  /**
   * Retrieves a value from the cache by checking each cache in order.
   * Returns the first value found.
   * @template T - The expected type of the cached value
   * @param key - The cache key
   * @returns The cached value or undefined if not found in any cache
   */
  async get<T>(key: JSONValue): Promise<T | undefined> {
    for (const cache of this.caches) {
      const value = await cache.get<T>(key);
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
  async put(key: JSONValue, value: any, ttl?: number): Promise<void> {
    await Promise.all(this.caches.map((cache) => cache.put(key, value, ttl)));
  }

  /**
   * Deletes a value from all caches.
   * @param key - The cache key to delete
   */
  async delete(key: JSONValue): Promise<void> {
    await Promise.all(this.caches.map((cache) => cache.delete(key)));
  }

  /**
   * Checks if a key exists in any cache.
   * @param key - The cache key to check
   * @returns True if the key exists in at least one cache, false otherwise
   */
  async has(key: JSONValue): Promise<boolean> {
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
  async increment(key: JSONValue, amount: number = 1): Promise<number> {
    // Only increment in the first cache to maintain atomicity
    const newValue = await this.caches[0].increment(key, amount);

    // Sync the new value to other caches
    if (this.caches.length > 1) {
      const promises = this.caches
        .slice(1)
        .map((cache) => cache.put(key, newValue));
      await Promise.all(promises);
    }

    return newValue;
  }

  /**
   * Gets a value from cache or executes callback and caches the result.
   * This is useful for caching expensive operations.
   * @template T - The expected type of the value
   * @param key - The cache key
   * @param callback - Function to execute if cache miss occurs
   * @param options - Cache options including TTL (default: 3600 seconds)
   * @returns The cached value or the result of the callback
   */
  async remember<T>(
    key: JSONValue,
    callback: () => Promise<T>,
    options: cacheOptions = {},
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await callback();
    await this.put(key, result, options.ttl ?? 3600);
    return result;
  }
}
