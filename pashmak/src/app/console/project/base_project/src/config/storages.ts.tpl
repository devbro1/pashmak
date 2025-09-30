import path from 'path';
import os from 'os';

export default {
  storages: {
    default: {
      engine: 'local',
      basePath: path.join(os.tmpdir(), '/app-storage/'),
    },
  },
};
