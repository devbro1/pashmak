import { cp } from "fs/promises";
import { globby } from "globby";

const files = await globby("src/**/*.tpl");

await Promise.all(
  files.map(async (file) => {
    const dest = file.replace(/^src\//, "dist/esm/");
    await cp(file, dest, { recursive: true });
  }),
);
