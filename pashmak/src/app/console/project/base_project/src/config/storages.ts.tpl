import { LocalStorageProviderConfig } from '@devbro/pashmak/storage';
import path from 'path';
import os from 'os';

export default {
  default: {
    provider: 'local',
    config: {
      basePath: path.join(os.tmpdir(), '/app-storage/'),
    } as LocalStorageProviderConfig,
  },
};
