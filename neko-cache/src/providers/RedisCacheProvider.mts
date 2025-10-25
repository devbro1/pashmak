import { createClient, RedisClientOptions, RedisClientType } from 'redis';
import { CacheProviderInterface } from '../CacheProviderInterface.mjs';
import { JSONValue, JSONObject } from '@devbro/neko-helper';

export class RedisCacheProvider implements CacheProviderInterface {
  private client: RedisClientType;
  private defaultTTL: number = 3600; // default TTL in seconds

  constructor(private config: RedisClientOptions) {
    this.client = this.createRedisClient();
    this.client.connect();
  }

  private createRedisClient(): any {
    let rc = createClient(this.config);
    return rc;
  }

  private async ensureConnection(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

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

  async delete(key: string): Promise<void> {
    await this.ensureConnection();
    await this.client.del(key);
  }

  async has(key: string): Promise<boolean> {
    await this.ensureConnection();
    const result = await this.client.exists(key);
    return result === 1;
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    await this.ensureConnection();
    // Redis INCRBY is atomic
    return await this.client.incrBy(key, amount);
  }
}
