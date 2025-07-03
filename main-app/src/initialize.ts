import { bootstrap } from "@devbro/pashmak";
import { dirname } from "path";
import { fileURLToPath } from "url";

await bootstrap({
  root_dir: dirname(fileURLToPath (import.meta.url)),
});