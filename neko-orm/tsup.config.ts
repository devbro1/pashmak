import { defineConfig } from 'tsup';

export default defineConfig([
  {
  entry: ['src/**/*.ts', 'src/**/*.mts'],
  format: ['esm'],
  outDir: 'dist/esm',
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
  outDir: 'dist/cjs',
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  bundle: true,
  skipNodeModulesBundle: true,
}
]);
