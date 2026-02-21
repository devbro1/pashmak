// a class to manage configuration settings
import { JSONPath } from 'jsonpath-plus';
import { Arr, JSONObject } from '@devbro/neko-helper';

/**
 * Interface for defining typed configuration keys.
 * Can be augmented using module declaration to add type-safe keys.
 * 
 * @example
 * ```ts
 * declare module '@devbro/neko-config' {
 *   interface ConfigKeys {
 *     'app.name': string;
 *     'app.port': number;
 *     'database.host': string;
 *   }
 * }
 * ```
 */
export interface ConfigKeys {
  // By default, this is empty. Users can augment it with their own keys.
}

/**
 * Type helper to extract valid config keys.
 * If ConfigKeys has properties, use them. Otherwise, accept any string.
 */
export type ConfigKey = keyof ConfigKeys extends never ? string : keyof ConfigKeys;

/**
 * Singleton class for managing application configuration settings.
 * Supports JSONPath queries for accessing nested configuration values.
 */
export class Config {
  private static instance: Config;
  private configs: Record<string, any>;
  private options: { env: string };

  /**
   * Creates a new Config instance (private constructor for singleton pattern).
   */
  constructor(options: { env?: string } = {}) {
    this.configs = {};
    this.options = {
      env: options.env || process.env.NODE_ENV || 'development',
    }
  }

  /**
   * Gets the singleton instance of the Config class.
   * @returns The Config singleton instance
   */
  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  /**
   * Loads configuration data, replacing any existing configuration.
   * @param new_config_data - The configuration data to load
   */
  public async load(new_config_data: Record<string, any>): Promise<void> {
    this.configs = Arr.deepClone(new_config_data)

    // this.configs may contain $env references that need to be resolved
    // for these reference we want to remove them 
    let applyEnvReferences = (value: JSONObject) => {
      let keys = Object.keys(value);
      let envValues: JSONObject | undefined = undefined;
      for(let key of keys) {
        if(key.startsWith('$') && key !== `$${this.options.env}` ) {
          console.log('Removing env reference', key);
          delete value[key];
        }
        else if(key.startsWith('$') && key === `$${this.options.env}`) {
          envValues = value[key] as JSONObject;
          delete value[key];
        }
      }

      if(envValues !== undefined) {
        value = Arr.deepMerge(value, envValues);
      }

      return value;
    };

    this.configs = await Arr.evaluateAllBranches(this.configs, applyEnvReferences);
    // resolve all promises
    this.configs = await Arr.evaluateAllNodes(this.configs, async (value) => {
      if(value instanceof Promise) {
        return await value;
      }
      return value;
    });
  }

  /**
   * Retrieves a configuration value using a JSONPath query.
   * @param key - JSONPath query string (e.g., '$.database.host')
   * @param default_value - Default value to return if key is not found (default: undefined)
   * @returns The configuration value or the default value
   */
  public get<K extends ConfigKey>(
    key: K, 
    default_value?: K extends keyof ConfigKeys ? ConfigKeys[K] : any
  ): K extends keyof ConfigKeys ? ConfigKeys[K] : any {
    try {
      const results = JSONPath({ path: key as string, json: this.configs });
      // @ts-ignore
      let rc = results.length > 0 ? results[0] : default_value;
      if(typeof rc === 'function') {
        rc = rc();
      }
      return rc;
    } catch (error) {
      // @ts-ignore
      return default_value;
    }
  }

  /**
   * Retrieves a configuration value using a JSONPath query.
   * Returns the default value if the key is not found (does not throw an error).
   * @param key - JSONPath query string (e.g., '$.database.host')
   * @param default_value - Default value to return if key is not found (default: undefined)
   * @returns The configuration value or the default value
   */
  public getOrFail<K extends ConfigKey>(
    key: K, 
    default_value?: K extends keyof ConfigKeys ? ConfigKeys[K] : any
  ): K extends keyof ConfigKeys ? ConfigKeys[K] : any {
    const results = JSONPath({ path: key as string, json: this.configs });
    // @ts-ignore
    return results.length > 0 ? results[0] : default_value;
  }

  /**
   * Checks if a configuration key exists.
   * @param key - JSONPath query string to check
   * @returns True if the key exists, false otherwise
   */
  public has(key: ConfigKey): boolean {
    try {
      const results = JSONPath({ path: key as string, json: this.configs });
      return results.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Returns all configuration data.
   * @returns The complete configuration object
   */
  public all(): Record<string, any> {
    return this.configs;
  }
}
