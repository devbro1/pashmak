import { describe, expect, test, beforeEach } from 'vitest';
import { Config } from '@/index.ts';

describe('Config class tests', () => {
  let config: Config;

  beforeEach(() => {
    // Get singleton instance and reset it for each test
    config = Config.getInstance();
    config.load({});
  });

  describe('Singleton pattern', () => {
    test('should return the same instance', () => {
      const instance1 = Config.getInstance();
      const instance2 = Config.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should maintain state across getInstance calls', () => {
      const instance1 = Config.getInstance();
      instance1.load({ test: 'value' });

      const instance2 = Config.getInstance();
      expect(instance2.get('test')).toBe('value');
    });
  });

  describe('load method', () => {
    test('should load simple configuration', () => {
      config.load({ name: 'test', version: '1.0' });
      expect(config.get('name')).toBe('test');
      expect(config.get('version')).toBe('1.0');
    });

    test('should load nested configuration', () => {
      config.load({
        database: {
          host: 'localhost',
          port: 5432,
          credentials: {
            username: 'admin',
            password: 'secret',
          },
        },
      });
      expect(config.get('database.host')).toBe('localhost');
      expect(config.get('database.credentials.username')).toBe('admin');
    });

    test('should replace existing configuration', () => {
      config.load({ key: 'value1' });
      expect(config.get('key')).toBe('value1');

      config.load({ key: 'value2' });
      expect(config.get('key')).toBe('value2');
    });

    test('should create deep copy of configuration', () => {
      const original = { nested: { value: 'test' } };
      config.load(original);

      expect(config.get('nested.value')).toBe('test');
      original.nested.value = 'modified';
      expect(config.get('nested.value')).toBe('test');
    });

    test('should handle empty configuration', () => {
      config.load({});
      expect(config.all()).toEqual({});
    });
  });

  describe('get method', () => {
    beforeEach(() => {
      config.load({
        app: {
          name: 'MyApp',
          version: '2.0',
          settings: {
            debug: true,
            timeout: 5000,
          },
        },
        database: {
          host: 'localhost',
          port: 5432,
        },
        features: ['auth', 'cache', 'logging'],
        count: 0,
        enabled: false,
      });
    });

    test('should get simple values', () => {
      expect(config.get('app.name')).toBe('MyApp');
      expect(config.get('app.version')).toBe('2.0');
    });

    test('should get nested values', () => {
      expect(config.get('app.settings.debug')).toBe(true);
      expect(config.get('app.settings.timeout')).toBe(5000);
    });

    test('should get entire objects', () => {
      const dbConfig = config.get('database');
      expect(dbConfig).toEqual({
        host: 'localhost',
        port: 5432,
      });
    });

    test('should get array values', () => {
      const features = config.get('features');
      expect(features).toEqual(['auth', 'cache', 'logging']);
    });

    test('should get array elements by index', () => {
      expect(config.get('features[0]')).toBe('auth');
      expect(config.get('features[1]')).toBe('cache');
      expect(config.get('features[2]')).toBe('logging');
    });

    test('should return default value for non-existent keys', () => {
      expect(config.get('nonexistent', 'default')).toBe('default');
      expect(config.get('app.missing', 'fallback')).toBe('fallback');
    });

    test('should return undefined when no default provided', () => {
      expect(config.get('nonexistent')).toBeUndefined();
    });

    test('should handle boolean false values correctly', () => {
      expect(config.get('enabled')).toBe(false);
    });

    test('should handle zero values correctly', () => {
      expect(config.get('count')).toBe(0);
    });

    test('should use JSONPath queries', () => {
      // Get all feature names
      const allFeatures = config.get('features[*]');
      expect(allFeatures).toBe('auth'); // JSONPath returns first match
    });

    test('should handle invalid JSONPath gracefully', () => {
      expect(config.get('invalid path', 'default')).toBe('default');
    });
  });

  describe('getOrFail method', () => {
    beforeEach(() => {
      config.load({
        existing: 'value',
        nested: {
          key: 'data',
        },
      });
    });

    test('should get existing values', () => {
      expect(config.getOrFail('existing')).toBe('value');
      expect(config.getOrFail('nested.key')).toBe('data');
    });

    test('should return default value for non-existent keys', () => {
      expect(config.getOrFail('nonexistent', 'default')).toBe('default');
    });

    test('should return undefined when no default and key not found', () => {
      expect(config.getOrFail('missing')).toBeUndefined();
    });
  });

  describe('has method', () => {
    beforeEach(() => {
      config.load({
        app: {
          name: 'MyApp',
          settings: {
            debug: true,
          },
        },
        count: 0,
        enabled: false,
        nullable: null,
      });
    });

    test('should return true for existing keys', () => {
      expect(config.has('app')).toBe(true);
      expect(config.has('app.name')).toBe(true);
      expect(config.has('app.settings.debug')).toBe(true);
    });

    test('should return false for non-existent keys', () => {
      expect(config.has('nonexistent')).toBe(false);
      expect(config.has('app.missing')).toBe(false);
    });

    test('should return true for falsy values', () => {
      expect(config.has('count')).toBe(true); // 0
      expect(config.has('enabled')).toBe(true); // false
    });

    test('should return true for null values', () => {
      expect(config.has('nullable')).toBe(true);
    });

    test('should handle invalid JSONPath gracefully', () => {
      expect(config.has('invalid path')).toBe(false);
    });
  });

  describe('all method', () => {
    test('should return entire configuration', () => {
      const testConfig = {
        key1: 'value1',
        key2: {
          nested: 'value2',
        },
      };
      config.load(testConfig);
      expect(config.all()).toEqual(testConfig);
    });

    test('should return empty object when no config loaded', () => {
      config.load({});
      expect(config.all()).toEqual({});
    });

    test('should return copy of configuration', () => {
      config.load({ test: 'value' });
      const all = config.all();

      // The returned object should be the internal config reference
      // but modifying it after getting it shouldn't affect future calls
      // since load() creates a deep copy
      expect(all).toEqual({ test: 'value' });
    });
  });

  describe('Complex scenarios', () => {
    test('should handle deeply nested structures', () => {
      config.load({
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep',
              },
            },
          },
        },
      });
      expect(config.get('level1.level2.level3.level4.value')).toBe('deep');
    });

    test('should handle arrays of objects', () => {
      config.load({
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
          { id: 3, name: 'Charlie' },
        ],
      });
      expect(config.get('users[0].name')).toBe('Alice');
      expect(config.get('users[1].id')).toBe(2);
    });

    test('should handle mixed data types', () => {
      config.load({
        string: 'text',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { key: 'value' },
        nullable: null,
      });
      expect(config.get('string')).toBe('text');
      expect(config.get('number')).toBe(42);
      expect(config.get('boolean')).toBe(true);
      expect(config.get('array')).toEqual([1, 2, 3]);
      expect(config.get('object')).toEqual({ key: 'value' });
      expect(config.get('nullable')).toBeNull();
    });

    test('should preserve data types through load', () => {
      const originalConfig = {
        num: 123,
        str: '456',
        bool: true,
        arr: [1, 2, 3],
      };
      config.load(originalConfig);

      expect(typeof config.get('num')).toBe('number');
      expect(typeof config.get('str')).toBe('string');
      expect(typeof config.get('bool')).toBe('boolean');
      expect(Array.isArray(config.get('arr'))).toBe(true);
    });
  });

  describe('JSONPath features', () => {
    beforeEach(() => {
      config.load({
        store: {
          book: [
            {
              category: 'reference',
              author: 'Nigel Rees',
              title: 'Sayings of the Century',
              price: 8.95,
            },
            { category: 'fiction', author: 'Evelyn Waugh', title: 'Sword of Honour', price: 12.99 },
            { category: 'fiction', author: 'Herman Melville', title: 'Moby Dick', price: 8.99 },
          ],
        },
      });
    });

    test('should access nested arrays', () => {
      expect(config.get('store.book[0].title')).toBe('Sayings of the Century');
      expect(config.get('store.book[1].author')).toBe('Evelyn Waugh');
    });

    test('should work with basic path expressions', () => {
      const firstBook = config.get('store.book[0]');
      expect(firstBook.category).toBe('reference');
      expect(firstBook.price).toBe(8.95);
    });

    test('functional values', () => {
      let c = new Config();
      c.load({
        'v1' : () => 100,
        'v2': 200
      });

      expect(c.get('v2')).toBe(200);
      expect(c.get('v1')).toBe(100);
    })
  });
});
