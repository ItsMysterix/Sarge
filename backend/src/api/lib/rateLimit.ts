import type { Pool } from 'pg'
import { ensureRateLimitTables } from './schema'

export type Scope = 'ip' | 'user' | 'ip_user'

export function scopeKey(opts: { scope: Scope; ip?: string; userId?: string }): string {
  const ip = (opts.ip || '').trim()
  const user = (opts.userId || '').trim()
  switch (opts.scope) {
    case 'ip': return ip || 'unknown'
    case 'user': return user ? `user:${user}` : 'user:anonymous'
    case 'ip_user': return `${ip || 'unknown'}|user:${user || 'anonymous'}`
  }
}

type CheckParams = {
  key: string
  route: string
  now: Date
  windowSec: number
  max: number
  burst: number
}

type CheckResult = { allowed: boolean; remaining: number; resetAt: string }

// Simple in-memory assist to reduce DB traffic under sustained load.
// DB remains the source of truth: we still count+insert for authoritative state.
const memBuckets = new Map<string, { tokens: number; resetAt: number }>()

export async function checkAndConsume(db: Pool, p: CheckParams): Promise<CheckResult> {
  const windowMs = p.windowSec * 1000
  const nowMs = p.now.getTime()
  const memKey = `${p.key}::${p.route}`
  const entry = memBuckets.get(memKey)
  if (!entry || nowMs >= entry.resetAt) {
    memBuckets.set(memKey, { tokens: p.max + p.burst - 1, resetAt: nowMs + windowMs })
  } else if (entry.tokens > 0) {
    entry.tokens -= 1
  }

  // Authoritative DB count within window
  try {
    await ensureRateLimitTables(db as any)
    const { rows } = await (db as any).query(
      `SELECT COUNT(*)::int AS n FROM rate_limit_hits WHERE key=$1 AND route=$2 AND ts > (to_timestamp($3/1000.0) - make_interval(secs => $4))`,
      [p.key, p.route, nowMs, p.windowSec]
    )
    const count: number = rows?.[0]?.n ?? 0
    const limit = p.max + p.burst
    const allowed = count < limit
    if (allowed) {
      await (db as any).query(`INSERT INTO rate_limit_hits (key, route, ts) VALUES ($1, $2, to_timestamp($3/1000.0))`, [p.key, p.route, nowMs])
    }
    const remaining = Math.max(0, limit - (count + (allowed ? 1 : 0)))
    const resetAt = new Date(nowMs + windowMs).toISOString()
    return { allowed, remaining, resetAt }
  } catch (e) {
    // Graceful degradation when DB/table is unavailable: rely on in-memory bucket
    try { console.warn('[rateLimit] falling back to in-memory only:', (e as Error).message) } catch {}
    const limit = p.max + p.burst
    // Estimate remaining from memory bucket when available
    const mem = memBuckets.get(memKey)
    const consumed = mem ? (p.max + p.burst - mem.tokens - 1) : 0
    const remaining = Math.max(0, limit - consumed)
    const resetAt = new Date(nowMs + windowMs).toISOString()
    return { allowed: true, remaining, resetAt }
  }
}

export function buildScopeKeyFromContext(opts: { scope: Scope; ip?: string; userId?: string }) {
  return scopeKey(opts)
}
