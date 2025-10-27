import { describe, expect, test, vi } from 'vitest'

// Mock realtime to avoid subscription machinery side effects in tests
vi.mock('../src/api/lib/realtime', () => {
  return {
    __esModule: true,
    default: vi.fn((...args: any[]) => () => ({ /* noop observable factory */ })),
    createBufferedSubscription: vi.fn((...args: any[]) => () => ({ /* noop observable factory */ })),
  } as any
})

import { sargeRouter } from '../src/api/routers/sarge'

describe('sargeRouter', () => {
  test('workspace.status returns deterministic default', async () => {
    const caller = sargeRouter.createCaller({ db: {} as any, ee: { emit: vi.fn(), on: vi.fn(), off: vi.fn() } as any, requestMeta: {} })
    const status = await caller.workspace.status()
    expect(status.id).toBe('default')
    expect(status.dataRoot).toContain('data/sarge/workspaces/default')
    expect(status.telemetry.logs.structuredJson).toBe(true)
  })

  test('stacks.list returns empty by default', async () => {
    const caller = sargeRouter.createCaller({ db: {} as any, ee: { emit: vi.fn(), on: vi.fn(), off: vi.fn() } as any, requestMeta: {} })
    const list = await caller.stacks.list()
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBe(0)
  })

  test('aws.s3.listBuckets returns empty array deterministically', async () => {
    const caller = sargeRouter.createCaller({ db: {} as any, ee: { emit: vi.fn(), on: vi.fn(), off: vi.fn() } as any, requestMeta: {} })
    const buckets = await caller.aws.s3.listBuckets()
    expect(buckets).toEqual([])
  })

  test('legacy routers are re-exported under sarge.legacy.*', async () => {
    const ctx: any = { db: { query: vi.fn().mockResolvedValue({ rows: [] }) }, ee: { emit: vi.fn(), on: vi.fn(), off: vi.fn() }, requestMeta: {} }
    const caller = sargeRouter.createCaller(ctx)
    await caller.legacy.metrics.latest()
    expect(ctx.db.query).toHaveBeenCalled()
  })
})
