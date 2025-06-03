import path from "path";
import os from "os";

export default {
  databases: require("./databases"),
  storages: require("./storages"),
  port: process.env.PORT || 3000,
  file_upload_path: path.join(os.tmpdir(), ""),
  migration: {
    path: path.join(__dirname, "..", "database/migrations"),
  },
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
      "-----BEGIN RSA PRIVATE KEY-----\n" +
      process.env.jwt_secret_private +
      "\n-----END RSA PRIVATE KEY-----\n",
    public:
      "-----BEGIN RSA PUPLIC KEY-----\n" +
      process.env.jwt_secret_public +
      "\n-----END RSA PUBLIC KEY-----\n",
  },
};
