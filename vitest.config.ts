import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for React component tests, node for backend tests
    environment: process.env.VITEST_ENV === 'node' ? 'node' : 'jsdom',
    include: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx'],
    setupFiles: ['./test-setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
    },
  },
});