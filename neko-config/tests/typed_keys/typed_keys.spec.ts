import { describe, expect, test, beforeEach } from 'vitest';
import { Config } from '@/index.ts';

// Augment the ConfigKeys interface with typed keys for testing
// Note: This uses the public package name that end-users would use
declare module '@devbro/neko-config' {
  interface ConfigKeys {
    '$.app.name': string;
    '$.app.port': number;
    '$.app.debug': boolean;
    '$.database.host': string;
    '$.database.port': number;
  }
}

describe('Typed Config Keys', () => {
  let config: Config;

  beforeEach(() => {
    config = Config.getInstance();
    config.load({
      app: {
        name: 'TestApp',
        port: 3000,
        debug: true,
      },
      database: {
        host: 'localhost',
        port: 5432,
      },
    });
  });

  describe('get method with typed keys', () => {
    test('should return typed values for defined keys', () => {
      const appName = config.get('$.app.name');
      const appPort = config.get('$.app.port');
      const appDebug = config.get('$.app.debug');
      const dbHost = config.get('$.database.host');
      const dbPort = config.get('$.database.port');

      expect(appName).toBe('TestApp');
      expect(appPort).toBe(3000);
      expect(appDebug).toBe(true);
      expect(dbHost).toBe('localhost');
      expect(dbPort).toBe(5432);
    });

    test('should work with default values', () => {
      const missingKey = config.get('$.app.missing' as any, 'default');
      expect(missingKey).toBe('default');
    });

    test('should still accept any string key when not in ConfigKeys', () => {
      // This tests backward compatibility
      const anyKey = config.get('$.some.random.path' as any);
      expect(anyKey).toBeUndefined();
    });
  });

  describe('getOrFail method with typed keys', () => {
    test('should return typed values for defined keys', () => {
      const appName = config.getOrFail('$.app.name');
      const appPort = config.getOrFail('$.app.port');

      expect(appName).toBe('TestApp');
      expect(appPort).toBe(3000);
    });

    test('should return default value when key not found', () => {
      const missing = config.getOrFail('$.app.missing' as any, 'fallback');
      expect(missing).toBe('fallback');
    });
  });

  describe('has method with typed keys', () => {
    test('should return true for existing typed keys', () => {
      expect(config.has('$.app.name')).toBe(true);
      expect(config.has('$.app.port')).toBe(true);
      expect(config.has('$.database.host')).toBe(true);
    });

    test('should return false for non-existent keys', () => {
      expect(config.has('$.app.nonexistent' as any)).toBe(false);
    });
  });
});

describe('Untyped Config Keys (default behavior)', () => {
  let config: Config;

  beforeEach(() => {
    config = new Config(); // Use a new instance to avoid singleton pollution
    config.load({
      test: {
        value: 'test',
      },
    });
  });

  test('should accept any string when ConfigKeys is not augmented', () => {
    // This simulates the default behavior when users don't augment ConfigKeys
    const value = config.get('$.test.value');
    expect(value).toBe('test');
  });

  test('should work with arbitrary paths', () => {
    const anyPath = config.get('$.test.random.deep.path', 'default');
    expect(anyPath).toBe('default');
  });
});
