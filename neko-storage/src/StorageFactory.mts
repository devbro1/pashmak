import { AWSS3Storage } from './AWSS3Storage.mjs';
import { LocalStorage } from './LocalStorage.mjs';
import { Storage } from './Storage.mjs';
import { StorageConfig } from './types.mjs';
import { FlexibleFactory } from '@devbro/neko-helper';

export class StorageFactory {
  static instance: FlexibleFactory<Storage> = new FlexibleFactory<Storage>();

  public static storageEngines: (typeof Storage)[] = [LocalStorage, AWSS3Storage];

  static register(key: string, factory: (...args: any[]) => Storage): void {
    StorageFactory.instance.register(key, factory);
  }

  static create<T>(key: string, ...args: any[]): Storage {
    return StorageFactory.instance.create(key, ...args);
  }
}
