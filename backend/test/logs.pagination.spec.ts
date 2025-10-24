import { describe, expect, test, vi } from 'vitest';
import { logsRouter } from '../src/api/routers/logs';

function makeCursor(created_at: string, id: number) {
  return Buffer.from(JSON.stringify({ created_at, id }), 'utf8').toString('base64');
}

describe('logs.recent pagination', () => {
  test('builds WHERE tuple when cursor provided and returns nextCursor', async () => {
    const rows = [
      { id: 3, created_at: '2025-10-22T10:00:00Z' },
      { id: 2, created_at: '2025-10-22T09:59:00Z' },
      { id: 1, created_at: '2025-10-22T09:58:00Z' },
    ];

    const ctx: any = {
      db: {
        query: vi.fn().mockImplementation(async (sql: string, params: any[]) => {
          expect(sql).toContain('(created_at, id) <');
          expect(sql).toContain('ORDER BY created_at DESC NULLS LAST, "timestamp" DESC NULLS LAST, id DESC');
          expect(sql).toContain('LIMIT $');
          // Simulate DB page
          return { rows };
        }),
      },
    };

    const caller = logsRouter.createCaller({ ...ctx, ee: { emit: vi.fn() }, requestMeta: {} });
    const cursor = makeCursor('2025-10-22T10:05:00Z', 10);
    const res = await caller.recent({ cursor, limit: 3 });
    expect(res.items.length).toBe(3);
    expect(res.nextCursor).toBeTruthy();
    const decoded = JSON.parse(Buffer.from(res.nextCursor!, 'base64').toString('utf8'));
    expect(decoded).toEqual({ created_at: rows[rows.length - 1].created_at, id: rows[rows.length - 1].id });
  });
});
