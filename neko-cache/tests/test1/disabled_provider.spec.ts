import { sleep } from '@devbro/neko-helper';
import { describe, expect, test } from 'vitest';
import {
  Cache,
  DisabledCacheProvider,
  FileCacheProvider,
  MemcacheCacheProvider,
  MemoryCacheProvider,
  RedisCacheProvider,
} from '@/index';

describe('disabled cache provider', () => {
  test('general happy path', async () => {
    const provider = new DisabledCacheProvider();

    const cache = new Cache(provider);

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
