import { defineConfig } from "tsup";

export default defineConfig([{
  entry: ["src/*.ts", "src/app/**/*.ts", "src/database/**/*.ts"],
  format: ["cjs", "esm"], // Build for commonJS and ESmodules
  dts: true, // Generate declaration file (.d.ts)
  splitting: false,
  sourcemap: true,
  clean: true,
  bundle: false,
  skipNodeModulesBundle: true,
},
{
    entry: ['src/config/*.js'], // all .ts files in config
    outDir: 'dist/config',
    format: ['cjs'],     // or 'esm' as needed
    dts: false,          // don't emit .d.ts
    sourcemap: false,    // don't emit .map
    clean: false,        // don't wipe the dist folder
    shims: false,        // optional: disables certain node polyfills
    skipNodeModulesBundle: true,
    tsconfig: 'tsconfig.json', // specify your tsconfig file,
    external: [] // optional: specify external dependencies if needed
  }
]);
