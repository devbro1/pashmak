import { describe, expect, test, beforeAll } from "vitest";
import { config } from "@devbro/neko-config";
import path from "path";

// Configure storage for testing
beforeAll(() => {
  config.load({
    storages: {
      default: {
        provider: "local",
        config: {
          basePath: "/tmp/storage-test",
        },
      },
      backup: {
        provider: "local",
        config: {
          basePath: "/tmp/storage-backup-test",
        },
      },
    },
    caches: {
      default: {
        provider: "memory",
        config: {},
      },
      memory_primary: {
        provider: "memory",
        config: {},
      },
      memory_secondary: {
        provider: "memory",
        config: {},
      },
      multi_cache: {
        provider: "multi",
        config: {
          caches: ["memory_primary", "memory_secondary"],
        },
      },
    },
    loggers: {
      default: {
        level: "info",
      },
    },
  });
});

describe("Facade property accessors", () => {
  test("storage should support direct method calls", async () => {
    const { storage } = await import("../src/facades.mjs");

    // Test direct method call on default instance
    await storage.put("test.json", JSON.stringify({ test: true }));
    const result = await storage.getJson("test.json");

    expect(result).toEqual({ test: true });
  });

  test("storage should support function call with label", async () => {
    const { storage } = await import("../src/facades.mjs");

    // Test function call with explicit label
    await storage("backup").put(
      "test-backup.json",
      JSON.stringify({ backup: true }),
    );
    const result = await storage("backup").getJson("test-backup.json");

    expect(result).toEqual({ backup: true });
  });

  test("storage should support default function call", async () => {
    const { storage } = await import("../src/facades.mjs");

    // Test default function call (equivalent to storage.method())
    await storage().put("test-default.json", JSON.stringify({ default: true }));
    const result = await storage().getJson("test-default.json");

    expect(result).toEqual({ default: true });

    await storage("default").put(
      "test-default2.json",
      JSON.stringify({ default: true }),
    );
    const result2 = await storage().getJson("test-default2.json");

    expect(result2).toEqual({ default: true });
  });

  test("cache should support direct method calls", async () => {
    const { cache } = await import("../src/facades.mjs");

    // Test direct method call on default instance
    await cache.put("test-key", "test-value");
    const result = await cache.get("test-key");

    expect(result).toBe("test-value");
  });

  test("cache should support function call syntax", async () => {
    const { cache } = await import("../src/facades.mjs");

    // Test function call
    await cache().put("test-key-2", "test-value-2");
    const result = await cache().get("test-key-2");

    expect(result).toBe("test-value-2");
  });

  test("logger should support direct method calls", async () => {
    const { logger } = await import("../src/facades.mjs");

    // Test direct method call (should not throw)
    expect(() => {
      logger.info({ msg: "test message" });
    }).not.toThrow();
  });

  test("logger should support function call syntax", async () => {
    const { logger } = await import("../src/facades.mjs");

    // Test function call (should not throw)
    expect(() => {
      logger().info({ msg: "test message" });
    }).not.toThrow();
  });

  test("scheduler should support direct method calls", async () => {
    const { scheduler } = await import("../src/facades.mjs");

    // Test direct method call - just check it doesn't throw
    expect(() => {
      const schedule = scheduler.call(() => {
        // Scheduled job logic
      });
      // Just verify we got something back
      expect(schedule).toBeDefined();
    }).not.toThrow();
  });

  test("scheduler should support function call syntax", async () => {
    const { scheduler } = await import("../src/facades.mjs");

    // Test function call - just check it doesn't throw
    expect(() => {
      const schedule = scheduler().call(() => {
        // Scheduled job logic
      });
      // Just verify we got something back
      expect(schedule).toBeDefined();
    }).not.toThrow();
  });

  test("multi cache provider should cascade through caches", async () => {
    const { cache } = await import("../src/facades.mjs");

    // Create a multi cache instance
    const multiCache = cache("multi_cache");

    // Put value into multi cache (should go to all underlying caches)
    await multiCache.put("multi-test-key", "multi-value", 10);

    // Get value from multi cache
    const result = await multiCache.get("multi-test-key");
    expect(result).toBe("multi-value");

    // Verify both underlying caches have the value
    const primary = cache("memory_primary");
    const secondary = cache("memory_secondary");

    expect(await primary.get("multi-test-key")).toBe("multi-value");
    expect(await secondary.get("multi-test-key")).toBe("multi-value");

    // Delete from multi cache (should delete from all)
    await multiCache.delete("multi-test-key");

    // Verify deleted from all caches
    expect(await multiCache.get("multi-test-key")).toBeUndefined();
    expect(await primary.get("multi-test-key")).toBeUndefined();
    expect(await secondary.get("multi-test-key")).toBeUndefined();
  });

  test("multi cache provider should return first match when cascading", async () => {
    const { cache } = await import("../src/facades.mjs");

    const multiCache = cache("multi_cache");
    const primary = cache("memory_primary");
    const secondary = cache("memory_secondary");

    // Put different values in each cache
    await primary.put("cascade-test", "from-primary", 10);
    await secondary.put("cascade-test", "from-secondary", 10);

    // Multi cache should return value from first cache (primary)
    const result = await multiCache.get("cascade-test");
    expect(result).toBe("from-primary");

    // Delete from primary only
    await primary.delete("cascade-test");

    // Multi cache should now return from secondary
    const result2 = await multiCache.get("cascade-test");
    expect(result2).toBe("from-secondary");
  });
});
