import type { Pool } from '@neondatabase/serverless'

let ensured = false

/**
 * Ensure minimal backend tables needed for runtime guards exist.
 * Safe to call on every request; guarded by a simple in-process flag.
 */
export async function ensureRateLimitTables(db: Pool) {
  if (ensured) return
  try {
    await (db as any).query(`
      CREATE TABLE IF NOT EXISTS rate_limit_hits (
        id BIGSERIAL PRIMARY KEY,
        key TEXT NOT NULL,
        route TEXT NOT NULL,
        ts TIMESTAMPTZ NOT NULL
      );
    `)
    await (db as any).query(`CREATE INDEX IF NOT EXISTS idx_rate_hits_key_route_ts ON rate_limit_hits(key, route, ts);`)
    ensured = true
  } catch (e) {
    // Don't throw from ensure; callers will gracefully degrade on errors
    try { console.warn('[schema] ensureRateLimitTables failed:', (e as Error).message) } catch {}
  }
}
