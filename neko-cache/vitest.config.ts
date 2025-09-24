import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/?(*.)+(spec|test).ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/src/config/**'],
    root: './',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
