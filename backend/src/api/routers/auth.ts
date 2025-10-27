import { router } from '../../trpc'
import { secureProcedure, type Role } from '../trpc/middlewares/security'
import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

function getDataRoot() {
  const base = process.env.SARGE_DATA_DIR ? path.resolve(process.cwd(), process.env.SARGE_DATA_DIR) : path.resolve(process.cwd(), 'data/sarge/workspaces/default')
  return base
}

type StoredToken = { id: string; role: Role; salt: string; hash: string; createdAt: string; revokedAt?: string }

function tokensFile() {
  const dir = path.join(getDataRoot(), 'security')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
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

const CreateInput = z.object({ role: z.enum(['admin','operator','viewer'] as const), token: z.string().min(8).optional() })
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
})

export type AuthRouter = typeof authRouter
