import { ReadStream } from 'fs';
import { Stream } from 'stream';
import { Metadata } from './types';
import { StorageConfig } from './types';

export abstract class Storage {
  constructor(protected config: StorageConfig) {
    if (!Storage.canHandle(config)) {
      throw new Error(`storage engine type mismatch, ${this.config.engine} vs local`);
    }
  }

  static canHandle(config: StorageConfig): boolean {
    throw new Error('Method not implemented.');
  }

  abstract exists(path: string): Promise<boolean>;
  abstract put(path: string, content: string | object | Stream | Buffer): Promise<boolean>;
  abstract getJson(path: string): Promise<object>;
  abstract getString(path: string): Promise<string>;
  abstract getBuffer(path: string): Promise<Buffer>;
  abstract getStream(path: string): Promise<ReadStream>;
  abstract delete(path: string): Promise<boolean>;
  abstract metadata(path: string): Promise<Metadata>;
}
