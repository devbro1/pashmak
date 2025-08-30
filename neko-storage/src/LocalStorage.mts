import Stream from 'stream';
import * as fs from 'fs/promises';
import { createWriteStream, createReadStream, ReadStream } from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import { Metadata, StorageConfig } from './types.mjs';
import { Storage } from './Storage.mjs';

export class LocalStorage extends Storage {
  constructor(config: StorageConfig) {
    super(config);

    if (!LocalStorage.canHandle(config)) {
      throw new Error(`storage engine cannot handle this config.`);
    }
    // Ensure the base folder exists
    fs.mkdir(this.config.basePath, { recursive: true }).catch((error) => {
      throw error;
    });
  }

  async metadata(path: string): Promise<Metadata> {
    const fullPath = this.getFullPath(path);
    const stats = await fs.stat(fullPath);
    return {
      size: stats.size,
      mimeType: mime.lookup(fullPath) || 'unknown',
      lastModifiedDate: stats.mtime.toISOString(),
    };
  }

  static canHandle(config: StorageConfig) {
    if (config.engine === 'local') {
      return true;
    }
    return false;
  }

  getFullPath(filePath: string) {
    return path.join(this.config.basePath, filePath);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(this.getFullPath(path));
      return true;
    } catch {
      return false;
    }
  }

  async put(filepath: string, content: string | object | Stream | Buffer): Promise<boolean> {
    const fullPath = this.getFullPath(filepath);

    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });

    if (typeof content === 'string' || content instanceof Buffer) {
      await fs.writeFile(fullPath, content);
    } else if (typeof content === 'object' && !(content instanceof Stream)) {
      await fs.writeFile(fullPath, JSON.stringify(content, null, 2));
    } else if (typeof content === 'object' && content instanceof Stream) {
      const writeStream = createWriteStream(fullPath);
      await new Promise((resolve, reject) => {
        (content as Stream).pipe(writeStream);
        (content as Stream).on('end', resolve);
        (content as Stream).on('error', reject);
      });
    } else {
      throw new Error('Unsupported content type');
    }

    return true;
  }

  async getJson(path: string): Promise<object> {
    const fullPath = this.getFullPath(path);
    const content = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(content);
  }

  async getString(path: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    const fullPath = this.getFullPath(path);
    return await fs.readFile(fullPath, encoding);
  }

  async getBuffer(path: string): Promise<Buffer> {
    const fullPath = this.getFullPath(path);
    return await fs.readFile(fullPath);
  }

  async getStream(path: string): Promise<ReadStream> {
    const fullPath = this.getFullPath(path);
    return createReadStream(fullPath);
  }

  async delete(path: string): Promise<boolean> {
    const fullPath = this.getFullPath(path);
    await fs.unlink(fullPath);
    return true;
  }
}
