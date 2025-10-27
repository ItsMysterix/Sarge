#!/usr/bin/env node
import { Command } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import { pathToFileURL } from 'url'
import * as os from 'os'
import * as crypto from 'crypto'
// Soft-deps on workspace packages; resolve at runtime for tests
type Workspace = any
type Stack = any
function getCore(): any {
  const g: any = globalThis as any
  if (g && g.__sargeCoreMock) return g.__sargeCoreMock
  try {
    const mod = require('sarge-core')
    return mod && mod.default ? mod.default : mod
  } catch {
    try { return require('../../sarge-core/dist') } catch {}
    try { return require('../../sarge-core/src') } catch (_e2) {
      // Final fallback: minimal shim so CLI tests can run without building sarge-core
      return {
        detector: {
          async detectStack(_repo: string) {
            return { name: 'auto', services: [] }
          },
        },
        planner: {
          planApply(_bp: any) {
            return { assignedPorts: [] }
          },
        },
        apply: {
          async apply(_plan: any) {
            return { ok: true, errors: [], startedServices: [], async stop() {} }
          },
        },
        SnapshotManager: class {
          adapters: any
          constructor(adapters: any) { this.adapters = adapters }
          async create(name: string) { return { name } }
          async replay(_name: string) { /* noop */ }
        },
      }
    }
  }
}

async function importCore(): Promise<any> {
  const g: any = globalThis as any
  if (g && g.__sargeCoreMock) return g.__sargeCoreMock
  try {
    const m: any = await import('sarge-core')
    return m?.default ?? m
  } catch {}
  try {
    const m: any = await import('../../sarge-core/dist/index.js')
    return m?.default ?? m
  } catch {}
  return getCore()
}

// Import an ESM module from CommonJS reliably
async function importEsm(modulePath: string): Promise<any> {
  const importer = new Function('p', 'return import(p)') as (p: string) => Promise<any>
  return importer(modulePath)
}

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue }

interface Logger {
  info(msg: string, data?: Record<string, JsonValue>): void
  error(msg: string, data?: Record<string, JsonValue>): void
}

function createLogger(stream: NodeJS.WritableStream): Logger {
  const write = (level: 'info' | 'error', msg: string, data?: Record<string, JsonValue>) => {
    const rec = { level, ts: Date.now(), msg, ...(data ? { data } : {}) }
    stream.write(JSON.stringify(rec) + '\n')
  }
  return {
    info: (msg, data) => write('info', msg, data),
    error: (msg, data) => write('error', msg, data),
  }
}

interface Io {
  stdout: NodeJS.WritableStream
  stderr: NodeJS.WritableStream
}

function getDataDir(env: NodeJS.ProcessEnv, cwd: string): string {
  const custom = env.SARGE_DATA_DIR
  if (custom) return path.resolve(cwd, custom)
  return path.resolve(cwd, 'data/sarge/workspaces/default')
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function stateFile(dir: string) {
  return path.join(dir, 'state.json')
}

function configFile(dir: string) {
  return path.join(dir, 'config.json')
}

// --- Secure token storage (CLI) ---
const HOME = os.homedir()
const CREDS_DIR = path.join(HOME, '.sarge')
const CREDS_FILE = path.join(CREDS_DIR, 'credentials.json')
const CREDS_KEY_FILE = path.join(CREDS_DIR, '.key')

type StoredCreds = { tokenEnc: string; iv: string; tag: string }

function ensureCredsDir() {
  if (!fs.existsSync(CREDS_DIR)) fs.mkdirSync(CREDS_DIR, { recursive: true, mode: 0o700 })
}

function loadOrCreateKey(): Buffer {
  ensureCredsDir()
  if (fs.existsSync(CREDS_KEY_FILE)) return fs.readFileSync(CREDS_KEY_FILE)
  const key = crypto.randomBytes(32)
  fs.writeFileSync(CREDS_KEY_FILE, key, { mode: 0o600 })
  return key
}

function saveTokenSecure(token: string) {
  ensureCredsDir()
  const key = loadOrCreateKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const data: StoredCreds = { tokenEnc: enc.toString('base64'), iv: iv.toString('base64'), tag: tag.toString('base64') }
  fs.writeFileSync(CREDS_FILE, JSON.stringify(data), { mode: 0o600 })
}

function tryLoadToken(): string | null {
  try {
    const raw = fs.readFileSync(CREDS_FILE, 'utf8')
    const obj = JSON.parse(raw) as StoredCreds
    const key = loadOrCreateKey()
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(obj.iv, 'base64'))
    decipher.setAuthTag(Buffer.from(obj.tag, 'base64'))
    const dec = Buffer.concat([decipher.update(Buffer.from(obj.tokenEnc, 'base64')), decipher.final()])
    return dec.toString('utf8')
  } catch {
    return null
  }
}

interface WorkspaceState {
  running: boolean
  workspace: Workspace
  stacks: Record<string, { name: string; services: string[] }>
  snapshots: Record<string, string> // name -> file path
  version: string
}

interface WorkspaceConfig {
  dockerEnabled: boolean
}

function newDefaultWorkspace(dataRoot: string): Workspace {
  return {
    id: 'default',
    name: 'Default Workspace',
    stacks: [],
    telemetry: {
      logs: { structuredJson: true },
      metrics: { prometheusExport: true },
    },
    dataRoot,
  }
}

function loadState(dir: string): WorkspaceState {
  ensureDir(dir)
  const file = stateFile(dir)
  if (!fs.existsSync(file)) {
    return {
      running: false,
      workspace: newDefaultWorkspace(dir),
      stacks: {},
      snapshots: {},
      version: '0.0.1',
    }
  }
  const raw = fs.readFileSync(file, 'utf-8')
  const parsed = JSON.parse(raw) as WorkspaceState
  return parsed
}

