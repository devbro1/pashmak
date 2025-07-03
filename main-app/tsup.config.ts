import { defineConfig } from "tsup";

export default defineConfig([{
  entry: ["src/*.ts", "src/app/**/*.ts", "src/database/**/*.ts", 'src/config/**/*.ts'],
  format: ["esm"], // Build for commonJS and ESmodules
  dts: true, // Generate declaration file (.d.ts)
  splitting: false,
  sourcemap: true,
  clean: true,
  bundle: false,
  skipNodeModulesBundle: true,
},
]);
