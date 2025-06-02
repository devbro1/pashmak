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
};
