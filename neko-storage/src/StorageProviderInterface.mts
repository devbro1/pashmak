import type { ReadStream } from 'fs';
import type { Stream } from 'stream';
import type { Metadata } from './types.mjs';

export interface StorageProviderInterface {
  exists(path: string): Promise<boolean>;
  put(path: string, content: string | object | Stream | Buffer): Promise<boolean>;
  getJson(path: string): Promise<object>;
  getString(path: string): Promise<string>;
  getBuffer(path: string): Promise<Buffer>;
  getStream(path: string): Promise<ReadStream>;
  delete(path: string): Promise<boolean>;
  metadata(path: string): Promise<Metadata>;
}
