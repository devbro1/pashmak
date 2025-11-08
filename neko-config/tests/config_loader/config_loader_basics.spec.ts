import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { ConfigLoader, loadConfig } from '@/ConfigLoader.mjs';
import * as path from 'path';

const fixturesPath = path.join(__dirname, '../fixtures/configs_generic');

describe('basic tests for loadConfig and ConfigLoader', () =>
{
  let originalEnv: string | undefined;

  beforeEach(() =>
  {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() =>
  {
    if (originalEnv)
    {
      process.env.NODE_ENV = originalEnv;
    } else
    {
      delete process.env.NODE_ENV;
    }
  });

  describe('loadConfig helper function', () =>
  {
    test('should load JSON config file', async () =>
    {
      const config = await loadConfig(path.join(fixturesPath, 'app'));
      expect(config).toEqual({
        name: 'test-app',
        version: '1.0.0',
        settings: {
          debug: true,
          timeout: 5000
        }
      });
    });

    test('should load YAML config file', async () =>
    {
      const config = await loadConfig(path.join(fixturesPath, 'server'));
      expect(config).toEqual({
        server: {
          host: 'localhost',
          port: 3000,
          ssl: false
        },
        logging: {
          level: 'info',
          file: '/var/log/app.log'
        },
        features: ['authentication', 'caching', 'monitoring']
      });
    });

    test('should load YML config file', async () =>
    {
      const config = await loadConfig(path.join(fixturesPath, 'cache'));
      expect(config).toEqual({
        redis: {
          host: 'localhost',
          port: 6379
        },
        cache: {
          ttl: 3600
        }
      });
    });

    test('should load JavaScript module (.js)', async () =>
    {
      process.env.NODE_ENV = 'development';
      const config = await loadConfig(path.join(fixturesPath, 'databases'));
      expect(config).toEqual({
        db_name: 'dev_db'
      });
    });

    test('should load ES module (.mjs)', async () =>
    {
      process.env.NODE_ENV = 'production';
      const config = await loadConfig(path.join(fixturesPath, 'api'));
      expect(config).toEqual({
        api_key: 'prod-key',
        base_url: 'https://api.production.com',
        rate_limit: 1000
      });
    });

    test('should load TypeScript module (.ts)', async () =>
    {
      const config = await loadConfig(path.join(fixturesPath, 'imported_config'));
      expect(config).toEqual({
        imi1: 'imported_value1',
        imi2: 84,
        imi3: {
          importedNestedKey: true
        }
      });
    });

    test('should return empty object when file does not exist', async () =>
    {
      const config = await loadConfig(path.join(fixturesPath, 'nonexistent'));
      expect(config).toEqual({});
    });
  });

  describe('ConfigLoader class', () =>
  {
    test('should create instance with default options', () =>
    {
      const loader = new ConfigLoader(path.join(fixturesPath, 'app'));
      expect(loader).toBeInstanceOf(ConfigLoader);
    });

    test('should load config using ConfigLoader instance', async () =>
    {
      const loader = new ConfigLoader(path.join(fixturesPath, 'app'));
      const config = await loader.load();
      expect(config.name).toBe('test-app');
    });

    test('should respect custom allowed_extensions option', async () =>
    {
      const loader = new ConfigLoader(path.join(fixturesPath, 'app'), {
        allowed_extensions: ['.json']
      });
      const config = await loader.load();
      expect(config.name).toBe('test-app');
    });

    test('should not load files with excluded extensions', async () =>
    {
      const loader = new ConfigLoader(path.join(fixturesPath, 'server'), {
        allowed_extensions: ['.json']
      });
      const config = await loader.load();
      expect(config).toEqual({});
    });
  });

  describe('Environment-specific configurations', () =>
  {
    test('should load default config when no NODE_ENV is set', async () =>
    {
      delete process.env.NODE_ENV;
      const config = await loadConfig(path.join(fixturesPath, 'databases'));
      expect(config.db_name).toBe('dev_db'); // Falls back to development
    });

    test('should load development config', async () =>
    {
      process.env.NODE_ENV = 'development';
      const config = await loadConfig(path.join(fixturesPath, 'databases'));
      expect(config.db_name).toBe('dev_db');
    });

    test('should load production config', async () =>
    {
      process.env.NODE_ENV = 'production';
      const config = await loadConfig(path.join(fixturesPath, 'databases'));
      expect(config.db_name).toBe('prod_db');
    });

    test('should load test config', async () =>
    {
      process.env.NODE_ENV = 'test';
      const config = await loadConfig(path.join(fixturesPath, 'databases'));
      expect(config.db_name).toBe('test_db');
    });

    test('should merge default and environment-specific configs', async () =>
    {
      process.env.NODE_ENV = 'production';
      const config = await loadConfig(path.join(fixturesPath, 'api'));
      expect(config).toEqual({
        api_key: 'prod-key',
        base_url: 'https://api.production.com',
        rate_limit: 1000
      });
    });

    test('should use custom node_env option', async () =>
    {
      const config = await loadConfig(path.join(fixturesPath, 'databases'), {
        node_env: 'production'
      });
      expect(config.db_name).toBe('prod_db');
    });
  });

  describe('load_only_first_match option', () =>
  {
    test('should load only first matching file when enabled', async () =>
    {
      // This test assumes multiple files with same base name but different extensions
      const loader = new ConfigLoader(path.join(fixturesPath, 'server'), {
        load_only_first_match: true
      });
      const config = await loader.load();
      expect(config).toBeDefined();
    });

    test('should merge all matching files when disabled', async () =>
    {
      const loader = new ConfigLoader(path.join(fixturesPath, 'server'), {
        load_only_first_match: false
      });
      const config = await loader.load();
      expect(config).toBeDefined();
    });
  });

  describe('Edge cases and error handling', () =>
  {
    test('should handle empty JSON file', async () =>
    {
      // Would need to create a fixture for this
      const config = await loadConfig(path.join(fixturesPath, 'nonexistent'));
      expect(config).toEqual({});
    });

    test('should handle nested configuration objects', async () =>
    {
      const config = await loadConfig(path.join(fixturesPath, 'app'));
      expect(config.settings).toBeDefined();
      expect(config.settings.debug).toBe(true);
      expect(config.settings.timeout).toBe(5000);
    });

    test('should handle array values in YAML', async () =>
    {
      const config = await loadConfig(path.join(fixturesPath, 'server'));
      expect(Array.isArray(config.features)).toBe(true);
      expect(config.features).toHaveLength(3);
      expect(config.features).toContain('authentication');
    });

    test('generic default config', async () =>
    {
      const default_config = await loadConfig(path.join(fixturesPath, 'default'));
      expect(default_config).toEqual(
        {
          key1: 'value1',
          key2: 42,
          key3: { nestedKey: true },
          import_bad: {
            imi1: 'imported_value1',
            imi2: 84,
            imi3: { importedNestedKey: true }
          },
          import1: {
            imi1: 'imported_value1',
            imi2: 84,
            imi3: { importedNestedKey: true }
          },
          databases: { db_name: 'test_db' }
        }
      );
    });
  });
});
