import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'], passWithNoTests: true },
  resolve: {
    alias: {
      'sarge-services-s3': path.resolve(__dirname, '../sarge-services-s3/src'),
      'sarge-services-dynamo': path.resolve(__dirname, '../sarge-services-dynamo/src'),
      'sarge-cloudwatch': path.resolve(__dirname, '../sarge-cloudwatch/src'),
    }
  }
})
