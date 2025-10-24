import { describe, expect, test, vi } from 'vitest';

vi.mock('../src/api/lib/realtime', () => {
  return {
    default: vi.fn(() => () => ({ subscribe: () => ({ unsubscribe: () => {} }) })),
    createBufferedSubscription: vi.fn(() => () => ({ subscribe: () => ({ unsubscribe: () => {} }) })),
  } as any;
});

import { deployRouter } from '../src/api/routers/deploy';

describe('deployRouter', () => {
  test('create inserts pending and enqueues work', async () => {
    const ctx: any = {
      db: { query: vi.fn().mockResolvedValue({ rows: [{ id: '1', branch: 'main' }] }) },
      ee: { emit: vi.fn() },
      requestMeta: {},
    };
    const caller = deployRouter.createCaller(ctx);
    await caller.create({ branch: 'main' });
    expect(ctx.db.query).toHaveBeenCalled();
    expect(ctx.ee.emit).toHaveBeenCalledWith('deploys:enqueue', { id: '1' });
  });

  test('subscribe procedure is defined (topics/predicate configured at call time)', async () => {
    expect((deployRouter as any)._def).toBeDefined();
    expect(typeof (deployRouter as any).subscribe).toBe('function');
  });
});
