import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

export type EnvScope = { type: 'workspace' } | { type: 'stack'; name: string } | { type: 'service'; name: string }

export interface EnvVarMeta {
  key: string
  secret?: boolean
  oneTime?: boolean
  createdAt: string
  updatedAt: string
  revealedOnce?: boolean
}

export interface EnvVarRecord extends EnvVarMeta {
  value?: string // non-secret only
  // For secrets, store encrypted
  enc?: { iv: string; tag: string; data: string }
}

export interface EnvStateV2 {
  version: 2
  workspace: Record<string, EnvVarRecord>
  stacks: Record<string, Record<string, EnvVarRecord>>
  services: Record<string, Record<string, EnvVarRecord>>
}

export interface AuditEvent {
  ts: number
  actor: 'cli' | 'ui' | 'system'
  action: 'set' | 'get' | 'reveal' | 'delete' | 'migrate'
  scope: EnvScope
  key: string
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function statePath(root: string) { return path.join(root, 'env', 'v2.json') }
function auditPath(root: string) { return path.join(root, 'env', 'audit.jsonl') }
function keyPath(root: string) { return path.join(root, 'security', 'env.key') }

function newState(): EnvStateV2 {
  return { version: 2, workspace: {}, stacks: {}, services: {} }
}

function writeAudit(root: string, e: AuditEvent) {
  try {
    ensureDir(path.join(root, 'env'))
    fs.appendFileSync(auditPath(root), JSON.stringify(e) + '\n')
  } catch {}
}

function loadOrCreateKey(root: string): Buffer {
  const kf = keyPath(root)
  ensureDir(path.dirname(kf))
  if (fs.existsSync(kf)) return fs.readFileSync(kf)
  const key = crypto.randomBytes(32)
  fs.writeFileSync(kf, key, { mode: 0o600 })
  return key
}

function encrypt(root: string, plaintext: string): { iv: string; tag: string; data: string } {
  const key = loadOrCreateKey(root)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return { iv: iv.toString('base64'), tag: tag.toString('base64'), data: enc.toString('base64') }
}

function decrypt(root: string, enc: { iv: string; tag: string; data: string }): string {
  const key = loadOrCreateKey(root)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(enc.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(enc.tag, 'base64'))
  const dec = Buffer.concat([decipher.update(Buffer.from(enc.data, 'base64')), decipher.final()])
  return dec.toString('utf8')
}

export class EnvManager {
  constructor(private dataRoot: string) {}

  private read(): EnvStateV2 {
    const f = statePath(this.dataRoot)
    if (!fs.existsSync(f)) return newState()
    try { return JSON.parse(fs.readFileSync(f, 'utf8')) as EnvStateV2 } catch { return newState() }
  }
  private write(st: EnvStateV2) {
    ensureDir(path.join(this.dataRoot, 'env'))
    fs.writeFileSync(statePath(this.dataRoot), JSON.stringify(st, null, 2))
  }

  private ref(st: EnvStateV2, scope: EnvScope): Record<string, EnvVarRecord> {
    if (scope.type === 'workspace') return st.workspace
    if (scope.type === 'stack') return (st.stacks[scope.name] ||= {})
    return (st.services[scope.name] ||= {})
  }

  set(scope: EnvScope, key: string, value: string, opts: { secret?: boolean; oneTime?: boolean; actor?: AuditEvent['actor'] } = {}) {
    const st = this.read()
    const bucket = this.ref(st, scope)
    const now = new Date().toISOString()
    const rec: EnvVarRecord = {
      key,
      secret: opts.secret || false,
      oneTime: opts.oneTime || false,
      createdAt: bucket[key]?.createdAt || now,
      updatedAt: now,
    }
    if (rec.secret) rec.enc = encrypt(this.dataRoot, value)
    else rec.value = value
    bucket[key] = rec
    this.write(st)
    writeAudit(this.dataRoot, { ts: Date.now(), actor: opts.actor || 'system', action: 'set', scope, key })
  }

  get(scope: EnvScope, key: string, opts: { actor?: AuditEvent['actor'] } = {}): { meta: EnvVarMeta; value?: string } | null {
    const st = this.read()
    const rec = this.ref(st, scope)[key]
    if (!rec) return null
    writeAudit(this.dataRoot, { ts: Date.now(), actor: opts.actor || 'system', action: 'get', scope, key })
    const { enc, value, ...meta } = rec
    return { meta, value: rec.secret ? undefined : value }
  }

