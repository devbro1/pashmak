import { AWSS3Storage } from './AWSS3Storage.mjs';
import { LocalStorage } from './LocalStorage.mjs';
import { Storage } from './Storage.mjs';
import { StorageConfig } from './types.mjs';

export class StorageFactory {
  public static storageEngines: (typeof Storage)[] = [LocalStorage, AWSS3Storage];

  registerStorageEngine(engine: typeof Storage) {
    StorageFactory.storageEngines.push(engine);
  }

  public static create(config: StorageConfig): Storage {
    for (const engine of StorageFactory.storageEngines) {
      if (engine.canHandle(config)) {
        // @ts-ignore
        return new engine(config);
      }
    }
    throw new Error('No matchin storage engine found');
  }
}
