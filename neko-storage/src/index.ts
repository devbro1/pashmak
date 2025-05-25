import Stream from "stream";
import * as fs from "fs/promises";
import { createWriteStream } from "fs";
import * as path from 'path';

export interface Storage {
  exists(path: string): Promise<boolean>;
  put(path: string, content: string | object | Stream | Buffer): Promise<boolean>;
  getJson(path: string): Promise<object>;
  getString(path: string): Promise<string>;
  delete(path: string): Promise<boolean>;
}

export type StorageConfig = {
  engine: string;
  basePath: string;
}

export class LocalStorage extends Storage {
  constructor(private config: StorageConfig) {
    super();
    if(!LocalStorage.canHandle(this.config)) {
      throw new Error(`storage engine type mismatch, ${this.config.engine} vs ${LocalStorage.engineType}`);
    }

    // Ensure the base folder exists
    fs.mkdir(this.config.basePath, { recursive: true }).catch((error) => {
      throw error;
    });
  }

  static canHandle(config: StorageConfig) {
    if(config.engine === 'local') {
      return true;
    }
    return false;
  }

  getFullPath(filePath: string) {
    return path.join(this.config.basePath,filePath);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(this.getFullPath(path));
      return true;
    } catch {
      return false;
    }
  }

  async put(path: string, content: string | object | Stream | Buffer): Promise<boolean> {
      const fullPath = this.getFullPath(path);
      
      if (typeof content === "string" || content instanceof Buffer) {
        await fs.writeFile(fullPath, content);
      } else if (typeof content === "object" && !(content instanceof Stream)) {
        await fs.writeFile(fullPath, JSON.stringify(content, null, 2));
        const writeStream = createWriteStream(fullPath);
        await new Promise((resolve, reject) => {
          (content as Stream).pipe(writeStream);
          (content as Stream).on("end", resolve);
          (content as Stream).on("error", reject);
        });
      } else {
        throw new Error("Unsupported content type");
      }
  
      return true;
  }

  async getJson(path: string): Promise<object> {
      const fullPath = this.getFullPath(path);
      const content = await fs.readFile(fullPath, "utf-8");
      return JSON.parse(content);
  }

  async getString(path: string): Promise<string> {
    const fullPath = this.getFullPath(path);
      return await fs.readFile(fullPath, "utf-8");
  }

  async delete(path: string): Promise<boolean> {
      const fullPath = this.getFullPath(path);
      await fs.unlink(fullPath);
      return true;
  }

}

export interface StorageConstructor {
  new (config: StorageConfig): Storage;
  canHandle(config: StorageConfig): boolean;
}

export class StorageBuilder {
  public static storageEngines: StorageConstructor[] = [LocalStorage];

  registerStorageEngine(engine: StorageConstructor) {
    StorageBuilder.storageEngines.push(engine);
  }

  buildStorage(config: StorageConfig): Storage {
    for(const engine of StorageBuilder.storageEngines) {
      if(engine.canHandle(config)) {
        return new engine(config);
      }
    }
    throw new Error('No matchin storage engine found');
  }
}