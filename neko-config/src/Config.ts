// a class to manage configuration settings
import { JSONPath } from 'jsonpath-plus';

export class Config {
  private static instance: Config;
  private configs: Record<string, any>;

  constructor() {
    this.configs = {};
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public load(new_config_data: Record<string, any>): void {
    this.configs = JSON.parse(JSON.stringify(new_config_data));
  }

  public get(key: string, default_value: any = undefined): any | undefined {
    try {
      const results = JSONPath({ path: key, json: this.configs });
      return results.length > 0 ? results[0] : default_value;
    } catch (error) {
      return default_value;
    }
  }

  public getOrFail(key: string, default_value: any = undefined): any {
    const results = JSONPath({ path: key, json: this.configs });
    return results.length > 0 ? results[0] : default_value;
  }

  public has(key: string): boolean {
    try {
      const results = JSONPath({ path: key, json: this.configs });
      return results.length > 0;
    } catch (error) {
      return false;
    }
  }

  public all(): Record<string, any> {
    return this.configs;
  }
}
