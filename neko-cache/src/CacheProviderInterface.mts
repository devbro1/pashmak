export interface CacheProviderInterface {
  get(key: string): Promise<any>;
  put(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}
