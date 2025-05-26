import path from "path";
import os from "os";

export default {
  engine: "local",
  basePath: path.join(os.tmpdir(), "/main-app-storage/"),
};
