import { defineConfig } from 'tsup';

export default defineConfig([
  {
  entry: ['src/**/*.ts', 'src/**/*.mts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  bundle: false,
  skipNodeModulesBundle: true,
},
{
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  bundle: true,
  skipNodeModulesBundle: true,
}
]);
