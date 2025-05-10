import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
    },
  },
});