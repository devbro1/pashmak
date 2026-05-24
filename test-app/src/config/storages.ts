import os from "os";
import path from "path";

export default {
  default: {
    provider: "local",
    config: {
      basePath: path.join(os.tmpdir(), "/app-storage/"),
    },
  },
};
