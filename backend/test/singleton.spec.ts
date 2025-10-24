import { vi, test, expect } from 'vitest';

vi.mock('../src/env', () => ({
  ENV: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  },
}));

test('db instances are singletons', async () => {
  const { db: db1 } = await import('../src/api/lib/db');
  const { db: db2 } = await import('../src/api/lib/db');
  expect(db1).toBe(db2);
});

test('ee instances are singletons', async () => {
  const { ee: ee1 } = await import('../src/api/lib/events');
  const { ee: ee2 } = await import('../src/api/lib/events');
  expect(ee1).toBe(ee2);
});
