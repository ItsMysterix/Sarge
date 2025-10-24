import { describe, expect, test, vi } from 'vitest';

vi.mock('../src/api/lib/realtime', () => {
  return {
    default: vi.fn(() => () => ({ /* observable factory placeholder */ })),
    createBufferedSubscription: vi.fn(() => () => ({ /* observable factory placeholder */ })),
  } as any;
});

import { deployRouter } from '../src/api/routers/deploy';

describe('deployRouter.create', () => {
  test('inserts pending row and enqueues work', async () => {
    const ctx: any = {
      db: { query: vi.fn().mockResolvedValue({ rows: [{ id: 7, branch: 'main', status: 'pending' }] }) },
      ee: { emit: vi.fn() },
      requestMeta: {},
    };
    const caller = deployRouter.createCaller(ctx);
    const res = await caller.create({ branch: 'main' });
    expect(ctx.db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO deployments'),
      expect.arrayContaining(['main', null, 'pending', expect.any(String)])
    );
    expect(ctx.ee.emit).toHaveBeenCalledWith('deploys:enqueue', { id: 7 });
    expect(res.status).toBe('pending');
  });
});
