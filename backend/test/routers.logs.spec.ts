import { describe, expect, test, vi } from 'vitest';

vi.mock('../src/api/lib/realtime', () => {
  return {
    default: vi.fn(() => () => ({ /* observable factory placeholder */ })),
    createBufferedSubscription: vi.fn(() => () => ({ /* observable factory placeholder */ })),
  } as any;
});

import { logsRouter } from '../src/api/routers/logs';

describe('logsRouter', () => {
  test('recent uses ctx.db with params', async () => {
    const ctx: any = { db: { query: vi.fn().mockResolvedValue({ rows: [] }) } };
    const caller = logsRouter.createCaller({ ...ctx, ee: { emit: vi.fn() }, requestMeta: {} });
    const res = await caller.recent({ type: 'error' });
    expect(res).toHaveProperty('items');
    expect(ctx.db.query).toHaveBeenCalled();
  });

  test('recent prefers created_at ordering with fallback to legacy timestamp', async () => {
    const mixed = [
      { id: 1, service_id: 's1', type: 'info', message: 'a', timestamp: '2025-10-21T10:00:00Z' },
      { id: 2, service_id: 's2', type: 'info', message: 'b', timestamp: '2025-10-23T10:00:00Z' },
      { id: 3, service_id: 's3', type: 'info', message: 'c', timestamp: '2025-10-22T10:00:00Z', created_at: '2025-10-24T09:00:00Z' },
    ];
    const sorter = (a: any, b: any) => {
      const ad = a.created_at ? new Date(a.created_at).getTime() : null;
      const bd = b.created_at ? new Date(b.created_at).getTime() : null;
      if (ad !== null && bd !== null) return bd - ad;
      if (ad !== null) return -1;
      if (bd !== null) return 1;
      const at = a.timestamp ? new Date(a.timestamp).getTime() : null;
      const bt = b.timestamp ? new Date(b.timestamp).getTime() : null;
      if (at !== null && bt !== null) return bt - at;
      if (at !== null) return -1;
      if (bt !== null) return 1;
      return 0;
    };

    const ctx: any = {
      db: {
        query: vi.fn().mockImplementation(async (sql: string) => {
          expect(sql).toContain('ORDER BY created_at DESC NULLS LAST, "timestamp" DESC NULLS LAST');
          expect(sql).toContain(', id DESC');
          expect(sql).toContain('created_at');
          const sorted = [...mixed].sort(sorter);
          return { rows: sorted };
        }),
      },
    };
    const caller = logsRouter.createCaller({ ...ctx, ee: { emit: vi.fn() }, requestMeta: {} });
    const res = await caller.recent({ type: undefined });
    const rows = res.items;
    expect(rows[0].id).toBe(3); // created_at row first
    expect(rows[1].id).toBe(2); // then highest timestamp
    expect(rows[2].id).toBe(1);
    expect(res.nextCursor).toBeTruthy();
  });

  test('stream wires buffered subscription with correct params', async () => {
    const rt = await import('../src/api/lib/realtime');
    expect((rt as any).default).toHaveBeenCalledWith('logs:new', { bufferSize: 500, perTickCap: 100 });
  });
});
