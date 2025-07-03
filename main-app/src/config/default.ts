import path from "path";
import os from "os";
import { getEnv } from "neko-helper";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export default {
  databases: await import("./databases"),
  storages: await import("./storages"),
  port: getEnv("PORT", 3000),
  file_upload_path: path.join(os.tmpdir(), ""),
  migration: {
    path: path.join(__dirname, "..", "database/migrations"),
  },
  loggers: await import("./loggers"),
  jwt: {
    options: {
      algorithm: "RS256",
      expiresIn: 8 * 3600,
    },
    refresh_options: {
      algorithm: "RS256",
      expiresIn: 3 * 24 * 3600,
    },
    secret:
      "-----BEGIN PRIVATE KEY-----\n" +
      process.env.jwt_secret_private +
      "\n-----END PRIVATE KEY-----\n",
    public:
      "-----BEGIN PUBLIC KEY-----\n" +
      process.env.jwt_secret_public +
      "\n-----END PUBLIC KEY-----\n",
      public_retired:
      "-----BEGIN PUBLIC KEY-----\n" +
      process.env.jwt_secret_public_retired +
      "\n-----END PUBLIC KEY-----\n",
  },
};
