import dotenv from "dotenv";
dotenv.config();

import { bootstrap } from "@devbro/pashmak";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { loadConfig } from "c12";

const { config: config_data } = await loadConfig({
  cwd: dirname(fileURLToPath(import.meta.url)),
  configFile: "./config/default",
});

await bootstrap({
  root_dir: dirname(fileURLToPath(import.meta.url)),
  config_data,
});

console.log("Registering service providers...");
await import(`./app/console`);
await import(`./routes`);
await import(`./schedules`);
