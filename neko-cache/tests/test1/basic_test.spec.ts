import { RedisCacheProvider, MemoryCacheProvider, FileCacheProvider, MemcacheCacheProvider } from '@/index';
import { Cache } from '@/index';
import { describe, expect, test } from 'vitest';
import { sleep } from '@devbro/neko-helper';


const PROVIDERS = ['redis', 'memory', 'file', 'memcache'] as const

describe.each(PROVIDERS)('cache provider %s', (provider_name) => {
  test('redis tests', async () => {
    let provider;
    if (provider_name === 'redis') {
      provider = new RedisCacheProvider({url: 'redis://redis:6379'});
    }
    else if(provider_name === 'memory') {
      provider = new MemoryCacheProvider();
    }
    else if(provider_name === 'file') {
      provider = new FileCacheProvider({ cacheDirectory: '/tmp/cache_dir' });
    }
    else if(provider_name === 'memcache') {
      provider = new MemcacheCacheProvider({ location: ['memcache:11211'] });
    }

    let cache = new Cache(provider!);

    await cache.put('test_key_obj', { value: 123 }, 10);
    let v = await cache.get('test_key_obj');
    expect(v).toEqual({ value: 123 });

    await cache.put('test_key_obj', 123.45, 10);
    v = await cache.get('test_key_obj');
    expect(v).toEqual(123.45 );

    await cache.put('test_key_obj', "hello meow", 1);
    v = await cache.get('test_key_obj');
    expect(v).toEqual("hello meow");

    await sleep(2000);
    v = await cache.get('test_key_obj');
    expect(v).toEqual(undefined);
  });
});