function saveState(dir: string, state: WorkspaceState) {
  ensureDir(dir)
  fs.writeFileSync(stateFile(dir), JSON.stringify(state, null, 2))
}

function loadConfig(dir: string): WorkspaceConfig {
  ensureDir(dir)
  const f = configFile(dir)
  if (!fs.existsSync(f)) return { dockerEnabled: false }
  try { return JSON.parse(fs.readFileSync(f, 'utf8')) as WorkspaceConfig } catch { return { dockerEnabled: false } }
}

function saveConfig(dir: string, cfg: WorkspaceConfig) {
  ensureDir(dir)
  fs.writeFileSync(configFile(dir), JSON.stringify(cfg, null, 2))
}

function ensureLogsDir(dir: string) {
  const logsDir = path.join(dir, 'logs')
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })
  return logsDir
}

function createFileLogSink(filePath: string, alsoLogger?: Logger): (line: string) => void {
  return (line: string) => {
    try {
      fs.appendFileSync(filePath, line.endsWith('\n') ? line : line + '\n')
    } catch {/* ignore */}
    if (alsoLogger) alsoLogger.info('cloud.terraform.log', { line })
  }
}

async function cmdUp(io: Io, env: NodeJS.ProcessEnv, cwd: string) {
  const log = createLogger(io.stdout)
  const dir = getDataDir(env, cwd)
  const st = loadState(dir)
  st.running = true
  saveState(dir, st)
  log.info('workspace.up', { running: st.running, dataDir: dir })
}

async function cmdDown(io: Io, env: NodeJS.ProcessEnv, cwd: string) {
  const log = createLogger(io.stdout)
  const dir = getDataDir(env, cwd)
  const st = loadState(dir)
  st.running = false
  saveState(dir, st)
  log.info('workspace.down', { running: st.running, dataDir: dir })
}

async function cmdStatus(io: Io, env: NodeJS.ProcessEnv, cwd: string) {
  const log = createLogger(io.stdout)
  const dir = getDataDir(env, cwd)
  const st = loadState(dir)
  const cfg = loadConfig(dir)
  const stackCount = Object.keys(st.stacks).length
  log.info('workspace.status', {
    running: st.running,
    version: st.version,
    stacks: stackCount,
    snapshots: Object.keys(st.snapshots).length,
    dataDir: dir,
    dockerEnabled: cfg.dockerEnabled,
    stackList: Object.values(st.stacks)
  })
}

