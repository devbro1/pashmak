import {
  RedisCacheProvider,
  MemoryCacheProvider,
  FileCacheProvider,
  MemcacheCacheProvider,
} from '@/index';
import { Cache } from '@/index';
import { describe, expect, test } from 'vitest';
import { sleep } from '@devbro/neko-helper';
import * as net from 'net';

// Helper function to check if a service is available
async function isServiceAvailable(host: string, port: number, timeout = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeout);
    
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

// Check if Redis is available
const isRedisAvailable = await isServiceAvailable('redis', 6379);
const isLocalRedisAvailable = await isServiceAvailable('localhost', 6379);
const redisAvailable = isRedisAvailable || isLocalRedisAvailable;

// Check if Memcache is available  
const isMemcacheAvailable = await isServiceAvailable('memcache', 11211);
const isLocalMemcacheAvailable = await isServiceAvailable('localhost', 11211);
const memcacheAvailable = isMemcacheAvailable || isLocalMemcacheAvailable;

console.log('Service availability:', { 
  redis: redisAvailable, 
  memcache: memcacheAvailable 
});

const PROVIDERS = ['memory', 'file'] as const;
const OPTIONAL_PROVIDERS = [
  ...(redisAvailable ? ['redis'] as const : []),
  ...(memcacheAvailable ? ['memcache'] as const : []),
];

const ALL_PROVIDERS = [...PROVIDERS, ...OPTIONAL_PROVIDERS];
console.log('Testing providers:', ALL_PROVIDERS);

describe.each(ALL_PROVIDERS)('cache provider %s', (provider_name) => {
  test('general happy path', async () => {
    let provider;
    if (provider_name === 'redis') {
      const redisUrl = isRedisAvailable ? 'redis://redis:6379' : 'redis://localhost:6379';
      provider = new RedisCacheProvider({ url: redisUrl });
    } else if (provider_name === 'memory') {
      provider = new MemoryCacheProvider();
    } else if (provider_name === 'file') {
      provider = new FileCacheProvider({ cacheDirectory: '/tmp/cache_dir' });
    } else if (provider_name === 'memcache') {
      const memcacheLocation = isMemcacheAvailable ? ['memcache:11211'] : ['localhost:11211'];
      provider = new MemcacheCacheProvider({ location: memcacheLocation });
    }

    let cache = new Cache(provider!);

    await cache.put('test_key_obj', { value: 123 }, 10);
    let v = await cache.get('test_key_obj');
    expect(v).toEqual({ value: 123 });

    await cache.put('test_key_obj', 123.45, 10);
    v = await cache.get('test_key_obj');
    expect(v).toEqual(123.45);

    await cache.put('test_key_obj', 'hello meow', 1);
    v = await cache.get('test_key_obj');
    expect(v).toEqual('hello meow');

    await sleep(2000);
    v = await cache.get('test_key_obj');
    expect(v).toEqual(undefined);
  });
});
