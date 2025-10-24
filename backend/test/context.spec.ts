import { vi, test, expect } from 'vitest';

vi.mock('../src/env', () => ({
  ENV: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  },
}));

import { createContext } from '../src/context';
import { db } from '../src/api/lib/db';
import { ee } from '../src/api/lib/events';

test('createContext returns singletons and correct metadata', async () => {
  const req = {
    headers: {
      'x-forwarded-for': '123.123.123.123',
      'user-agent': 'test-agent',
      origin: 'https://test.com',
    },
  } as any;

  const ctx = await createContext({ req });

  // Check for singleton instances
  expect(ctx.db).toBe(db);
  expect(ctx.ee).toBe(ee);

  // Check for correct metadata parsing
  expect(ctx.requestMeta.ip).toBe('123.123.123.123');
  expect(ctx.requestMeta.ua).toBe('test-agent');
  expect(ctx.requestMeta.origin).toBe('https://test.com');
});

test('createContext handles missing headers gracefully', async () => {
  const req = {
    headers: {},
  } as any;

  const ctx = await createContext({ req });

  expect(ctx.db).toBe(db);
  expect(ctx.ee).toBe(ee);
  expect(ctx.requestMeta.ip).toBeUndefined();
  expect(ctx.requestMeta.ua).toBeUndefined();
  expect(ctx.requestMeta.origin).toBeUndefined();
});

test('createContext works without a request object', async () => {
  const ctx = await createContext();

  expect(ctx.db).toBe(db);
  expect(ctx.ee).toBe(ee);
  expect(ctx.requestMeta).toEqual({});
});
