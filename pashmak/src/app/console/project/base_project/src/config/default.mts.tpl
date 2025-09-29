import path from 'path';
import os from 'os';
import { getEnv } from '@devbro/pashmak/helper';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const extends_list = ['databases', 'storages', 'mailer', 'loggers', 'queues', 'caches'];

export default {
  extends: [...extends_list.map((i) => `./${i}.js`), ...extends_list.map((i) => `./${i}.ts`)],
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