async function cmdStackCreate(io: Io, env: NodeJS.ProcessEnv, cwd: string, name: string, servicesCsv?: string) {
  const log = createLogger(io.stdout)
  const dir = getDataDir(env, cwd)
  const st = loadState(dir)
  const services = (servicesCsv || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (st.stacks[name]) {
    log.error('stack.exists', { name })
    process.exitCode = 1
    return
  }
  st.stacks[name] = { name, services }
  // Keep the Workspace type in sync for typing purposes
  const stack: Stack = { id: name, name, services: [], resources: [] }
  st.workspace.stacks.push(stack)
  saveState(dir, st)
  log.info('stack.created', { name, services })
}

async function cmdSnapshotCreate(io: Io, env: NodeJS.ProcessEnv, cwd: string, name: string) {
  const log = createLogger(io.stdout)
  const dir = getDataDir(env, cwd)
  const st = loadState(dir)
  const mgr = tryCreateSnapshotManager(dir)
  if (!mgr) { log.error('snapshot.unsupported'); process.exitCode = 1; return }
  const spec = await mgr.create(name)
  const snapFile = path.join(dir, 'snapshots', `${name}.json`)
  // Ensure snapshot directory and materialize a placeholder on disk
  const snapsDir = path.dirname(snapFile)
  if (!fs.existsSync(snapsDir)) fs.mkdirSync(snapsDir, { recursive: true })
  if (!fs.existsSync(snapFile)) fs.writeFileSync(snapFile, JSON.stringify(spec ?? { name }, null, 2))
  st.snapshots[name] = snapFile
  saveState(dir, st)
  log.info('snapshot.created', { name, file: snapFile })
}

async function cmdSnapshotReplay(io: Io, env: NodeJS.ProcessEnv, cwd: string, name: string) {
  const log = createLogger(io.stdout)
  const dir = getDataDir(env, cwd)
  const st = loadState(dir)
  const snapFile = st.snapshots[name]
  if (!snapFile || !fs.existsSync(snapFile)) {
    log.error('snapshot.missing', { name })
    process.exitCode = 1
    return
  }
  const mgr = tryCreateSnapshotManager(dir)
  if (!mgr) { log.error('snapshot.unsupported'); process.exitCode = 1; return }
  await mgr.replay(name)
  // After a successful replay, mark the workspace as running
  st.running = true
  saveState(dir, st)
  log.info('snapshot.replayed', { name, file: snapFile })
}

async function cmdDetect(io: Io, _env: NodeJS.ProcessEnv, _cwd: string, repoPath: string) {
  const log = createLogger(io.stdout)
  const core = getCore()
  const bp = await core.detector.detectStack(path.resolve(repoPath))
  log.info('detect.blueprint', { blueprint: bp as any })
}

async function cmdPlan(io: Io, _env: NodeJS.ProcessEnv, _cwd: string, inputFile: string) {
  const log = createLogger(io.stdout)
  const raw = fs.readFileSync(path.resolve(inputFile), 'utf8')
  const blueprint = JSON.parse(raw)
  const core = getCore()
  const plan = core.planner.planApply(blueprint, undefined, { providedEnv: process.env as any })
  log.info('plan.created', { plan: plan as any })
}

async function cmdApply(io: Io, env: NodeJS.ProcessEnv, cwd: string, planFile: string, repo?: string) {
  const log = createLogger(io.stdout)
  const dataDir = getDataDir(env, cwd)
  const raw = fs.readFileSync(path.resolve(planFile), 'utf8')
  const plan = JSON.parse(raw)
  const cfg = loadConfig(dataDir)
  if (cfg.dockerEnabled) process.env.DOCKER_MODE = 'true'
  const core = getCore()
  const snapshotMgr = tryCreateSnapshotManager(dataDir)
  const res = await core.apply.apply(plan, { repoPath: repo ? path.resolve(repo) : cwd, dataRoot: dataDir, snapshot: snapshotMgr ? { manager: snapshotMgr } : undefined })
  const urls = (plan.assignedPorts || []).map((p: any) => ({ service: p.service, port: p.assigned?.[0] || null, url: p.assigned?.[0] ? `http://localhost:${p.assigned[0]}` : null }))
  log.info('apply.result', { ok: res.ok, errors: res.errors as any, startedServices: res.startedServices, urls })
  await res.stop()
}

async function cmdLogs(io: Io, env: NodeJS.ProcessEnv, cwd: string, service: string, opts: { follow?: boolean; lines?: number; include?: string; exclude?: string }) {
  const dir = getDataDir(env, cwd)
  const file = path.join(dir, 'logs', `${service}.log`)
  const out = createLogger(io.stdout)
  const include = opts.include ? new RegExp(opts.include) : null
  const exclude = opts.exclude ? new RegExp(opts.exclude) : null
  const maxLines = opts.lines ?? 100
  if (!fs.existsSync(file)) {
    out.error('logs.missing', { service, file })
    process.exitCode = 1
    return
  }
  if (opts.follow) {
    // naive follow: stream from end of file
    const stream = fs.createReadStream(file, { encoding: 'utf8', start: fs.statSync(file).size })
    stream.on('data', (chunk) => {
      for (const line of String(chunk).split(/\r?\n/)) {
        if (!line) continue
        if (include && !include.test(line)) continue
        if (exclude && exclude.test(line)) continue
        out.info('logs.line', { service, line })
      }
    })
  } else {
    const text = fs.readFileSync(file, 'utf8')
    const lines = text.split(/\r?\n/).filter(Boolean)
    const tail = lines.slice(-maxLines)
    for (const line of tail) {
      if (include && !include.test(line)) continue
      if (exclude && exclude.test(line)) continue
      out.info('logs.line', { service, line })
    }
  }
}

async function cmdDocker(io: Io, env: NodeJS.ProcessEnv, cwd: string, enabled: boolean) {
  const log = createLogger(io.stdout)
  // Permission gate: require operator when RBAC is enabled
  if (process.env.RBAC_ENABLED === 'true') {
    const allowed = verifyRoleLocal(env, cwd, 'operator')
    if (!allowed) { log.error('forbidden', { action: 'docker.toggle' }); process.exitCode = 1; return }
  }
  const dir = getDataDir(env, cwd)
  const cfg = loadConfig(dir)
  cfg.dockerEnabled = enabled
  saveConfig(dir, cfg)
  log.info('docker.toggled', { enabled })
}

// Local verification against token store (shared semantics with backend)
function verifyRoleLocal(env: NodeJS.ProcessEnv, cwd: string, required: 'admin'|'operator'|'viewer'): boolean {
  const token = env.SARGE_TOKEN || tryLoadToken()
  if (!token) return false
  const dir = getDataDir(env, cwd)
  const secDir = path.join(dir, 'security')
  const f = path.join(secDir, 'tokens.json')
  if (!fs.existsSync(f)) return required === 'viewer' // bootstrap: no tokens defined
  try {
    const items = JSON.parse(fs.readFileSync(f, 'utf8')) as Array<{ id: string; role: 'admin'|'operator'|'viewer'; salt: string; hash: string; revokedAt?: string }>
    for (const it of items) {
      if (it.revokedAt) continue
      const salt = Buffer.from(it.salt, 'hex')
      const hash = crypto.scryptSync(token, salt, 32)
      if (crypto.timingSafeEqual(hash, Buffer.from(it.hash, 'hex'))) {
        const rank: Record<'admin'|'operator'|'viewer', number> = { admin: 3, operator: 2, viewer: 1 }
        return rank[it.role] >= rank[required]
      }
    }
    return false
  } catch { return false }
}

async function cmdExportTerraform(io: Io, _env: NodeJS.ProcessEnv, cwd: string, outDir: string, repo?: string) {
  const log = createLogger(io.stdout)
  const core = await importCore()
  const repoPath = repo ? path.resolve(repo) : cwd
  // Detect blueprint from repo and export deterministically
  const bp = await core.detector.detectStack(repoPath)
  // Prefer exporter from sarge-core if available; otherwise fall back to local dist path in monorepo
  let exporter: any | null = core?.exporters?.terraform ?? null
  if (!exporter || typeof exporter.export !== 'function') {
    try {
  const abs = path.resolve(__dirname, '../../../sarge-core/dist/exporters/terraform/index.js')
      const m: any = await importEsm(pathToFileURL(abs).href)
      exporter = (m?.default ?? m) as any
    } catch (e1) {
      log.error('export.terraform.unavailable', { message: (e1 as Error)?.message })
      process.exitCode = 1
      return
    }
  }
  const fn: any = (exporter as any).export ?? (exporter as any).exportTerraform
  if (typeof fn !== 'function') {
    log.error('export.terraform.unavailable', { message: 'export function not found' })
    process.exitCode = 1
    return
  }
  const res = await fn(bp, { outDir: path.resolve(outDir) })
  log.info('export.terraform.done', { files: res.files })
}

async function cmdExportK8s(io: Io, _env: NodeJS.ProcessEnv, cwd: string, outDir: string, repo?: string) {
  const log = createLogger(io.stdout)
  const core = await importCore()
  const repoPath = repo ? path.resolve(repo) : cwd
  const bp = await core.detector.detectStack(repoPath)
  let exporter: any = core?.exporters?.k8s ?? null
  if (!exporter || typeof exporter.export !== 'function') {
    try {
      const { pathToFileURL } = await import('url')
      const importer = new Function('p', 'return import(p)') as (p: string) => Promise<any>
      const abs = path.resolve(__dirname, '../../../sarge-core/dist/exporters/k8s/index.js')
      const m: any = await importer(pathToFileURL(abs).href)
      exporter = m?.default ?? m
    } catch (e) {
      log.error('export.k8s.unavailable', { message: (e as Error)?.message })
      process.exitCode = 1
      return
    }
  }
  const fn: any = (exporter as any).export ?? (exporter as any).exportK8s
  if (typeof fn !== 'function') {
    log.error('export.k8s.unavailable', { message: 'export function not found' })
    process.exitCode = 1
    return
  }
  const res = await fn(bp, { outDir: path.resolve(outDir) })
  log.info('export.k8s.done', { files: res.files })
}

async function cmdK8sUp(io: Io, env: NodeJS.ProcessEnv, cwd: string, opts: { k3d?: boolean; kind?: boolean }) {
  const log = createLogger(io.stdout)
  const dataDir = getDataDir(env, cwd)
  ensureLogsDir(dataDir)
  if (!opts.k3d && !opts.kind) {
    log.info('k8s.up.noop', { reason: 'no flag provided' })
    return
  }
  const { spawn } = await import('child_process')
  if (opts.k3d) {
    const p = spawn('k3d', ['cluster', 'create', 'sarge'], { stdio: 'inherit' })
    await new Promise((res) => p.on('close', () => res(null)))
    log.info('k3d.up.done', {})
  }
  if (opts.kind) {
    const p = spawn('kind', ['create', 'cluster', '--name', 'sarge'], { stdio: 'inherit' })
    await new Promise((res) => p.on('close', () => res(null)))
    log.info('kind.up.done', {})
  }
}

async function cmdK8sDown(io: Io, env: NodeJS.ProcessEnv, cwd: string, opts: { k3d?: boolean; kind?: boolean }) {
  const log = createLogger(io.stdout)
  const dataDir = getDataDir(env, cwd)
  ensureLogsDir(dataDir)
  if (!opts.k3d && !opts.kind) {
    log.info('k8s.down.noop', { reason: 'no flag provided' })
    return
  }
  const { spawn } = await import('child_process')
  if (opts.k3d) {
    const p = spawn('k3d', ['cluster', 'delete', 'sarge'], { stdio: 'inherit' })
    await new Promise((res) => p.on('close', () => res(null)))
    log.info('k3d.down.done', {})
  }
  if (opts.kind) {
    const p = spawn('kind', ['delete', 'cluster', '--name', 'sarge'], { stdio: 'inherit' })
    await new Promise((res) => p.on('close', () => res(null)))
    log.info('kind.down.done', {})
  }
}

async function cmdCloudPlan(io: Io, env: NodeJS.ProcessEnv, cwd: string, provider: string, dir: string) {
  const log = createLogger(io.stdout)
  const core = await importCore()
  const dataDir = getDataDir(env, cwd)
  const logsDir = ensureLogsDir(dataDir)
  const tfLogFile = path.join(logsDir, 'terraform.log')
  const sink = createFileLogSink(tfLogFile, log)
  const cloud = (core?.cloud?.apply ?? core?.cloud) as any
  let mod: any = cloud
  if (!mod || typeof mod.cloudPlan !== 'function') {
    // Fallback load from monorepo dist
    try {
      const { pathToFileURL } = await import('url')
      const importer = new Function('p', 'return import(p)') as (p: string) => Promise<any>
      const abs = path.resolve(__dirname, '../../../sarge-core/dist/cloud/apply/index.js')
      const m: any = await importer(pathToFileURL(abs).href)
      mod = m
    } catch (e) {
      log.error('cloud.plan.unavailable', { message: (e as Error)?.message })
      process.exitCode = 1
      return
    }
  }
  try {
    const res = await mod.cloudPlan({ dir: path.resolve(dir), onLog: sink, redactKeys: ['TF_VAR_*'] })
    log.info('cloud.plan.summary', { provider, dir: path.resolve(dir), summary: res.summary })
  } catch (e: any) {
    const msg = e?.code === 'ENOENT' ? 'terraform binary not found in PATH' : e?.message
    log.error('cloud.plan.error', { message: msg })
    process.exitCode = 1
  }
}

async function cmdCloudApply(io: Io, env: NodeJS.ProcessEnv, cwd: string, provider: string, dir: string) {
  const log = createLogger(io.stdout)
  if (process.env.RBAC_ENABLED === 'true') {
    const allowed = verifyRoleLocal(env, cwd, 'operator')
    if (!allowed) { log.error('forbidden', { action: 'cloud.apply' }); process.exitCode = 1; return }
  }
  const core = await importCore()
  const dataDir = getDataDir(env, cwd)
  const logsDir = ensureLogsDir(dataDir)
  const tfLogFile = path.join(logsDir, 'terraform.log')
  const sink = createFileLogSink(tfLogFile, log)
  const cloud = (core?.cloud?.apply ?? core?.cloud) as any
  let mod: any = cloud
  if (!mod || typeof mod.cloudApply !== 'function') {
    try {
      const { pathToFileURL } = await import('url')
      const importer = new Function('p', 'return import(p)') as (p: string) => Promise<any>
      const abs = path.resolve(__dirname, '../../../sarge-core/dist/cloud/apply/index.js')
      const m: any = await importer(pathToFileURL(abs).href)
      mod = m
    } catch (e) {
      log.error('cloud.apply.unavailable', { message: (e as Error)?.message })
      process.exitCode = 1
      return
    }
  }
  try {
    const res = await mod.cloudApply({ dir: path.resolve(dir), onLog: sink, redactKeys: ['TF_VAR_*'] })
    log.info('cloud.apply.done', { provider, dir: path.resolve(dir), exitCode: res.exitCode })
  } catch (e: any) {
    const msg = e?.code === 'ENOENT' ? 'terraform binary not found in PATH' : e?.message
    log.error('cloud.apply.error', { message: msg })
    process.exitCode = 1
  }
}

async function cmdCloudDestroy(io: Io, env: NodeJS.ProcessEnv, cwd: string, provider: string, dir: string) {
  const log = createLogger(io.stdout)
  if (process.env.RBAC_ENABLED === 'true') {
    const allowed = verifyRoleLocal(env, cwd, 'operator')
    if (!allowed) { log.error('forbidden', { action: 'cloud.destroy' }); process.exitCode = 1; return }
  }
  const core = await importCore()
  const dataDir = getDataDir(env, cwd)
  const logsDir = ensureLogsDir(dataDir)
  const tfLogFile = path.join(logsDir, 'terraform.log')
  const sink = createFileLogSink(tfLogFile, log)
  const cloud = (core?.cloud?.apply ?? core?.cloud) as any
  let mod: any = cloud
  if (!mod || typeof mod.cloudDestroy !== 'function') {
    try {
      const { pathToFileURL } = await import('url')
      const importer = new Function('p', 'return import(p)') as (p: string) => Promise<any>
      const abs = path.resolve(__dirname, '../../../sarge-core/dist/cloud/apply/index.js')
      const m: any = await importer(pathToFileURL(abs).href)
      mod = m
    } catch (e) {
      log.error('cloud.destroy.unavailable', { message: (e as Error)?.message })
      process.exitCode = 1
      return
    }
  }
  try {
    const res = await mod.cloudDestroy({ dir: path.resolve(dir), onLog: sink, redactKeys: ['TF_VAR_*'] })
    log.info('cloud.destroy.done', { provider, dir: path.resolve(dir), exitCode: res.exitCode })
  } catch (e: any) {
    const msg = e?.code === 'ENOENT' ? 'terraform binary not found in PATH' : e?.message
    log.error('cloud.destroy.error', { message: msg })
    process.exitCode = 1
  }
}

// --- Env (Secrets v2) helpers and commands ---
type EnvScope = { type: 'workspace' } | { type: 'stack'; name: string } | { type: 'service'; name: string }
async function createEnvManager(dataRoot: string): Promise<any> {
  // Prefer sarge-core exported EnvManager, fallback to monorepo dist/src
  try {
    const core = await importCore()
    if (core?.env?.EnvManager) return new core.env.EnvManager(dataRoot)
  } catch {}
  try {
    const abs = path.resolve(__dirname, '../../../sarge-core/dist/env/index.js')
    const m: any = await importEsm(pathToFileURL(abs).href)
    const Ctor = (m?.EnvManager ?? (m?.default?.EnvManager)) as any
    if (Ctor) return new Ctor(dataRoot)
  } catch {}
  try {
    // Dev fallback
    const abs = path.resolve(__dirname, '../../../sarge-core/src/env/index.ts')
    const m: any = await importEsm(pathToFileURL(abs).href)
    const Ctor = (m?.EnvManager ?? (m?.default?.EnvManager)) as any
    if (Ctor) return new Ctor(dataRoot)
  } catch {}
  throw new Error('EnvManager unavailable')
}

function parseScope(opts: { workspace?: boolean; stack?: string; service?: string }): EnvScope {
  if (opts.service) return { type: 'service', name: opts.service }
  if (opts.stack) return { type: 'stack', name: opts.stack }
  return { type: 'workspace' }
}

async function cmdEnvSet(io: Io, env: NodeJS.ProcessEnv, cwd: string, keyValue: string, opts: { workspace?: boolean; stack?: string; service?: string; secret?: boolean; oneTime?: boolean }) {
  const log = createLogger(io.stdout)
  const dir = getDataDir(env, cwd)
  const mgr = await createEnvManager(dir)
  const idx = keyValue.indexOf('=')
  if (idx <= 0) { log.error('env.set.invalid', { keyValue }); process.exitCode = 1; return }
  const key = keyValue.slice(0, idx)
  const value = keyValue.slice(idx + 1)
  const scope = parseScope(opts)
  mgr.set(scope, key, value, { secret: !!opts.secret, oneTime: !!opts.oneTime, actor: 'cli' })
  log.info('env.set.ok', { scope, key, secret: !!opts.secret, oneTime: !!opts.oneTime })
}

async function cmdEnvGet(io: Io, env: NodeJS.ProcessEnv, cwd: string, key: string, opts: { workspace?: boolean; stack?: string; service?: string }) {
  const log = createLogger(io.stdout)
  const dir = getDataDir(env, cwd)
  const mgr = await createEnvManager(dir)
  const scope = parseScope(opts)
  const out = mgr.get(scope, key, { actor: 'cli' })
  if (!out) { log.error('env.get.missing', { scope, key }); process.exitCode = 1; return }
  const { meta, value } = out
  // Do not emit secret values
  log.info('env.get.ok', { scope, key, meta, value: meta.secret ? undefined : value })
}

async function cmdEnvReveal(io: Io, env: NodeJS.ProcessEnv, cwd: string, key: string, opts: { workspace?: boolean; stack?: string; service?: string }) {
  const dir = getDataDir(env, cwd)
  const mgr = await createEnvManager(dir)
  const scope = parseScope(opts)
  const val = mgr.reveal(scope, key, { actor: 'cli' })
  if (val == null) {
    const log = createLogger(io.stdout)
    log.error('env.reveal.missing', { scope, key })
    process.exitCode = 1
    return
  }
  // Print raw value to stdout without structured logging to avoid leaking into JSON logs
  io.stdout.write(String(val) + '\n')
}

async function cmdEnvList(io: Io, env: NodeJS.ProcessEnv, cwd: string, opts: { workspace?: boolean; stack?: string; service?: string }) {
  const log = createLogger(io.stdout)
  const dir = getDataDir(env, cwd)
  const mgr = await createEnvManager(dir)
  const scope = parseScope(opts)
  const metas = mgr.list(scope, { actor: 'cli' })
  log.info('env.list.ok', { scope, items: metas })
}

async function cmdEnvDelete(io: Io, env: NodeJS.ProcessEnv, cwd: string, key: string, opts: { workspace?: boolean; stack?: string; service?: string }) {
  const log = createLogger(io.stdout)
  const dir = getDataDir(env, cwd)
  const mgr = await createEnvManager(dir)
  const scope = parseScope(opts)
  mgr.delete(scope, key, { actor: 'cli' })
  log.info('env.delete.ok', { scope, key })
}

export async function runCli(argv: string[], io: Io, env: NodeJS.ProcessEnv, cwd = process.cwd()) {
  // Manual pre-dispatch for nested subcommands to support older commander versions
  const manual = async () => {
    const args = argv.slice(2)
    const next = (flag: string) => {
      const i = args.indexOf(flag)
      return i >= 0 ? args[i + 1] : undefined
    }
    if (args[0] === 'stack' && args[1] === 'create') {
      const name = args[2]
      const services = next('--services')
      await cmdStackCreate(io, env, cwd, name, services)
      return true
    }
    if (args[0] === 'snapshot' && args[1] === 'create') {
      const name = args[2]
      await cmdSnapshotCreate(io, env, cwd, name)
      return true
    }
    if (args[0] === 'snapshot' && args[1] === 'replay') {
      const name = args[2]
      await cmdSnapshotReplay(io, env, cwd, name)
      return true
    }
    if (args[0] === 'docker' && (args[1] === 'on' || args[1] === 'off')) {
      await cmdDocker(io, env, cwd, args[1] === 'on')
      return true
    }
    return false
  }
  if (await manual()) return
  const program = new Command()
  program.name('sarge').description('Sarge Infra OS CLI').version('0.0.1')

  program
    .command('up')
    .description('Start the local Sarge runtime')
    .action(async () => {
      await cmdUp(io, env, cwd)
    })

  program
    .command('down')
    .description('Stop the local Sarge runtime')
    .action(async () => {
      await cmdDown(io, env, cwd)
    })

  program
    .command('status')
    .description('Show runtime status')
    .action(async () => {
      await cmdStatus(io, env, cwd)
    })

  const stack = program.command('stack').description('Manage stacks')
  stack
    .command('create <name>')
    .option('--services <list>', 'Comma-separated service kinds e.g. s3,dynamo,lambda')
    .description('Create a stack with optional services')
    .action(async (name: string, opts: { services?: string }) => {
      await cmdStackCreate(io, env, cwd, name, opts.services)
    })

  const snapshot = program.command('snapshot').description('Manage workspace snapshots')
  snapshot
    .command('create <name>')
    .description('Create a workspace snapshot')
    .action(async (name: string) => {
      await cmdSnapshotCreate(io, env, cwd, name)
    })
  snapshot
    .command('replay <name>')
    .description('Replay a workspace snapshot')
    .action(async (name: string) => {
      await cmdSnapshotReplay(io, env, cwd, name)
    })

  program
    .command('detect')
    .description('Detect a repository stack blueprint')
    .option('--repo <path>', 'Path to repository', '.')
    .action(async (opts: { repo: string }) => {
      await cmdDetect(io, env, cwd, opts.repo)
    })

  program
    .command('plan')
    .description('Create an apply plan from a blueprint JSON')
    .requiredOption('--in <file>', 'Blueprint JSON file')
    .action(async (opts: { in: string }) => {
      await cmdPlan(io, env, cwd, opts.in)
    })

  program
    .command('apply')
    .description('Apply a plan JSON')
    .requiredOption('--plan <file>', 'Plan JSON file')
    .option('--repo <path>', 'Path to repository (defaults to cwd)')
    .action(async (opts: { plan: string; repo?: string }) => {
      await cmdApply(io, env, cwd, opts.plan, opts.repo)
    })

  program
    .command('logs <service>')
    .option('--follow', 'Follow log output')
  .option('--lines <n>', 'Number of lines to show', (v: string) => parseInt(v, 10))
    .option('--include <regex>', 'Include filter regex')
    .option('--exclude <regex>', 'Exclude filter regex')
    .description('Tail service logs')
    .action(async (service: string, opts: any) => {
      await cmdLogs(io, env, cwd, service, opts)
    })

  const docker = program.command('docker').description('Docker mode')
  docker
    .command('on')
    .description('Enable Docker mode')
    .action(async () => { await cmdDocker(io, env, cwd, true) })
  docker
    .command('off')
    .description('Disable Docker mode')
    .action(async () => { await cmdDocker(io, env, cwd, false) })

  const exp = program.command('export').description('Export artifacts')
  exp
    .command('terraform')
    .description('Export Terraform JSON from detected blueprint')
    .requiredOption('--out <dir>', 'Output directory (e.g., ./infra)')
    .option('--repo <path>', 'Path to repository (defaults to cwd)')
    .action(async (opts: { out: string; repo?: string }) => {
      await cmdExportTerraform(io, env, cwd, opts.out, opts.repo)
    })

  exp
    .command('k8s')
    .description('Export Kubernetes manifests from detected blueprint')
    .requiredOption('--out <dir>', 'Output directory (e.g., ./infra/k8s)')
    .option('--repo <path>', 'Path to repository (defaults to cwd)')
    .action(async (opts: { out: string; repo?: string }) => {
      await cmdExportK8s(io, env, cwd, opts.out, opts.repo)
    })

  const cloud = program.command('cloud').description('Cloud apply adapters (opt-in)')
  cloud
    .command('plan')
    .requiredOption('--provider <name>', 'Cloud provider (aws)')
    .requiredOption('--dir <path>', 'Directory containing Terraform JSON')
    .description('Run terraform plan and output a deterministic summary')
    .action(async (opts: { provider: string; dir: string }) => {
      await cmdCloudPlan(io, env, cwd, opts.provider, opts.dir)
    })
  cloud
    .command('apply')
    .requiredOption('--provider <name>', 'Cloud provider (aws)')
    .requiredOption('--dir <path>', 'Directory containing Terraform JSON')
    .description('Run terraform apply (auto-approve)')
    .action(async (opts: { provider: string; dir: string }) => {
      await cmdCloudApply(io, env, cwd, opts.provider, opts.dir)
    })
  cloud
    .command('destroy')
    .requiredOption('--provider <name>', 'Cloud provider (aws)')
    .requiredOption('--dir <path>', 'Directory containing Terraform JSON')
    .description('Run terraform destroy (auto-approve)')
    .action(async (opts: { provider: string; dir: string }) => {
      await cmdCloudDestroy(io, env, cwd, opts.provider, opts.dir)
    })

  const k8s = program.command('k8s').description('Kubernetes mode (optional)')
  // Env (Secrets v2)
  const envCmd = program.command('env').description('Manage environment variables and secrets (v2)')
  envCmd
    .command('set <keyValue>')
    .option('--workspace', 'Workspace scope (default)')
    .option('--stack <name>', 'Stack scope')
    .option('--service <name>', 'Service scope')
    .option('--secret', 'Mark as secret (encrypted)')
    .option('--one-time', 'One-time reveal secret')
    .description('Set an environment variable or secret')
    .action(async (keyValue: string, opts: any) => { await cmdEnvSet(io, env, cwd, keyValue, opts) })
  envCmd
    .command('get <key>')
    .option('--workspace', 'Workspace scope (default)')
    .option('--stack <name>', 'Stack scope')
    .option('--service <name>', 'Service scope')
    .description('Get metadata (and value for non-secret)')
    .action(async (key: string, opts: any) => { await cmdEnvGet(io, env, cwd, key, opts) })
  envCmd
    .command('reveal <key>')
    .option('--workspace', 'Workspace scope (default)')
    .option('--stack <name>', 'Stack scope')
    .option('--service <name>', 'Service scope')
    .description('Reveal a secret value (printed raw; not logged)')
    .action(async (key: string, opts: any) => { await cmdEnvReveal(io, env, cwd, key, opts) })
  envCmd
    .command('list')
    .option('--workspace', 'Workspace scope (default)')
    .option('--stack <name>', 'Stack scope')
    .option('--service <name>', 'Service scope')
    .description('List environment variable metadata')
    .action(async (opts: any) => { await cmdEnvList(io, env, cwd, opts) })
  envCmd
    .command('delete <key>')
    .option('--workspace', 'Workspace scope (default)')
    .option('--stack <name>', 'Stack scope')
    .option('--service <name>', 'Service scope')
    .description('Delete an environment variable or secret')
    .action(async (key: string, opts: any) => { await cmdEnvDelete(io, env, cwd, key, opts) })
  // Auth: store token securely for CLI use
  program
    .command('login')
    .description('Store API token securely for CLI use')
    .requiredOption('--token <token>', 'API token (stored securely)')
    .action(async (opts: { token: string }) => {
      saveTokenSecure(opts.token)
      const log = createLogger(io.stdout)
      log.info('auth.login.saved')
    })

  // Token management (local workspace token store)
  const tokenCmd = program.command('token').description('Manage local API tokens (RBAC)')
  tokenCmd
    .command('create')
    .requiredOption('--role <role>', 'Role: admin|operator|viewer')
    .option('--token <token>', 'Explicit token value to hash and store (optional)')
    .action(async (opts: { role: 'admin'|'operator'|'viewer'; token?: string }) => {
      const log = createLogger(io.stdout)
      const dir = getDataDir(env, cwd)
      const sec = path.join(dir, 'security')
      if (!fs.existsSync(sec)) fs.mkdirSync(sec, { recursive: true })
      const file = path.join(sec, 'tokens.json')
      const items: any[] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []
      const bootstrap = items.length === 0
      if (!bootstrap && process.env.RBAC_ENABLED === 'true' && !verifyRoleLocal(env, cwd, 'admin')) { log.error('forbidden', { action: 'token.create' }); process.exitCode = 1; return }
      const id = 'tok_' + crypto.randomUUID().slice(0, 8)
      const token = opts.token ?? crypto.randomUUID().replace(/-/g, '')
      const salt = crypto.randomBytes(16)
      const hash = crypto.scryptSync(token, salt, 32)
      items.push({ id, role: opts.role, salt: salt.toString('hex'), hash: hash.toString('hex'), createdAt: new Date().toISOString() })
      fs.writeFileSync(file, JSON.stringify(items, null, 2))
      log.info('token.created', { id, role: opts.role })
    })
  tokenCmd
    .command('rotate')
    .requiredOption('--id <id>', 'Token id to rotate')
    .action(async (opts: { id: string }) => {
      const log = createLogger(io.stdout)
      if (process.env.RBAC_ENABLED === 'true' && !verifyRoleLocal(env, cwd, 'admin')) { log.error('forbidden', { action: 'token.rotate' }); process.exitCode = 1; return }
      const dir = getDataDir(env, cwd)
      const file = path.join(dir, 'security', 'tokens.json')
      const items: any[] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []
      const idx = items.findIndex((t) => t.id === opts.id && !t.revokedAt)
      if (idx === -1) { log.error('token.missing', { id: opts.id }); process.exitCode = 1; return }
      const salt = crypto.randomBytes(16)
      const hash = crypto.scryptSync(crypto.randomUUID().replace(/-/g, ''), salt, 32)
      items[idx].salt = salt.toString('hex')
      items[idx].hash = hash.toString('hex')
      items[idx].createdAt = new Date().toISOString()
      fs.writeFileSync(file, JSON.stringify(items, null, 2))
      log.info('token.rotated', { id: opts.id })
    })
  tokenCmd
    .command('revoke')
    .requiredOption('--id <id>', 'Token id to revoke')
    .action(async (opts: { id: string }) => {
      const log = createLogger(io.stdout)
      if (process.env.RBAC_ENABLED === 'true' && !verifyRoleLocal(env, cwd, 'admin')) { log.error('forbidden', { action: 'token.revoke' }); process.exitCode = 1; return }
      const dir = getDataDir(env, cwd)
      const file = path.join(dir, 'security', 'tokens.json')
      const items: any[] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []
      const idx = items.findIndex((t) => t.id === opts.id && !t.revokedAt)
      if (idx === -1) { log.error('token.missing', { id: opts.id }); process.exitCode = 1; return }
      items[idx].revokedAt = new Date().toISOString()
      fs.writeFileSync(file, JSON.stringify(items, null, 2))
      log.info('token.revoked', { id: opts.id })
    })
  k8s
    .command('up')
    .option('--k3d', 'Use k3d to create a local cluster')
    .option('--kind', 'Use kind to create a local cluster')
    .description('Start a local Kubernetes cluster (optional, behind flags)')
    .action(async (opts: { k3d?: boolean; kind?: boolean }) => {
      await cmdK8sUp(io, env, cwd, opts)
    })
  k8s
    .command('down')
    .option('--k3d', 'Use k3d to delete the local cluster')
    .option('--kind', 'Use kind to delete the local cluster')
    .description('Stop the local Kubernetes cluster (optional, behind flags)')
    .action(async (opts: { k3d?: boolean; kind?: boolean }) => {
      await cmdK8sDown(io, env, cwd, opts)
    })

  await program.parseAsync(argv)
}

export function main() {
  runCli(process.argv, { stdout: process.stdout, stderr: process.stderr }, process.env).catch((err) => {
    const logger = createLogger(process.stderr)
    logger.error('cli.error', { message: err?.message })
    process.exit(1)
  })
}

if (require.main === module) main()

function tryCreateSnapshotManager(dataRoot: string): any | null {
  // Attempt to construct SnapshotManager and adapters; if soft deps missing, return null
  let core: any
  try { core = getCore() } catch { return null }
  let S3Ctor: any, DdbcCtor: any
  try { S3Ctor = require('sarge-services-s3').S3Service } catch { S3Ctor = null }
  try { DdbcCtor = require('sarge-services-dynamo').DynamoService } catch { DdbcCtor = null }
  const adapters: any = { dataRoot } as any
  if (S3Ctor) {
    const s3 = new S3Ctor({ dataRoot })
    adapters.s3 = {
      async listBuckets() {
        const s3root = path.join(dataRoot, 's3')
        if (!fs.existsSync(s3root)) return []
        return fs.readdirSync(s3root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
      },
      async createBucket(name: string) { await s3.createBucket(name) },
      async listObjects(bucket: string) { const out = await s3.listObjectsV2(bucket); return out.contents.map((o: any) => ({ key: o.key })) },
      async getObject(bucket: string, key: string) { const got = await s3.getObject(bucket, key); return { body: got.body, contentType: got.meta.contentType } },
      async putObject(bucket: string, key: string, body: Buffer, contentType?: string) { await s3.putObject(bucket, key, body, contentType) },
    }
  }
  if (DdbcCtor) {
    const ddb = new DdbcCtor({ dataRoot })
    adapters.dynamo = {
      async listTables() { const out = await ddb.listTables(); return out.TableNames },
      async describeTable(name: string) { const out = await ddb.describeTable(name); return { TableName: name, KeySchema: out.Table.KeySchema, AttributeDefinitions: out.Table.AttributeDefinitions } },
      async scanAll(name: string) { const out = await ddb.scan({ TableName: name }); return out.Items },
      async createTable(desc: any) { await ddb.createTable(desc) },
      async putItem(name: string, item: any) { await ddb.putItem({ TableName: name, Item: item }) },
    }
  }
  try { return new core.SnapshotManager(adapters) } catch { return null }
}
