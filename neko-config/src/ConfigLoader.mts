import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { Arr } from '@devbro/neko-helper';

export class ConfigLoader {
  private file_path = './configs/default'; // folder to load configs from
  private allowed_extensions: string[] = ['.json', '.yml', '.yaml', '.js', '.ts', '.mjs', '.mts'];
  private load_only_first_match: boolean = false;

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
    // TODO: Implement YAML parsing when yaml dependency is added
    throw new Error('YAML support not yet implemented. Please add yaml parser dependency.');
  }

  private async loadModule(filePath: string): Promise<Record<string, any>> {
    // Convert to file URL for dynamic import
    const fileUrl = pathToFileURL(path.resolve(filePath)).href;
    const module = await import(fileUrl);

    // Get the default export
    const defaultConfig = module.default || {};

    // Get environment-specific config if exists
    const env = process.env.NODE_ENV || 'development';
    const envKey = `$${env}`;
    const envConfig = module[envKey] || {};

    // Merge default with environment-specific config
    return Arr.deepMerge(defaultConfig, envConfig);
  }
}
