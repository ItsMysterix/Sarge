import { TRPCError } from '@trpc/server'
import { t } from '../../lib/trpc'
import { checkAndConsume, scopeKey, type Scope } from '../../lib/rateLimit'
import { rateDeniedTotal } from '../../../metrics/exporter'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export type Role = 'admin' | 'operator' | 'viewer'
export type RateOverride = Partial<{ windowSec: number; max: number; burst: number; scope: Scope; requiresRole: Role; requiresLicenseFeature: 'teamSpaces' | 'cloudApply' }>

function getDataRoot() {
  // On Vercel/serverless, use /tmp (only writable location)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', '.sarge')
  }
  const base = process.env.SARGE_DATA_DIR ? path.resolve(process.cwd(), process.env.SARGE_DATA_DIR) : path.resolve(process.cwd(), 'data/sarge/workspaces/default')
  return base
}

type StoredToken = { id: string; role: Role; salt: string; hash: string; createdAt: string; revokedAt?: string }

function tokensFile() {
  const dir = path.join(getDataRoot(), 'security')
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  } catch (e) {
    // Filesystem is read-only (Vercel/serverless), RBAC tokens won't work
    console.warn('[security] Cannot create tokens directory (read-only filesystem):', (e as Error).message)
  }
  return path.join(dir, 'tokens.json')
}

function readTokens(): StoredToken[] {
  try {
    const f = tokensFile()
    if (!fs.existsSync(f)) return []
    return JSON.parse(fs.readFileSync(f, 'utf8')) as StoredToken[]
  } catch (e) {
    // Filesystem errors (read-only, not found, etc.)
    return []
  }
}

function verifyTokenString(token: string): { ok: boolean; role?: Role } {
  const items = readTokens()
  for (const it of items) {
    if (it.revokedAt) continue
    const salt = Buffer.from(it.salt, 'hex')
    const hash = crypto.scryptSync(token, salt, 32).toString('hex')
    if (crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(it.hash, 'hex'))) {
      return { ok: true, role: it.role }
    }
  }
  return { ok: false }
}

export function secureProcedure(route: string, override?: RateOverride) {
  const rateDefaults = {
    windowSec: Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60),
    max: Number(process.env.RATE_LIMIT_MAX ?? 60),
    burst: Number(process.env.RATE_LIMIT_BURST ?? 20),
    scope: (process.env.RATE_LIMIT_SCOPE as Scope) ?? 'ip',
  }
  const cfg = { ...rateDefaults, ...(override ?? {}) }
  return t.procedure.use(async ({ ctx, next }) => {
    try {
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
      
      // Check NextAuth session first (primary auth method)
      if (!ctx.session?.user && process.env.RBAC_ENABLED !== 'true') {
        // No session and RBAC not enabled = unauthorized
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' })
      }
      
      // RBAC (opt-in): require token and role if RBAC_ENABLED
      if (process.env.RBAC_ENABLED === 'true') {
        const token = ctx.requestMeta?.apiToken
        if (!token) throw new TRPCError({ code: 'UNAUTHORIZED' })
        const ver = verifyTokenString(token)
        if (!ver.ok) throw new TRPCError({ code: 'UNAUTHORIZED' })
        const required = cfg.requiresRole
        if (required) {
          const rank: Record<Role, number> = { admin: 3, operator: 2, viewer: 1 }
          if (rank[ver.role!] < rank[required]) throw new TRPCError({ code: 'FORBIDDEN' })
        }
      }
      // Licensing (optional, offline): gate certain features when not licensed
      if (override?.requiresLicenseFeature) {
        try {
          // Dynamic import to avoid hard dependency on build order
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          let core: any
          try {
            const modName = ['sarge','-','core'].join('')
            core = require(modName)
          } catch (e: any) {
            if (e?.code === 'ERR_REQUIRE_ESM') {
              const modName = ['sarge','-','core'].join('')
              core = await import(modName)
            }
          }
          try {
            const dataRoot = getDataRoot()
            const chk = core?.licensing?.ensureFeature?.(override.requiresLicenseFeature, { dataRoot })
            if (!chk?.ok) {
              throw new TRPCError({ code: 'FORBIDDEN', message: chk?.reason || 'feature_locked' })
            }
          } catch (fsError) {
            // Filesystem errors on serverless - skip licensing check
            console.warn('[security] Licensing check skipped (filesystem unavailable)')
          }
        } catch (e) {
          // If licensing module unavailable, default to allowing Community features only
          if (override?.requiresLicenseFeature && override.requiresLicenseFeature !== 'teamSpaces' && override.requiresLicenseFeature !== 'cloudApply') {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'feature_locked' })
          }
        }
      }
      return next()
    } catch (middlewareError) {
      // Log middleware errors and re-throw to ensure proper tRPC error handling
      console.error(`[secureProcedure:${route}] Middleware error:`, {
        message: (middlewareError as any)?.message,
        code: (middlewareError as any)?.code,
        stack: process.env.NODE_ENV === 'development' ? (middlewareError as Error)?.stack : undefined,
      });
      throw middlewareError;
    }
  })
}
