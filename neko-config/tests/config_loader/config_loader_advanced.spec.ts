import { describe, expect, test } from 'vitest';
import { ConfigLoader, loadConfig } from '@/ConfigLoader.mjs';
import * as path from 'path';

const fixturesPath = path.join(__dirname, '../fixtures/configs_generic');

describe('ConfigLoader advanced features', () => {
  describe('Deep merge functionality', () => {
    test('should deep merge multiple config files with same base name', async () => {
      const loader = new ConfigLoader(path.join(fixturesPath, 'merge-base'), {
        load_only_first_match: false,
        allowed_extensions: ['.json', '.yaml'],
      });
      const config = await loader.load();

      // Should merge both JSON and YAML configs
      expect(config.database).toBeDefined();
      expect(config.database.host).toBe('localhost');
      expect(config.database.port).toBe(5432);
      expect(config.database.username).toBe('admin');
      expect(config.database.password).toBe('secret');

      expect(config.cache).toBeDefined();
      expect(config.cache.enabled).toBe(true);
      expect(config.cache.ttl).toBe(3600);

      expect(config.logging).toBeDefined();
      expect(config.logging.level).toBe('debug');
    });

    test('should override values in correct order', async () => {
      const loader = new ConfigLoader(path.join(fixturesPath, 'merge-base'), {
        load_only_first_match: false,
        allowed_extensions: ['.json', '.yaml'],
      });
      const config = await loader.load();

      // YAML should override JSON since it comes later in extension order
      expect(config.cache.ttl).toBe(3600);
    });
  });

  describe('Extension priority', () => {
    test('should respect extension order in allowed_extensions', async () => {
      const loaderJsonFirst = new ConfigLoader(path.join(fixturesPath, 'merge-base'), {
        allowed_extensions: ['.json', '.yaml'],
        load_only_first_match: true,
      });
      const configJsonFirst = await loaderJsonFirst.load();

      // Should only load JSON
      expect(configJsonFirst.database).toBeDefined();
      expect(configJsonFirst.database.host).toBe('localhost');
      expect(configJsonFirst.database.username).toBeUndefined();
    });

    test('should load different file when extension order changes', async () => {
      const loaderYamlFirst = new ConfigLoader(path.join(fixturesPath, 'merge-base'), {
        allowed_extensions: ['.yaml', '.json'],
        load_only_first_match: true,
      });
      const configYamlFirst = await loaderYamlFirst.load();

      // Should only load YAML
      expect(configYamlFirst.database).toBeDefined();
      expect(configYamlFirst.database.username).toBe('admin');
      expect(configYamlFirst.cache.enabled).toBeUndefined();
    });
  });

  describe('Multiple extension types', () => {
    test('should handle all supported extensions', async () => {
      const extensions = ['.json', '.yml', '.yaml', '.js', '.mjs', '.ts', '.mts'];

      for (const ext of extensions) {
        const loader = new ConfigLoader(path.join(fixturesPath, 'test'), {
          allowed_extensions: [ext],
        });

        // Should not throw error even if file doesn't exist
        const config = await loader.load();
        expect(config).toBeDefined();
      }
    });
  });

  describe('Path resolution', () => {
    test('should handle absolute paths', async () => {
      const absolutePath = path.resolve(fixturesPath, 'app');
      const config = await loadConfig(absolutePath);
      expect(config.name).toBe('test-app');
    });

    test('should handle relative paths', async () => {
      const relativePath = path.join(fixturesPath, 'app');
      const config = await loadConfig(relativePath);
      expect(config.name).toBe('test-app');
    });
  });

  describe('Complex nested structures', () => {
    test('should preserve nested object structure from JSON', async () => {
      const config = await loadConfig(path.join(fixturesPath, 'app'));
      expect(config.settings).toBeTypeOf('object');
      expect(config.settings.debug).toBe(true);
      expect(config.settings.timeout).toBe(5000);
    });

    test('should preserve nested object structure from YAML', async () => {
      const config = await loadConfig(path.join(fixturesPath, 'server'));
      expect(config.server).toBeTypeOf('object');
      expect(config.logging).toBeTypeOf('object');
      expect(config.server.host).toBe('localhost');
    });

    test('should handle deeply nested structures', async () => {
      const config = await loadConfig(path.join(fixturesPath, 'imported_config'));
      expect(config.imi3).toBeTypeOf('object');
      expect(config.imi3.importedNestedKey).toBe(true);
    });
  });

  describe('Data type preservation', () => {
    test('should preserve string types', async () => {
      const config = await loadConfig(path.join(fixturesPath, 'app'));
      expect(typeof config.name).toBe('string');
      expect(typeof config.version).toBe('string');
    });

    test('should preserve number types', async () => {
      const config = await loadConfig(path.join(fixturesPath, 'app'));
      expect(typeof config.settings.timeout).toBe('number');
      expect(config.settings.timeout).toBe(5000);
    });

    test('should preserve boolean types', async () => {
      const config = await loadConfig(path.join(fixturesPath, 'app'));
      expect(typeof config.settings.debug).toBe('boolean');
      expect(config.settings.debug).toBe(true);
    });

    test('should preserve array types from YAML', async () => {
      const config = await loadConfig(path.join(fixturesPath, 'server'));
      expect(Array.isArray(config.features)).toBe(true);
      expect(config.features).toEqual(['authentication', 'caching', 'monitoring']);
    });
  });
});
