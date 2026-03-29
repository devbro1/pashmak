import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/**/*.ts", "src/**/*.mts"],
    format: ["esm"], // Build for commonJS and ESmodules
    outDir: 'dist/esm',
    dts: true, // Generate declaration file (.d.ts)
    splitting: false,
    sourcemap: true,
    clean: true,
    bundle: false,
    skipNodeModulesBundle: true,
    onSuccess: "node scripts/copy-tpl-esm.js",
  },
  {
    entry: ["src/**/*.ts", "src/**/*.mts"],
    outDir: 'dist/cjs',
    format: ["cjs"], // Build for commonJS and ESmodules
    dts: false, // Generate declaration file (.d.ts)
    splitting: false,
    sourcemap: false,
    clean: true,
    bundle: true,
    skipNodeModulesBundle: false,
    onSuccess: "node scripts/copy-tpl-cjs.js",
  },
]);
