import { bootstrap } from "@devbro/pashmak";
import { dirname } from "path";
import { fileURLToPath } from "url";

await bootstrap({
  root_dir: dirname(fileURLToPath(import.meta.url)),
});

console.log("Registering service providers...");
await import(`./app/console`);
await import(`./routes`);
await import(`./schedules`);