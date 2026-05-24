import type { ReadStream } from 'fs';
import type { Stream } from 'stream';
import type { StorageProviderInterface } from './StorageProviderInterface.mjs';
import type { Metadata } from './types.mjs';

export class Storage {
  constructor(protected provider: StorageProviderInterface) {}

  exists(path: string): Promise<boolean> {
    return this.provider.exists(path);
  }

  put(path: string, content: string | object | Stream | Buffer): Promise<boolean> {
    return this.provider.put(path, content);
  }

  getJson(path: string): Promise<object> {
    return this.provider.getJson(path);
  }

  getString(path: string): Promise<string> {
    return this.provider.getString(path);
  }

  getBuffer(path: string): Promise<Buffer> {
    return this.provider.getBuffer(path);
  }

  getStream(path: string): Promise<ReadStream> {
    return this.provider.getStream(path);
  }

  delete(path: string): Promise<boolean> {
    return this.provider.delete(path);
  }

  metadata(path: string): Promise<Metadata> {
    return this.provider.metadata(path);
  }
}
