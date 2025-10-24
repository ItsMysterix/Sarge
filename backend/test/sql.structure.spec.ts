import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('SQL migrations structure', () => {
  const init = readFileSync(resolve(__dirname, '../../scripts/migrations/0001_init.sql'), 'utf8');
  const idx = readFileSync(resolve(__dirname, '../../scripts/migrations/0002_indexes.sql'), 'utf8');

  test('init contains expected CREATE TABLE statements', () => {
    expect(init).toContain('CREATE TABLE IF NOT EXISTS metrics');
    expect(init).toContain('CREATE TABLE IF NOT EXISTS logs');
    expect(init).toContain('CREATE TABLE IF NOT EXISTS deployments');
  });

  test('indexes contain expected CREATE INDEX statements', () => {
    expect(idx).toContain('CREATE INDEX IF NOT EXISTS idx_metrics_timestamp_desc');
    expect(idx).toContain('CREATE INDEX IF NOT EXISTS idx_logs_timestamp_desc');
    expect(idx).toContain('CREATE INDEX IF NOT EXISTS idx_logs_type');
    expect(idx).toContain('CREATE INDEX IF NOT EXISTS idx_deployments_created_at_desc');
    expect(idx).toContain('CREATE INDEX IF NOT EXISTS idx_deployments_status');
  });
});
