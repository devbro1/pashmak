import {
  RedisCacheProvider,
  MemoryCacheProvider,
  FileCacheProvider,
  MemcacheCacheProvider,
  DisabledCacheProvider,
} from '@/index';
import { Cache } from '@/index';
import { describe, expect, test } from 'vitest';
import { sleep } from '@devbro/neko-helper';

const PROVIDERS = ['redis', 'memory', 'file', 'memcache'] as const;

describe('disabled cache provider', () => {
  test('general happy path', async () => {
    let provider = new DisabledCacheProvider();

    let cache = new Cache(provider);

    await cache.put('test_key_obj', { value: 123 }, 10);
    let v = await cache.get('test_key_obj');
    expect(v).toBeUndefined();

    await cache.put('test_key_obj', 123.45, 10);
    v = await cache.get('test_key_obj');
    expect(v).toBeUndefined();

    await cache.put('test_key_obj', 'hello meow', 1);
    v = await cache.get('test_key_obj');
    expect(v).toBeUndefined();

    await sleep(2000);
    v = await cache.get('test_key_obj');
    expect(v).toBeUndefined();
  });
});
