import { JSONValue, JSONObject } from '@devbro/neko-helper';

export interface CacheProviderInterface {
  get(key: string): Promise<JSONValue | JSONObject | undefined>;
  put(key: string, value: JSONObject | JSONValue, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}
