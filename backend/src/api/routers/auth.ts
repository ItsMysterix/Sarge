import { router } from '../../trpc'
import { secureProcedure, type Role } from '../trpc/middlewares/security'
import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { authLogger } from '../../lib/logger'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcryptjs'
import { getProviderCredentials } from '../lib/credentials'

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
    authLogger.warn({ e, dir }, '[auth] Cannot create tokens directory (read-only filesystem)')
  }
  return path.join(dir, 'tokens.json')
}

function readTokens(): StoredToken[] {
  const f = tokensFile()
  if (!fs.existsSync(f)) return []
  try { return JSON.parse(fs.readFileSync(f, 'utf8')) as StoredToken[] } catch { return [] }
}

function writeTokens(items: StoredToken[]) {
  fs.writeFileSync(tokensFile(), JSON.stringify(items, null, 2))
}

const CreateInput = z.object({ role: z.enum(['admin', 'operator', 'viewer'] as const), token: z.string().min(8).optional() })
const RotateInput = z.object({ id: z.string().min(8), newToken: z.string().min(8).optional() })
const RevokeInput = z.object({ id: z.string().min(8) })

export const authRouter = router({
  create: secureProcedure('auth.token.create', { requiresRole: 'admin' }).input(CreateInput).mutation(async ({ input }) => {
    const items = readTokens()
    const id = 'tok_' + crypto.randomUUID().slice(0, 8)
    const token = input.token ?? crypto.randomUUID().replace(/-/g, '')
    const salt = crypto.randomBytes(16)
    const hash = crypto.scryptSync(token, salt, 32)
    items.push({ id, role: input.role, salt: salt.toString('hex'), hash: hash.toString('hex'), createdAt: new Date().toISOString() })
    writeTokens(items)
    return { id, role: input.role, createdAt: new Date().toISOString() }
  }),
  rotate: secureProcedure('auth.token.rotate', { requiresRole: 'admin' }).input(RotateInput).mutation(async ({ input }) => {
    const items = readTokens()
    const idx = items.findIndex((t) => t.id === input.id && !t.revokedAt)
    if (idx === -1) return { ok: false as const, reason: 'not_found' as const }
    const newToken = input.newToken ?? crypto.randomUUID().replace(/-/g, '')
    const salt = crypto.randomBytes(16)
    const hash = crypto.scryptSync(newToken, salt, 32)
    items[idx] = { ...items[idx], salt: salt.toString('hex'), hash: hash.toString('hex'), createdAt: new Date().toISOString() }
    writeTokens(items)
    return { ok: true as const }
  }),
  revoke: secureProcedure('auth.token.revoke', { requiresRole: 'admin' }).input(RevokeInput).mutation(async ({ input }) => {
    const items = readTokens()
    const idx = items.findIndex((t) => t.id === input.id && !t.revokedAt)
    if (idx === -1) return { ok: false as const, reason: 'not_found' as const }
    items[idx] = { ...items[idx], revokedAt: new Date().toISOString() }
    writeTokens(items)
    return { ok: true as const }
  }),

  // Get linked accounts (NextAuth providers)
  getLinkedAccounts: secureProcedure('auth.getLinkedAccounts')
    .query(async ({ ctx }) => {
      const userId = ctx.session?.user?.id
      if (!userId) return []

      try {
        const result = await ctx.db.query(
          `SELECT provider FROM accounts WHERE user_id = $1`,
          [userId]
        )
        return result.rows.map((row: any) => row.provider)
      } catch (err) {
        authLogger.error({ err, userId }, '[auth.getLinkedAccounts] Failed to fetch linked accounts')
        return []
      }
    }),

  // Get user profile
  getProfile: secureProcedure('auth.getProfile')
    .query(async ({ ctx }) => {
      try {
        const user = await ctx.db.query(
          `SELECT id, name, email, image FROM users WHERE id = $1`,
          [ctx.session!.user!.id]
        )
        return user?.rows?.[0] || null
      } catch (err) {
        authLogger.error({ err, userId: ctx.session?.user?.id }, '[auth.getProfile] Error')
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch profile' })
      }
    }),

  getGithubConnection: secureProcedure('auth.getGithubConnection')
    .query(async ({ ctx }) => {
      try {
        // 1. Check if connected via OAuth (accessToken exists in session)
        if ((ctx.session as any)?.accessToken) {
          return { connected: true, source: 'oauth' }
        }

        // 2. Check for linked provider credentials
        const credentials = await getProviderCredentials('github', ctx.db, ctx.session?.user?.id)
        if (credentials?.github_token || (credentials as any)?.access_token) {
          return { connected: true, source: 'linked' }
        }

        return { connected: false }
      } catch (err) {
        authLogger.error({ err, userId: ctx.session?.user?.id }, '[auth.getGithubConnection] Error')
        return { connected: false }
      }
    }),

  // Update user profile
  updateProfile: secureProcedure('auth.updateProfile')
    .input(z.object({
      name: z.string().min(1).max(255).optional(),
      image: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' })

      try {
        const setClauses: string[] = []
        const params: any[] = []
        if (input.name !== undefined) {
          params.push(input.name)
          setClauses.push(`name = $${params.length}`)
        }
        if (input.image !== undefined) {
          params.push(input.image)
          setClauses.push(`image = $${params.length}`)
        }

        if (setClauses.length === 0) return { success: true }

        setClauses.push(`updated_at = NOW()`)
        params.push(userId)

        await ctx.db.query(
          `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${params.length}`,
          params
        )

        return { success: true }
      } catch (err) {
        authLogger.error({ err, userId, input }, '[auth.updateProfile] Failed to update profile')
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update profile' })
      }
    }),

  // Change password
  changePassword: secureProcedure('auth.changePassword')
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' })

      try {
        // Get current password hash
        const result = await ctx.db.query(
          `SELECT password_hash FROM user_credentials WHERE user_id = $1`,
          [userId]
        )

        if (result.rows.length === 0 || !result.rows[0].password_hash) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This account uses OAuth authentication and cannot change password',
          })
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(
          input.currentPassword,
          result.rows[0].password_hash
        )

        if (!isValidPassword) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect',
          })
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(input.newPassword, 10)

        // Update password
        await ctx.db.query(
          `UPDATE user_credentials 
           SET password_hash = $1, updated_at = NOW()
           WHERE user_id = $2`,
          [newPasswordHash, userId]
        )

        return { success: true }
      } catch (err) {
        if (err instanceof TRPCError) throw err
        authLogger.error({ err, userId }, '[auth.changePassword] Failed to change password')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change password',
        })
      }
    }),
})

export type AuthRouter = typeof authRouter
