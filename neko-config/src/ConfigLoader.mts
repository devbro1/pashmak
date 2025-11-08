import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import * as yaml from 'js-yaml';
import { Arr } from '@devbro/neko-helper';

export type ConfigLoaderOptions = {
  allowed_extensions: string[];
  load_only_first_match: boolean;
  node_env: string;
};
export class ConfigLoader {
  private allowed_extensions: string[];
  private load_only_first_match: boolean;
  private node_env: string;

  constructor(
    private file_path: string,
    options: Partial<ConfigLoaderOptions> = {}
  ) {
    this.allowed_extensions = ['.json', '.yml', '.yaml', '.js', '.mjs', '.ts', '.mts'];
    this.load_only_first_match = false;
    this.node_env = process.env.NODE_ENV || 'development';

    if (options.allowed_extensions) {
      this.allowed_extensions = options.allowed_extensions;
    }
    if (options.load_only_first_match !== undefined) {
      this.load_only_first_match = options.load_only_first_match;
    }
    if (options.node_env !== undefined) {
      this.node_env = options.node_env;
    }
  }

  async load(): Promise<Record<string, any>> {
    let rc: Record<string, any> | undefined = undefined;

    // Try to load files with each allowed extension
    for (const ext of this.allowed_extensions) {
      if (this.load_only_first_match && rc !== undefined) {
        break;
      }

      const filePath = this.file_path + ext;

      if (fs.existsSync(filePath)) {
        const config = await this.loadFile(filePath, ext);
        rc = Arr.deepMerge(rc || {}, config || {});
      }
    }

    return rc || {};
  }

  private async loadFile(filePath: string, ext: string): Promise<Record<string, any> | null> {
    switch (ext) {
      case '.json':
        return this.loadJSON(filePath);
      case '.yml':
      case '.yaml':
        return this.loadYAML(filePath);
      case '.js':
      case '.mjs':
      case '.ts':
      case '.mts':
        return await this.loadModule(filePath);
      default:
        return null;
    }
  }

  private loadJSON(filePath: string): Record<string, any> {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  private loadYAML(filePath: string): Record<string, any> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = yaml.load(content);
    return (parsed as Record<string, any>) || {};
  }

  private async loadModule(filePath: string): Promise<Record<string, any>> {
    // Convert to file URL for dynamic import
    const fileUrl = pathToFileURL(path.resolve(filePath)).href;
    const module = await import(fileUrl);

    // Get the default export
    let defaultConfig = module.default || {};

    // Get environment-specific config if exists
    const envKey = `$${this.node_env}`;
    let envConfig = module[envKey] || {};

    // resolve any promises in defaultConfig and envConfig
    let resolver = async (value: any) => {
      if (value instanceof Promise) {
        return await value;
      }
      return value;
    };
    defaultConfig = await Arr.evaluateAllNodes(defaultConfig, resolver);
    envConfig = await Arr.evaluateAllNodes(envConfig, resolver);

    // Merge default with environment-specific config
    return Arr.deepMerge(defaultConfig, envConfig);
  }
}

/**
 * Loads configuration from a file path relative to the caller's location.
 * Supports JSON, YAML, and JavaScript/TypeScript modules with environment-specific overrides.
 *
 * @param file_path - Path to the config file (relative to caller or absolute)
 * @param options - Configuration options
 * @returns Promise resolving to the loaded configuration object
 */
export function loadConfig(
  file_path: string,
  options: Partial<ConfigLoaderOptions> = {}
): Promise<Record<string, any>> {
  // Get the caller's file path from the stack trace
  const originalPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const stack = new Error().stack as unknown as NodeJS.CallSite[];
  Error.prepareStackTrace = originalPrepareStackTrace;

  // Get the caller's directory (skip current function)
  const callerFile = stack[1]?.getFileName();
  const callerDir = callerFile ? path.dirname(callerFile) : process.cwd();

  // Resolve the file path relative to the caller's directory
  const resolvedPath = path.isAbsolute(file_path) ? file_path : path.join(callerDir, file_path);

  const loader = new ConfigLoader(resolvedPath, options);
  return loader.load();
}
