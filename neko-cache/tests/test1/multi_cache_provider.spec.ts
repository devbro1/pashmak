import { MultiCacheProvider, MemoryCacheProvider } from '@/index';
import { describe, expect, test, beforeEach } from 'vitest';

describe('MultiCacheProvider', () => {
  test('requires at least one cache provider', () => {
    expect(() => {
      new MultiCacheProvider({ caches: [] });
    }).toThrow('MultiCacheProvider requires at least one cache provider');
  });

  test('get returns value from first cache that has it', async () => {
    const cache1 = new MemoryCacheProvider();
    const cache2 = new MemoryCacheProvider();
    const cache3 = new MemoryCacheProvider();

    const multiCache = new MultiCacheProvider({
      caches: [cache1, cache2, cache3],
    });

    // Put value only in cache2
    await cache2.put('key1', 'value1', 10);

    const result = await multiCache.get('key1');
    expect(result).toBe('value1');
  });

  test('get returns undefined if no cache has the value', async () => {
    const cache1 = new MemoryCacheProvider();
    const cache2 = new MemoryCacheProvider();

    const multiCache = new MultiCacheProvider({
      caches: [cache1, cache2],
    });

    const result = await multiCache.get('nonexistent');
    expect(result).toBeUndefined();
  });

  test('get returns from first cache when multiple caches have the value', async () => {
    const cache1 = new MemoryCacheProvider();
    const cache2 = new MemoryCacheProvider();

    // Put different values in each cache
    await cache1.put('key1', 'value_from_cache1', 10);
    await cache2.put('key1', 'value_from_cache2', 10);

    const multiCache = new MultiCacheProvider({
      caches: [cache1, cache2],
    });

    const result = await multiCache.get('key1');
    expect(result).toBe('value_from_cache1');
  });

  test('put writes to all caches', async () => {
    const cache1 = new MemoryCacheProvider();
    const cache2 = new MemoryCacheProvider();
    const cache3 = new MemoryCacheProvider();

    const multiCache = new MultiCacheProvider({
      caches: [cache1, cache2, cache3],
    });

    await multiCache.put('key1', 'shared_value', 10);

    // Verify all caches have the value
    expect(await cache1.get('key1')).toBe('shared_value');
    expect(await cache2.get('key1')).toBe('shared_value');
    expect(await cache3.get('key1')).toBe('shared_value');
  });

  test('delete removes from all caches', async () => {
    const cache1 = new MemoryCacheProvider();
    const cache2 = new MemoryCacheProvider();

    // Pre-populate both caches
    await cache1.put('key1', 'value1', 10);
    await cache2.put('key1', 'value1', 10);

    const multiCache = new MultiCacheProvider({
      caches: [cache1, cache2],
    });

    await multiCache.delete('key1');

    // Verify both caches no longer have the value
    expect(await cache1.get('key1')).toBeUndefined();
    expect(await cache2.get('key1')).toBeUndefined();
  });

  test('has returns true if any cache has the key', async () => {
    const cache1 = new MemoryCacheProvider();
    const cache2 = new MemoryCacheProvider();

    await cache2.put('key1', 'value1', 10);

    const multiCache = new MultiCacheProvider({
      caches: [cache1, cache2],
    });

    const result = await multiCache.has('key1');
    expect(result).toBe(true);
  });

  test('has returns false if no cache has the key', async () => {
    const cache1 = new MemoryCacheProvider();
    const cache2 = new MemoryCacheProvider();

    const multiCache = new MultiCacheProvider({
      caches: [cache1, cache2],
    });

    const result = await multiCache.has('nonexistent');
    expect(result).toBe(false);
  });

  test('increment works on first cache and syncs to others', async () => {
    const cache1 = new MemoryCacheProvider();
    const cache2 = new MemoryCacheProvider();
    const cache3 = new MemoryCacheProvider();

    const multiCache = new MultiCacheProvider({
      caches: [cache1, cache2, cache3],
    });

    // First increment
    const result1 = await multiCache.increment('counter', 5);
    expect(result1).toBe(5);

    // Verify all caches have the value
    expect(await cache1.get('counter')).toBe(5);
    expect(await cache2.get('counter')).toBe(5);
    expect(await cache3.get('counter')).toBe(5);

    // Second increment
    const result2 = await multiCache.increment('counter', 3);
    expect(result2).toBe(8);

    // Verify all caches have the updated value
    expect(await cache1.get('counter')).toBe(8);
    expect(await cache2.get('counter')).toBe(8);
    expect(await cache3.get('counter')).toBe(8);
  });

  test('works with single cache', async () => {
    const cache1 = new MemoryCacheProvider();

    const multiCache = new MultiCacheProvider({
      caches: [cache1],
    });

    await multiCache.put('key1', 'value1', 10);
    const result = await multiCache.get('key1');
    expect(result).toBe('value1');
  });

  test('handles complex values', async () => {
    const cache1 = new MemoryCacheProvider();
    const cache2 = new MemoryCacheProvider();

    const multiCache = new MultiCacheProvider({
      caches: [cache1, cache2],
    });

    const complexValue = {
      name: 'test',
      nested: { value: 123 },
      array: [1, 2, 3],
    };

    await multiCache.put('complex', complexValue, 10);
    const result = await multiCache.get('complex');
    expect(result).toEqual(complexValue);
  });
});