  reveal(scope: EnvScope, key: string, opts: { actor?: AuditEvent['actor'] } = {}): string | null {
    const st = this.read()
    const bucket = this.ref(st, scope)
    const rec = bucket[key]
    if (!rec) return null
    if (!rec.secret || !rec.enc) return rec.value || ''
    if (rec.oneTime && rec.revealedOnce) {
      writeAudit(this.dataRoot, { ts: Date.now(), actor: opts.actor || 'system', action: 'reveal', scope, key })
      return null
    }
    const plain = decrypt(this.dataRoot, rec.enc)
    rec.revealedOnce = rec.oneTime ? true : rec.revealedOnce
    this.write(st)
    writeAudit(this.dataRoot, { ts: Date.now(), actor: opts.actor || 'system', action: 'reveal', scope, key })
    return plain
  }

  delete(scope: EnvScope, key: string, opts: { actor?: AuditEvent['actor'] } = {}) {
    const st = this.read()
    const bucket = this.ref(st, scope)
    if (bucket[key]) delete bucket[key]
    this.write(st)
    writeAudit(this.dataRoot, { ts: Date.now(), actor: opts.actor || 'system', action: 'delete', scope, key })
  }

  list(scope: EnvScope, opts: { actor?: AuditEvent['actor'] } = {}): EnvVarMeta[] {
    const st = this.read()
    const bucket = this.ref(st, scope)
    writeAudit(this.dataRoot, { ts: Date.now(), actor: opts.actor || 'system', action: 'get', scope, key: '*' })
    return Object.values(bucket).map(({ enc: _e, value: _v, ...meta }) => meta)
  }

  buildEnv(scope: EnvScope): Record<string, string> {
    // Build merged env: workspace -> stack -> service
    const st = this.read()
    const out: Record<string, string> = {}
    const merge = (vars?: Record<string, EnvVarRecord>) => {
      if (!vars) return
      for (const [k, v] of Object.entries(vars)) {
        if (v.secret && v.enc) out[k] = decrypt(this.dataRoot, v.enc)
        else if (v.value != null) out[k] = v.value
      }
    }
    merge(st.workspace)
    if (scope.type === 'stack') merge(st.stacks[scope.name])
    if (scope.type === 'service') {
      // inherit workspace, then specific service
      merge(st.services[scope.name])
    }
    // audit as system build
    writeAudit(this.dataRoot, { ts: Date.now(), actor: 'system', action: 'get', scope, key: '*' })
    return out
  }
}

export function migrateFromV1(dataRoot: string): { migrated: number } {
  // Best-effort migration from hypothetical v1 formats: env.json or .env
  const st = newState()
  let count = 0
  const legacyJson = path.join(dataRoot, 'env.json')
  if (fs.existsSync(legacyJson)) {
    try {
      const obj = JSON.parse(fs.readFileSync(legacyJson, 'utf8')) as Record<string, string>
      for (const [k, v] of Object.entries(obj)) {
        st.workspace[k] = { key: k, value: v, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        count++
      }
    } catch {}
  }
  const dotEnv = path.join(dataRoot, '.env')
  if (fs.existsSync(dotEnv)) {
    const lines = fs.readFileSync(dotEnv, 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (!m) continue
      const k = m[1]
      const v = m[2]
      st.workspace[k] = { key: k, value: v, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      count++
    }
  }
  if (count > 0) {
    ensureDir(path.join(dataRoot, 'env'))
    fs.writeFileSync(statePath(dataRoot), JSON.stringify(st, null, 2))
    writeAudit(dataRoot, { ts: Date.now(), actor: 'system', action: 'migrate', scope: { type: 'workspace' }, key: '*' })
  }
  return { migrated: count }
}

export function getSecretKeys(dataRoot: string): string[] {
  const f = statePath(dataRoot)
  if (!fs.existsSync(f)) return []
  try {
    const st = JSON.parse(fs.readFileSync(f, 'utf8')) as EnvStateV2
    const keys: string[] = []
    const collect = (vars?: Record<string, EnvVarRecord>) => {
      if (!vars) return
      for (const [k, v] of Object.entries(vars)) if (v.secret) keys.push(k)
    }
    collect(st.workspace)
    for (const v of Object.values(st.stacks)) collect(v)
    for (const v of Object.values(st.services)) collect(v)
    return Array.from(new Set(keys)).sort()
  } catch { return [] }
}
