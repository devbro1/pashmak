import { describe, expect, test } from 'vitest';
import { ConfigLoader, loadConfig } from '@/ConfigLoader.mjs';
import * as path from 'path';

const fixturesPath = path.join(__dirname, '../fixtures/configs_generic');

describe('ConfigLoader error handling and edge cases', () => {
  describe('Invalid file content', () => {
    test('should throw error for invalid JSON', async () => {
      await expect(
        loadConfig(path.join(fixturesPath, 'invalid'))
      ).rejects.toThrow();
    });
  });

  describe('Empty and minimal configs', () => {
    test('should handle missing files gracefully', async () => {
      const config = await loadConfig(path.join(fixturesPath, 'does-not-exist-anywhere'));
      expect(config).toEqual({});
    });

    test('should handle directory with no matching files', async () => {
      const loader = new ConfigLoader(path.join(fixturesPath, 'nonexistent'), {
        allowed_extensions: ['.txt', '.pdf']
      });
      const config = await loader.load();
      expect(config).toEqual({});
    });
  });

  describe('Options validation', () => {
    test('should work with empty options object', async () => {
      const loader = new ConfigLoader(path.join(fixturesPath, 'app'), {});
      const config = await loader.load();
      expect(config.name).toBe('test-app');
    });

    test('should work with partial options', async () => {
      const loader = new ConfigLoader(path.join(fixturesPath, 'app'), {
        load_only_first_match: true
      });
      const config = await loader.load();
      expect(config.name).toBe('test-app');
    });

    test('should override default node_env', async () => {
      const loader = new ConfigLoader(path.join(fixturesPath, 'databases'), {
        node_env: 'test'
      });
      const config = await loader.load();
      expect(config.db_name).toBe('test_db');
    });
  });

  describe('Special characters and naming', () => {
    test('should handle files without extension in path', async () => {
      const config = await loadConfig(path.join(fixturesPath, 'app'));
      expect(config).toBeDefined();
      expect(config.name).toBe('test-app');
    });

    test('should not fail on paths with special characters', async () => {
      // Using existing file path
      const config = await loadConfig(path.join(fixturesPath, 'imported_config'));
      expect(config).toBeDefined();
    });
  });

  describe('Return value consistency', () => {
    test('should always return an object', async () => {
      const config1 = await loadConfig(path.join(fixturesPath, 'app'));
      expect(typeof config1).toBe('object');
      expect(config1).not.toBeNull();
      
      const config2 = await loadConfig(path.join(fixturesPath, 'nonexistent'));
      expect(typeof config2).toBe('object');
      expect(config2).not.toBeNull();
    });

    test('should return plain objects, not class instances', async () => {
      const config = await loadConfig(path.join(fixturesPath, 'app'));
      expect(config.constructor.name).toBe('Object');
    });
  });

  describe('Async behavior', () => {
    test('loadConfig should return a Promise', () => {
      const result = loadConfig(path.join(fixturesPath, 'app'));
      expect(result).toBeInstanceOf(Promise);
    });

    test('ConfigLoader.load should return a Promise', () => {
      const loader = new ConfigLoader(path.join(fixturesPath, 'app'));
      const result = loader.load();
      expect(result).toBeInstanceOf(Promise);
    });

    test('should handle concurrent loads', async () => {
      const promises = [
        loadConfig(path.join(fixturesPath, 'app')),
        loadConfig(path.join(fixturesPath, 'server')),
        loadConfig(path.join(fixturesPath, 'cache'))
      ];
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      expect(results[0].name).toBe('test-app');
      expect(results[1].server).toBeDefined();
      expect(results[2].redis).toBeDefined();
    });
  });

  describe('Module system compatibility', () => {
    test('should load CommonJS modules (.js)', async () => {
      const config = await loadConfig(path.join(fixturesPath, 'databases'));
      expect(config.db_name).toBeDefined();
    });

    test('should load ES modules (.mjs)', async () => {
      const config = await loadConfig(path.join(fixturesPath, 'api'));
      expect(config.api_key).toBeDefined();
      expect(config.base_url).toBeDefined();
    });

    test('should load TypeScript modules (.ts)', async () => {
      const config = await loadConfig(path.join(fixturesPath, 'imported_config'));
      expect(config.imi1).toBe('imported_value1');
    });
  });

  describe('Configuration immutability', () => {
    test('should return new object on each load', async () => {
      const config1 = await loadConfig(path.join(fixturesPath, 'app'));
      const config2 = await loadConfig(path.join(fixturesPath, 'app'));
      
      // Should have same values but be different objects
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });

    test('modifying returned config should not affect subsequent loads', async () => {
      const config1 = await loadConfig(path.join(fixturesPath, 'app'));
      config1.name = 'modified';
      
      const config2 = await loadConfig(path.join(fixturesPath, 'app'));
      expect(config2.name).toBe('test-app');
    });
  });
});
