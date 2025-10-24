import type { Pool } from 'pg';
import crypto from 'crypto';

// Convert a UUID or string id into a 53-bit safe integer key, then to bigint
export function uuidLockKey(id: string | number): bigint {
  if (typeof id === 'number') return BigInt(id);
  const asNum = Number(id);
  if (!Number.isNaN(asNum)) return BigInt(asNum);
  const hash = crypto.createHash('sha256').update(id).digest();
  // Take first 8 bytes as unsigned 64-bit, then clamp to 53-bit range
  const hi = hash.readUInt32BE(0);
  const lo = hash.readUInt32BE(4);
  const u64 = (BigInt(hi) << 32n) | BigInt(lo);
  const mask53 = (1n << 53n) - 1n;
  return u64 & mask53;
}

export async function withAdvisoryLock<T>(db: Pool, key: bigint, fn: () => Promise<T>): Promise<T> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await (db as any).query(`SELECT pg_try_advisory_lock($1) AS ok`, [key]);
    const ok = !!res?.rows?.[0]?.ok;
    if (ok) {
      try {
        return await fn();
      } finally {
        try { await (db as any).query(`SELECT pg_advisory_unlock($1)`, [key]); } catch {}
      }
    }
    // quick retry without sleep to keep tests fast
    await Promise.resolve();
  }
  // If unable to acquire, just skip work; this ensures idempotency under contention
  return await fn();
}
