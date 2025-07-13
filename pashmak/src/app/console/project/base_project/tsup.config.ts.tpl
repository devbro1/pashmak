import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/*.ts", "src/app/**/*.ts", "src/config/**/*.ts"],
    format: ["esm"], // Build for commonJS and ESmodules
    dts: true, // Generate declaration file (.d.ts)
    splitting: false,
    sourcemap: true,
    clean: true,
    bundle: false,
    skipNodeModulesBundle: true,
  },
  { // since db migration code is loaded dynamically, we need to build it separately to prevent excess files from being created
    entry: ["src/database/migrations/*.ts"],
    outDir: "dist/database/migrations",
    format: ["esm"], // Build for commonJS and ESmodules
    dts: false, // Generate declaration file (.d.ts)
    splitting: false,
    sourcemap: false,
    clean: true,
    bundle: false,
    skipNodeModulesBundle: true,
  },
]);
