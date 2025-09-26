import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { CacheProviderInterface } from '../CacheProviderInterface.mjs';
import { JSONObject, JSONValue } from '@devbro/neko-helper';

export interface FileCacheConfig {
  cacheDirectory?: string;
  defaultTTL?: number;
  cleanupInterval?: number;
}

interface CacheItem {
  value: any;
  expiresAt?: number;
  createdAt: number;
}

export class FileCacheProvider implements CacheProviderInterface {
  private config: FileCacheConfig = {
    cacheDirectory: path.join(process.cwd(), 'cache'),
    defaultTTL: 3600 * 1000,
    cleanupInterval: 300 * 1000,
  };

  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: FileCacheConfig = {}) {
    this.config = { ...this.config, ...config };

    // Create directory synchronously to avoid race conditions
    this.ensureCacheDirectorySync();
    this.startCleanupTimer();
  }

  private ensureCacheDirectorySync(): void {
    try {
      fsSync.accessSync(this.config.cacheDirectory!);
    } catch {
      fsSync.mkdirSync(this.config.cacheDirectory!, { recursive: true });
    }
  }

  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.access(this.config.cacheDirectory!);
    } catch {
      await fs.mkdir(this.config.cacheDirectory!, { recursive: true });
    }
  }

  private startCleanupTimer(): void {
    if (this.config.cleanupInterval! > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanupExpiredEntries().catch(console.error);
      }, this.config.cleanupInterval!);
    }
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  private getFilePath(key: string): string {
    // Create a safe filename from the key
    const safeKey = key.replace(/[^a-z0-9]/gi, '_');
    return path.join(this.config.cacheDirectory!, `${safeKey}.json`);
  }

  private async cleanupExpiredEntries(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.cacheDirectory!);
      const now = Date.now();

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.config.cacheDirectory!, file);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const item: CacheItem = JSON.parse(content);

            if (item.expiresAt && item.expiresAt < now) {
              await fs.unlink(filePath);
            }
          } catch {
            // If file is corrupted, delete it
            await fs.unlink(filePath).catch(() => {});
          }
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  async get(key: string): Promise<JSONObject | JSONValue | undefined> {
    const filePath = this.getFilePath(key);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const item: CacheItem = JSON.parse(content);

      // Check if item has expired
      if (item.expiresAt && item.expiresAt < Date.now()) {
        await fs.unlink(filePath).catch(() => {});
        return undefined;
      }

      return item.value;
    } catch (error) {
      return undefined;
    }
  }

  async put(key: string, value: JSONObject | JSONValue, ttl?: number): Promise<void> {
    const filePath = this.getFilePath(key);
    const now = Date.now();
    const effectiveTTL = ttl ?? this.config.defaultTTL!;

    const item: CacheItem = {
      value,
      createdAt: now,
      expiresAt: effectiveTTL > 0 ? now + effectiveTTL * 1000 : undefined,
    };

    await fs.writeFile(filePath, JSON.stringify(item), 'utf-8');
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);

    try {
      await fs.unlink(filePath);
    } catch {
      // File doesn't exist, that's fine
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }
}
