import Stream from 'stream';
import { AWSS3Storage } from './AWSS3Storage';
import { LocalStorage } from './LocalStorage';
import { S3ClientConfig } from '@aws-sdk/client-s3';

export * from './AWSS3Storage';
export * from './LocalStorage';

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
  bucket?: string;
  s3Config?: S3ClientConfig;
};
export interface StorageConstructor {
  new (config: StorageConfig): Storage;
  canHandle(config: StorageConfig): boolean;
}

export class StorageBuilder {
  public static storageEngines: StorageConstructor[] = [LocalStorage, AWSS3Storage];

  registerStorageEngine(engine: StorageConstructor) {
    StorageBuilder.storageEngines.push(engine);
  }

  buildStorage(config: StorageConfig): Storage {
    for (const engine of StorageBuilder.storageEngines) {
      if (engine.canHandle(config)) {
        return new engine(config);
      }
    }
    throw new Error('No matchin storage engine found');
  }
}
