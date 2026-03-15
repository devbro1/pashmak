import path from 'path';
import os from 'os';
import { getEnv } from '@devbro/pashmak/helper';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfigData, DotPaths } from '@devbro/pashmak/config';
import * as databases_config from './databases';
import * as storages_config from './storages';
import * as mailers_config from './mailers';
import * as queues_config from './queues';
import * as caches_config from './caches';
import * as loggers_config from './loggers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const project_configs = {
  databases: loadConfigData(databases_config),
  storages: loadConfigData(storages_config),
  mailer: loadConfigData(mailers_config),
  loggers: loadConfigData(loggers_config),
  queues: loadConfigData(queues_config),
  caches: loadConfigData(caches_config),
  base_url: getEnv('BASE_URL', 'http://localhost:' + getEnv('PORT', '3000')),
  port: getEnv('PORT', 3000),
  file_upload_path: path.join(os.tmpdir(), ''),
  migration: {
    path: path.join(__dirname, '..', 'database/migrations'),
  },
  jwt: {
    options: {
      algorithm: 'RS256',
      expiresIn: 8 * 3600,
    },
    refresh_options: {
      algorithm: 'RS256',
      expiresIn: 3 * 24 * 3600,
    },
    secret: '-----BEGIN PRIVATE KEY-----\n' + process.env.jwt_secret_private + '\n-----END PRIVATE KEY-----\n',
    public: '-----BEGIN PUBLIC KEY-----\n' + process.env.jwt_secret_public + '\n-----END PUBLIC KEY-----\n',
    public_retired:
      '-----BEGIN PUBLIC KEY-----\n' + process.env.jwt_secret_public_retired + '\n-----END PUBLIC KEY-----\n',
  },
  public_path: path.join(__dirname, '../..', 'public'),
  debug_mode: getEnv('APP_DEBUG', false),
};

export const $test = {
  // Test environment overrides
};

declare module '@devbro/neko-config' {
    interface ConfigKeys extends Record<DotPaths<typeof project_configs>, string> {
    }
}

export default project_configs;