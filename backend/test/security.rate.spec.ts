import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { TRPCError } from '@trpc/server'

const realEnv = { ...process.env }

describe('tRPC rate limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.assign(process.env, {
      RATE_LIMIT_ENABLE_IN_TEST: 'true',
      RATE_LIMIT_WINDOW_SEC: '10',
      RATE_LIMIT_MAX: '3',
      RATE_LIMIT_BURST: '0',
    })
  })
  afterEach(() => {
    vi.useRealTimers()
    process.env = { ...realEnv }
  })

  test('enforces windowed limits and records hits', async () => {
    const hits: Array<{ key: string; route: string; ts: number }> = []
    const now = () => Date.now()

    const ctx: any = {
      db: {
        query: vi.fn().mockImplementation(async (sql: string, params?: any[]) => {
          if (typeof sql === 'string' && sql.includes('FROM rate_limit_hits') && sql.includes('COUNT')) {
            const key = params?.[0]
            const route = params?.[1]
            const nowMs = params?.[2]
            const windowSec = params?.[3]
            const cutoff = nowMs - windowSec * 1000
            const n = hits.filter(h => h.key === key && h.route === route && h.ts > cutoff).length
            return { rows: [{ n }] }
          }
          if (typeof sql === 'string' && sql.startsWith('INSERT INTO rate_limit_hits')) {
            const key = params?.[0]
            const route = params?.[1]
            const ts = params?.[2]
            hits.push({ key, route, ts })
            return { rows: [] }
          }
          // metrics.latest query fallback
          return { rows: [] }
        }),
      },
      ee: { emit: vi.fn() },
      requestMeta: { ip: '1.2.3.4' },
    }

  const { metricsRouter } = await import('../src/api/routers/metrics')
  const caller = metricsRouter.createCaller(ctx)

    // within window
    await caller.latest()
    await caller.latest()
    await caller.latest()

    await expect(caller.latest()).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
    } satisfies Partial<TRPCError>)

    // advance beyond window and try again
    vi.advanceTimersByTime(11_000)
    await expect(caller.latest()).resolves.not.toThrow

    // ensure hits recorded (3 + 1 after window)
    expect(hits.length).toBe(4)
  })
})
