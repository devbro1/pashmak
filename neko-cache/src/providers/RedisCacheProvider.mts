import { createClient, RedisClientOptions, RedisClientType } from 'redis';
import { CacheProviderInterface } from '../CacheProviderInterface.mjs';
import { JSONValue, JSONObject } from '@devbro/neko-helper';

export type RedisCacheProviderConfig = RedisClientOptions;
/**
 * Redis-based cache provider that stores cache entries in a Redis server.
 * Provides distributed caching with automatic expiration support.
 */
export class RedisCacheProvider implements CacheProviderInterface {
  private client: RedisClientType;
  private defaultTTL: number = 3600; // default TTL in seconds

  /**
   * Creates a new RedisCacheProvider instance.
   * @param config - Redis client configuration options
   */
  constructor(private config: RedisCacheProviderConfig) {
    this.client = this.createRedisClient();
    this.client.connect();
  }

  /**
   * Creates a Redis client with the provided configuration.
   * @returns A Redis client instance
   */
  private createRedisClient(): any {
    let rc = createClient(this.config);
    return rc;
  }

  /**
   * Ensures the Redis client is connected before performing operations.
   */
  private async ensureConnection(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  /**
   * Retrieves a value from the cache.
   * @param key - The cache key
   * @returns The cached value or undefined if not found
   */
  async get(key: string): Promise<JSONValue | JSONObject | undefined> {
    await this.ensureConnection();
    let rc = this.client.get(key);
    return rc.then((value) => {
      if (value === null || value === undefined) {
        return undefined;
      }
      return JSON.parse(value);
    });
  }

  /**
   * Stores a value in the cache.
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  async put(key: string, value: JSONValue | JSONObject, ttl?: number): Promise<void> {
    await this.ensureConnection();
    const serializedValue = JSON.stringify(value);
    ttl = ttl ?? this.defaultTTL;
    if (ttl && ttl > 0) {
      await this.client.setEx(key, ttl, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  /**
   * Deletes a value from the cache.
   * @param key - The cache key to delete
   */
  async delete(key: string): Promise<void> {
    await this.ensureConnection();
    await this.client.del(key);
  }

  /**
   * Checks if a key exists in the cache.
   * @param key - The cache key to check
   * @returns True if the key exists, false otherwise
   */
  async has(key: string): Promise<boolean> {
    await this.ensureConnection();
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Increments a numeric value in the cache atomically using Redis INCRBY.
   * @param key - The cache key to increment
   * @param amount - The amount to increment by (default: 1)
   * @returns The new value after incrementing
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    await this.ensureConnection();
    // Redis INCRBY is atomic
    return await this.client.incrBy(key, amount);
  }
}
