import { JSONValue, JSONObject } from '@devbro/neko-helper';

/**
 * Interface that all cache providers must implement.
 * Defines the contract for cache operations across different storage backends.
 */
export interface CacheProviderInterface {
  /**
   * Retrieves a value from the cache.
   * @param key - The cache key
   * @returns The cached value or undefined if not found
   */
  get(key: string): Promise<JSONValue | JSONObject | undefined>;

  /**
   * Stores a value in the cache.
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  put(key: string, value: JSONObject | JSONValue, ttl?: number): Promise<void>;

  /**
   * Deletes a value from the cache.
   * @param key - The cache key to delete
   */
  delete(key: string): Promise<void>;

  /**
   * Checks if a key exists in the cache.
   * @param key - The cache key to check
   * @returns True if the key exists, false otherwise
   */
  has(key: string): Promise<boolean>;

  /**
   * Increments a numeric value in the cache atomically.
   * @param key - The cache key to increment
   * @param amount - The amount to increment by (default: 1)
   * @returns The new value after incrementing
   */
  increment(key: string, amount?: number): Promise<number>;
}
