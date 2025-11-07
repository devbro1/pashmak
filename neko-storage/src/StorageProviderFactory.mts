import { Storage } from './Storage.mjs';
import { FlexibleFactory } from '@devbro/neko-helper';
import { StorageProviderInterface } from './StorageProviderInterface.mjs';

export class StorageProviderFactory {
  static instance: FlexibleFactory<StorageProviderInterface> =
    new FlexibleFactory<StorageProviderInterface>();

  static register(key: string, factory: (...args: any[]) => StorageProviderInterface): void {
    StorageProviderFactory.instance.register(key, factory);
  }

  static create<T>(key: string, ...args: any[]): StorageProviderInterface {
    return StorageProviderFactory.instance.create(key, ...args);
  }
}
