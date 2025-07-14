import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/**/*.ts"],
    format: ["esm"], // Build for commonJS and ESmodules
    dts: true, // Generate declaration file (.d.ts)
    splitting: false,
    sourcemap: true,
    clean: true,
    bundle: false,
    skipNodeModulesBundle: true,
    onSuccess: "node scripts/copy-tpl.js",
  },
  {
    entry: ["src/bin/*.ts"],
    outDir: "dist/bin",
    format: ["cjs"], // Build for commonJS and ESmodules
    dts: false, // Generate declaration file (.d.ts)
    splitting: false,
    sourcemap: false,
    clean: true,
    bundle: true,
    skipNodeModulesBundle: false,
    outExtension: () => ({ js: ".cjs" }),
    onSuccess: "node scripts/copy-tpl.js",
  },
]);
