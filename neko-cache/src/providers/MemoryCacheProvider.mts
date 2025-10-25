import { JSONObject, JSONValue } from '@devbro/neko-helper';
import { CacheProviderInterface } from '../CacheProviderInterface.mjs';

export interface MemoryCacheConfig {
  maxSize?: number;
  defaultTTL?: number;
  cleanupInterval?: number;
}

interface CacheItem {
  value: any;
  expiresAt?: number;
  createdAt: number;
  lastAccessed: number;
}

export class MemoryCacheProvider implements CacheProviderInterface {
  private cache = new Map<string, CacheItem>();
  private config: MemoryCacheConfig = {
    maxSize: 1000,
    defaultTTL: 3600,
    cleanupInterval: 600, // 10 minutes
  };

  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: MemoryCacheConfig = {}) {
    this.config = { ...this.config, ...config };

    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    if (this.config.cleanupInterval! > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanupExpiredEntries();
      }, this.config.cleanupInterval! * 1000);
    }
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt && item.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    if (this.cache.size <= this.config.maxSize!) {
      return;
    }

    // Find the least recently accessed item
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  async get(key: string): Promise<JSONObject | JSONValue | undefined> {
    const item = this.cache.get(key);

    if (!item) {
      return undefined;
    }

    // Check if item has expired
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    // Update last accessed time for LRU
    item.lastAccessed = Date.now();

    return item.value;
  }

  async put(key: string, value: JSONObject | JSONValue, ttl?: number): Promise<void> {
    const now = Date.now();
    const effectiveTTL = ttl ?? this.config.defaultTTL!;

    const item: CacheItem = {
      value,
      createdAt: now,
      lastAccessed: now,
      expiresAt: effectiveTTL > 0 ? now + effectiveTTL * 1000 : undefined,
    };

    this.cache.set(key, item);

    // Evict items if we exceed maxSize
    this.evictLRU();
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    // Check if item has expired
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    const item = this.cache.get(key);
    const now = Date.now();

    let currentValue = 0;

    // Check if item exists and is not expired
    if (item) {
      if (item.expiresAt && item.expiresAt < now) {
        this.cache.delete(key);
      } else {
        // Get current value, ensure it's a number
        currentValue = typeof item.value === 'number' ? item.value : 0;
      }
    }

    // Calculate new value
    const newValue = currentValue + amount;

    // Store the new value with the same TTL if it existed
    const newItem: CacheItem = {
      value: newValue,
      createdAt: item?.createdAt ?? now,
      lastAccessed: now,
      expiresAt: item?.expiresAt,
    };

    this.cache.set(key, newItem);

    return newValue;
  }
}
