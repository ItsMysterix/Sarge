import { describe, expect, test } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('logs retention SQL', () => {
  test('retention.sql contains expected DELETE statement with interval and param', () => {
    const sql = readFileSync(resolve(__dirname, '../../scripts/retention.sql'), 'utf8');
    expect(sql).toMatch(/DELETE\s+FROM\s+logs/i);
    expect(sql).toMatch(/created_at\s+<\s+NOW\(\)\s+-\s*\(INTERVAL\s+'1 day'\s*\*\s*COALESCE\(\$1::int,\s*7\)\)/i);
  });
});
