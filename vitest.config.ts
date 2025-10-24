/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'backend/test/**/*.spec.ts',
      'ops/tests/**/*.spec.ts',
      'app/**/__tests__/**/*.spec.tsx'
    ],
    setupFiles: 'backend/test/setup.ts'
  }
})
