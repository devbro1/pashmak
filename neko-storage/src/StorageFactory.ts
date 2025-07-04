import { AWSS3Storage } from './AWSS3Storage';
import { LocalStorage } from './LocalStorage';
import { Storage } from './Storage';
import { StorageConfig } from './types';

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
