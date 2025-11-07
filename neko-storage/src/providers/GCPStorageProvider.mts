import { Storage as GCPStorage } from '@google-cloud/storage';
import { Metadata, GCPStorageConfig } from '../types.mjs';
import { StorageProviderInterface } from '../StorageProviderInterface.mjs';
import { ReadStream } from 'fs';
import Stream, { Readable } from 'stream';
import * as mime from 'mime-types';

export class GCPStorageProvider implements StorageProviderInterface {
  private storage: GCPStorage;
  private bucketName: string;

  constructor(protected config: GCPStorageConfig) {
    this.storage = new GCPStorage(config.gcpConfig);
    this.bucketName = config.bucket || '';
    if (!this.bucketName) {
      throw new Error('Bucket name is required for GCP Storage');
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      const file = this.storage.bucket(this.bucketName).file(path);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      return false;
    }
  }

  async put(path: string, content: string | object | Stream | Buffer): Promise<boolean> {
    const file = this.storage.bucket(this.bucketName).file(path);

    let data: string | Buffer | Stream;
    if (typeof content === 'string' || content instanceof Buffer) {
      data = content;
    } else if (typeof content === 'object' && !(content instanceof Stream)) {
      data = JSON.stringify(content);
    } else if (content instanceof Stream) {
      data = content;
    } else {
      throw new Error('Unsupported content type');
    }

    if (data instanceof Stream) {
      await new Promise<void>((resolve, reject) => {
        data
          .pipe(file.createWriteStream())
          .on('finish', () => resolve())
          .on('error', reject);
      });
    } else {
      await file.save(data);
    }

    return true;
  }

  async getJson(path: string): Promise<object> {
    const data = await this.getString(path);
    return JSON.parse(data);
  }

  async getString(path: string): Promise<string> {
    const file = this.storage.bucket(this.bucketName).file(path);
    const [content] = await file.download();
    return content.toString('utf-8');
  }

  async getBuffer(path: string): Promise<Buffer> {
    const file = this.storage.bucket(this.bucketName).file(path);
    const [content] = await file.download();
    return content;
  }

  async getStream(path: string): Promise<ReadStream> {
    const file = this.storage.bucket(this.bucketName).file(path);
    return file.createReadStream() as unknown as ReadStream;
  }

  async delete(path: string): Promise<boolean> {
    const file = this.storage.bucket(this.bucketName).file(path);
    await file.delete();
    return true;
  }

  async metadata(path: string): Promise<Metadata> {
    const file = this.storage.bucket(this.bucketName).file(path);
    const [metadata] = await file.getMetadata();

    return {
      size: typeof metadata.size === 'number' ? metadata.size : parseInt(metadata.size || '0', 10),
      mimeType: metadata.contentType || mime.lookup(path) || 'unknown',
      lastModifiedDate: metadata.updated || new Date(0).toISOString(),
    };
  }
}
