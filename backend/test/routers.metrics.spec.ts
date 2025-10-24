import { describe, expect, test, vi } from 'vitest';

vi.mock('../src/api/lib/realtime', () => {
  return {
    default: vi.fn(() => () => ({ /* observable factory placeholder */ })),
    createBufferedSubscription: vi.fn(() => () => ({ /* observable factory placeholder */ })),
  } as any;
});

import { metricsRouter } from '../src/api/routers/metrics';

describe('metricsRouter', () => {
  test('latest uses ctx.db', async () => {
    const ctx: any = { db: { query: vi.fn().mockResolvedValue({ rows: [] }) } };
    const caller = metricsRouter.createCaller({ ...ctx, ee: { emit: vi.fn() }, requestMeta: {} });
    await caller.latest();
    expect(ctx.db.query).toHaveBeenCalled();
  });

  test('latest prefers created_at over legacy timestamp via SQL ORDER BY', async () => {
    const mixed = [
      { id: 1, service_id: 'a', cpu: 10, memory: 100, latency: 5, cost: 1, timestamp: '2025-10-21T10:00:00Z' },
      { id: 2, service_id: 'b', cpu: 20, memory: 200, latency: 4, cost: 1, timestamp: '2025-10-22T10:00:00Z' },
      { id: 3, service_id: 'c', cpu: 30, memory: 300, latency: 3, cost: 1, timestamp: '2025-10-20T10:00:00Z', created_at: '2025-10-23T09:00:00Z' },
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
          // Ensure SQL has the dual-compat ORDER BY and selects created_at
          expect(sql).toContain('ORDER BY created_at DESC NULLS LAST, "timestamp" DESC NULLS LAST');
          expect(sql).toContain('created_at');
          const sorted = [...mixed].sort(sorter);
          // Emulate LIMIT 1 by returning only top row
          return { rows: [sorted[0]] };
        }),
      },
    };
    const caller = metricsRouter.createCaller({ ...ctx, ee: { emit: vi.fn() }, requestMeta: {} });
    const top = await caller.latest();
    expect(top.id).toBe(3); // row with created_at should win
  });

  test('live wires buffered subscription with correct params', async () => {
    const rt = await import('../src/api/lib/realtime');
    // module import time should have invoked createBufferedSubscription
    expect((rt as any).default).toHaveBeenCalledWith('metrics:new', { bufferSize: 100 });
  });
});
