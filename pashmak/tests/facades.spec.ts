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
    await storage("backup").put("test-backup.json", JSON.stringify({ backup: true }));
    const result = await storage("backup").getJson("test-backup.json");

    expect(result).toEqual({ backup: true });
  });

  test("storage should support default function call", async () => {
    const { storage } = await import("../src/facades.mjs");

    // Test default function call (equivalent to storage.method())
    await storage().put("test-default.json", JSON.stringify({ default: true }));
    const result = await storage().getJson("test-default.json");

    expect(result).toEqual({ default: true });
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
        console.log("test schedule");
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
        console.log("test schedule");
      });
      // Just verify we got something back
      expect(schedule).toBeDefined();
    }).not.toThrow();
  });
});
