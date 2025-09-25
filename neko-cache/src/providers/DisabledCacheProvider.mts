import { createClient, RedisClientOptions, RedisClientType } from 'redis';
import { CacheProviderInterface } from '../CacheProviderInterface.mjs';
import { JSONValue, JSONObject } from '@devbro/neko-helper';

export class DisabledCacheProvider implements CacheProviderInterface {
  constructor(private config = {}) {}

  async get(key: string): Promise<JSONValue | JSONObject | undefined> {
    return undefined;
  }

  async put(key: string, value: JSONValue | JSONObject, ttl?: number): Promise<void> {}

  async delete(key: string): Promise<void> {}

  async has(key: string): Promise<boolean> {
    return false;
  }
}
