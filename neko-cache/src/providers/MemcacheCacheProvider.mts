import { CacheProviderInterface } from '@/CacheProviderInterface.mjs';
import { JSONValue, JSONObject } from '@devbro/neko-helper';
import Memcached from 'memcached';

/**
 * Configuration options for the Memcached cache provider.
 */
export type MemcachedConfig = {
  /** Memcached server location(s) */
  location?: Memcached.Location;
  /** Additional Memcached options */
  options?: Memcached.options;
};

/**
 * Memcached-based cache provider that stores cache entries in a Memcached server.
 * Provides distributed caching with automatic serialization and expiration.
 */
export class MemcacheCacheProvider implements CacheProviderInterface {
  private client: Memcached;
  private defaultTTL: number = 3600; // default TTL in seconds

  /**
   * Creates a new MemcacheCacheProvider instance.
   * @param config - Memcached configuration options
   */
  constructor(private config: MemcachedConfig = {}) {
    this.client = new Memcached(config.location || 'localhost:11211', config.options || {});
  }

  /**
   * Retrieves a value from the cache.
   * @param key - The cache key
   * @returns The cached value or undefined if not found
   */
  async get(key: string): Promise<JSONValue | JSONObject | undefined> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err: Error | undefined, data: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (data === undefined || data === null) {
          resolve(undefined);
          return;
        }

        try {
          // Memcached automatically handles JSON serialization/deserialization
          // but we need to ensure we return the correct type
          resolve(typeof data === 'string' ? JSON.parse(data) : data);
        } catch (parseErr) {
          // If parsing fails, return the raw value
          resolve(data);
        }
      });
    });
  }

  /**
   * Stores a value in the cache.
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  async put(key: string, value: JSONObject | JSONValue, ttl?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const serializedValue = JSON.stringify(value);
      const finalTTL = ttl ?? this.defaultTTL;

      this.client.set(key, serializedValue, finalTTL, (err: Error | undefined) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Deletes a value from the cache.
   * @param key - The cache key to delete
   */
  async delete(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err: Error | undefined) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Checks if a key exists in the cache.
   * @param key - The cache key to check
   * @returns True if the key exists, false otherwise
   */
  async has(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err: Error | undefined, data: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data !== undefined && data !== null);
      });
    });
  }

  /**
   * Increments a numeric value in the cache atomically using Memcached's native increment.
   * If the key doesn't exist, it is initialized with the increment amount.
   * @param key - The cache key to increment
   * @param amount - The amount to increment by (default: 1)
   * @returns The new value after incrementing
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    return new Promise((resolve, reject) => {
      // Memcached incr are atomic operations
      this.client.incr(key, amount, (err: any, result: number | boolean) => {
        if (err) {
          reject(err);
          return;
        }

        // If key doesn't exist, result will be false
        if (result === false) {
          // Initialize the key with the amount value
          this.client.set(key, amount.toString(), this.defaultTTL, (setErr: Error | undefined) => {
            if (setErr) {
              reject(setErr);
              return;
            }
            resolve(amount);
          });
        } else {
          resolve(result as number);
        }
      });
    });
  }
}
