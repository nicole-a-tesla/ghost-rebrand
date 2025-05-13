import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx'],
    globals: true,
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
    },
  },
});