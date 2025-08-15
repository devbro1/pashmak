import { ReadStream } from 'fs';
import { Stream } from 'stream';
import { Metadata } from './types.mjs';
import { StorageConfig } from './types.mjs';

export abstract class Storage {
  constructor(protected config: StorageConfig) {}

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
