import type { CacheProviderInterface } from "@devbro/neko-cache";
import type { JSONObject, JSONValue } from "@devbro/neko-helper";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { MultiCache } from "../src/cache/MultiCache.mjs";

// Mock cache provider for testing
class MockCache implements CacheProviderInterface {
  private store: Map<string, JSONValue | JSONObject> = new Map();

  async get(key: string): Promise<JSONValue | JSONObject | undefined> {
    return this.store.get(key);
  }

  async put(
    key: string,
    value: JSONObject | JSONValue,
    ttl?: number,
  ): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    const current = (this.store.get(key) as number) || 0;
    const newValue = current + amount;
    this.store.set(key, newValue);
    return newValue;
  }

  // Helper method for testing
  clear() {
    this.store.clear();
  }
}

describe("MultiCache", () => {
  let cache1: MockCache;
  let cache2: MockCache;
  let cache3: MockCache;
  let multiCache: MultiCache;

  beforeEach(() => {
    cache1 = new MockCache();
    cache2 = new MockCache();
    cache3 = new MockCache();
    multiCache = new MultiCache([cache1, cache2, cache3]);
  });

  describe("get", () => {
    test("should return undefined when key not found in any cache", async () => {
      const result = await multiCache.get("nonexistent");
      expect(result).toBeUndefined();
    });

    test("should return value from first cache that has it", async () => {
      await cache2.put("key1", "value-from-cache2");
      await cache3.put("key1", "value-from-cache3");

      const result = await multiCache.get("key1");
      expect(result).toBe("value-from-cache2");
    });

    test("should return value from first cache in priority order", async () => {
      await cache1.put("key1", "value-from-cache1");
      await cache2.put("key1", "value-from-cache2");
      await cache3.put("key1", "value-from-cache3");

      const result = await multiCache.get("key1");
      expect(result).toBe("value-from-cache1");
    });

    test("should handle complex objects", async () => {
      const complexObject = { name: "test", nested: { value: 123 } };
      await cache2.put("complex", complexObject);

      const result = await multiCache.get("complex");
      expect(result).toEqual(complexObject);
    });
  });

  describe("put", () => {
    test("should write to all caches", async () => {
      await multiCache.put("key1", "test-value");

      expect(await cache1.get("key1")).toBe("test-value");
      expect(await cache2.get("key1")).toBe("test-value");
      expect(await cache3.get("key1")).toBe("test-value");
    });

    test("should write complex objects to all caches", async () => {
      const data = { id: 1, name: "test", items: [1, 2, 3] };
      await multiCache.put("complex", data);

      expect(await cache1.get("complex")).toEqual(data);
      expect(await cache2.get("complex")).toEqual(data);
      expect(await cache3.get("complex")).toEqual(data);
    });

    test("should handle ttl parameter", async () => {
      // While our mock doesn't implement TTL, we verify the method accepts it
      await expect(multiCache.put("key1", "value", 60)).resolves.not.toThrow();
    });

    test("should write to all caches in parallel", async () => {
      const spy1 = vi.spyOn(cache1, "put");
      const spy2 = vi.spyOn(cache2, "put");
      const spy3 = vi.spyOn(cache3, "put");

      await multiCache.put("key1", "value");

      expect(spy1).toHaveBeenCalledWith("key1", "value", undefined);
      expect(spy2).toHaveBeenCalledWith("key1", "value", undefined);
      expect(spy3).toHaveBeenCalledWith("key1", "value", undefined);
    });
  });

  describe("delete", () => {
    test("should delete from all caches", async () => {
      // Setup: add key to all caches
      await cache1.put("key1", "value1");
      await cache2.put("key1", "value2");
      await cache3.put("key1", "value3");

      // Delete through multi-cache
      await multiCache.delete("key1");

      // Verify deletion from all caches
      expect(await cache1.has("key1")).toBe(false);
      expect(await cache2.has("key1")).toBe(false);
      expect(await cache3.has("key1")).toBe(false);
    });

    test("should not throw error when deleting non-existent key", async () => {
      await expect(multiCache.delete("nonexistent")).resolves.not.toThrow();
    });

    test("should delete from all caches in parallel", async () => {
      await cache1.put("key1", "value");
      await cache2.put("key1", "value");
      await cache3.put("key1", "value");

      const spy1 = vi.spyOn(cache1, "delete");
      const spy2 = vi.spyOn(cache2, "delete");
      const spy3 = vi.spyOn(cache3, "delete");

      await multiCache.delete("key1");

      expect(spy1).toHaveBeenCalledWith("key1");
      expect(spy2).toHaveBeenCalledWith("key1");
      expect(spy3).toHaveBeenCalledWith("key1");
    });
  });

  describe("has", () => {
    test("should return false when key not in any cache", async () => {
      const result = await multiCache.has("nonexistent");
      expect(result).toBe(false);
    });

    test("should return true when key exists in first cache", async () => {
      await cache1.put("key1", "value");
      const result = await multiCache.has("key1");
      expect(result).toBe(true);
    });

    test("should return true when key exists in any cache", async () => {
      await cache3.put("key1", "value");
      const result = await multiCache.has("key1");
      expect(result).toBe(true);
    });

    test("should return true when key exists in multiple caches", async () => {
      await cache1.put("key1", "value1");
      await cache2.put("key1", "value2");
      const result = await multiCache.has("key1");
      expect(result).toBe(true);
    });

    test("should stop checking after finding key in first cache", async () => {
      await cache1.put("key1", "value");

      const spy2 = vi.spyOn(cache2, "has");
      const spy3 = vi.spyOn(cache3, "has");

      await multiCache.has("key1");

      // Should not check subsequent caches
      expect(spy2).not.toHaveBeenCalled();
      expect(spy3).not.toHaveBeenCalled();
    });
  });

  describe("increment", () => {
    test("should increment in all caches", async () => {
      await cache1.put("counter", 0);
      await cache2.put("counter", 0);
      await cache3.put("counter", 0);

      const result = await multiCache.increment("counter");

      expect(result).toBe(1);
      expect(await cache1.get("counter")).toBe(1);
      expect(await cache2.get("counter")).toBe(1);
      expect(await cache3.get("counter")).toBe(1);
    });

    test("should increment by custom amount", async () => {
      await cache1.put("counter", 10);
      await cache2.put("counter", 10);
      await cache3.put("counter", 10);

      const result = await multiCache.increment("counter", 5);

      expect(result).toBe(15);
      expect(await cache1.get("counter")).toBe(15);
      expect(await cache2.get("counter")).toBe(15);
      expect(await cache3.get("counter")).toBe(15);
    });

    test("should initialize counter to 0 if not exists", async () => {
      const result = await multiCache.increment("new-counter");

      expect(result).toBe(1);
      expect(await cache1.get("new-counter")).toBe(1);
      expect(await cache2.get("new-counter")).toBe(1);
      expect(await cache3.get("new-counter")).toBe(1);
    });

    test("should return value from first cache", async () => {
      // Set different initial values
      await cache1.put("counter", 100);
      await cache2.put("counter", 200);
      await cache3.put("counter", 300);

      const result = await multiCache.increment("counter");

      // Should return the incremented value from first cache
      expect(result).toBe(101);
    });

    test("should increment all caches even with different initial values", async () => {
      await cache1.put("counter", 5);
      await cache2.put("counter", 10);
      await cache3.put("counter", 15);

      await multiCache.increment("counter", 3);

      expect(await cache1.get("counter")).toBe(8);
      expect(await cache2.get("counter")).toBe(13);
      expect(await cache3.get("counter")).toBe(18);
    });
  });

  describe("edge cases", () => {
    test("should work with empty cache array", async () => {
      const emptyMultiCache = new MultiCache([]);

      expect(await emptyMultiCache.get("key")).toBeUndefined();
      expect(await emptyMultiCache.has("key")).toBe(false);
      await expect(emptyMultiCache.put("key", "value")).resolves.not.toThrow();
      await expect(emptyMultiCache.delete("key")).resolves.not.toThrow();
    });

    test("should work with single cache", async () => {
      const singleCache = new MultiCache([cache1]);

      await singleCache.put("key", "value");
      expect(await singleCache.get("key")).toBe("value");
      expect(await singleCache.has("key")).toBe(true);

      await singleCache.delete("key");
      expect(await singleCache.has("key")).toBe(false);
    });

    test("should handle null values", async () => {
      await multiCache.put("null-key", null);

      expect(await cache1.get("null-key")).toBeNull();
      expect(await cache2.get("null-key")).toBeNull();
      expect(await cache3.get("null-key")).toBeNull();
    });

    test("should handle array values", async () => {
      const arrayValue = [1, 2, 3, "test", { nested: true }];
      await multiCache.put("array-key", arrayValue);

      const result = await multiCache.get("array-key");
      expect(result).toEqual(arrayValue);
    });

    test("should handle concurrent operations", async () => {
      // Perform multiple operations concurrently
      await Promise.all([
        multiCache.put("key1", "value1"),
        multiCache.put("key2", "value2"),
        multiCache.put("key3", "value3"),
      ]);

      const results = await Promise.all([
        multiCache.get("key1"),
        multiCache.get("key2"),
        multiCache.get("key3"),
      ]);

      expect(results).toEqual(["value1", "value2", "value3"]);
    });
  });
});
