import { TRPCError } from '@trpc/server'
import { t } from '../../lib/trpc'
import { checkAndConsume, scopeKey, type Scope } from '../../lib/rateLimit'
import { rateDeniedTotal } from '../../../metrics/exporter'

export type RateOverride = Partial<{ windowSec: number; max: number; burst: number; scope: Scope }>

export function secureProcedure(route: string, override?: RateOverride) {
  const rateDefaults = {
    windowSec: Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60),
    max: Number(process.env.RATE_LIMIT_MAX ?? 60),
    burst: Number(process.env.RATE_LIMIT_BURST ?? 20),
    scope: (process.env.RATE_LIMIT_SCOPE as Scope) ?? 'ip',
  }
  const cfg = { ...rateDefaults, ...(override ?? {}) }
  return t.procedure.use(async ({ ctx, next }) => {
    if (process.env.NODE_ENV === 'test' && process.env.RATE_LIMIT_ENABLE_IN_TEST !== 'true') {
      return next()
    }
    const ip = ctx.requestMeta?.ip || ''
    // user id not present in backend Context; future: derive from auth if added
    const key = scopeKey({ scope: cfg.scope!, ip, userId: undefined })
    const res = await checkAndConsume(ctx.db as any, {
      key,
      route,
      now: new Date(),
      windowSec: cfg.windowSec!,
      max: cfg.max!,
      burst: cfg.burst!,
    })
    if (!res.allowed) {
      // minimal audit (console.debug to avoid noise)
      try { console.debug?.(`rate-limit deny route=${route} key=${key}`) } catch {}
      try { rateDeniedTotal.labels({ route }).inc() } catch {}
      throw new TRPCError({ code: 'TOO_MANY_REQUESTS' })
    }
    return next()
  })
}
