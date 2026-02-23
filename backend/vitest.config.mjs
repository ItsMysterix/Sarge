import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './backend/test/setup.ts',
    pool: 'threads',
  },
});
