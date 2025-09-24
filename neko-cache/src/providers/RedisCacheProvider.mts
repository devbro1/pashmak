import { createClient, RedisClientOptions, RedisClientType } from 'redis';
import { CacheProviderInterface } from '../CacheProviderInterface.mjs';

export class RedisCacheProvider implements CacheProviderInterface {
  private client: RedisClientType;
  private defaultTTL: number = 3600; // default TTL in seconds

  constructor(private config: RedisClientOptions) {
    this.client = this.createRedisClient();
  }

  private createRedisClient(): any {
    return createClient(this.config);
  }

  private async ensureConnection(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async get(key: string): Promise<any> {
    await this.ensureConnection();
    return this.client.get(key);
  }

  async put(key: string, value: any, ttl?: number): Promise<void> {
    await this.ensureConnection();
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
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
}
