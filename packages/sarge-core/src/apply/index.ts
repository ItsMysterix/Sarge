import { spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { type ApplyPlan } from '../planner/schema'
import { createTelemetry, ensureDashboards, markUp, renderPrometheus } from '../telemetry/attach'
import { formatLog } from './logging'
import type { EventBus } from '../domain/events'
import { SnapshotManager } from '../snapshot/index'

export interface ApplyOptions {
  repoPath?: string
  dataRoot?: string
  eventBus?: EventBus
  serviceStartTimeoutMs?: number
  healthRetries?: number
  rollback?: () => Promise<void> | void
  snapshot?: { manager: SnapshotManager; name?: string }
}

export interface ApplyResult {
  ok: boolean
  startedServices: string[]
  // Backward compatible errors: can be string or structured
  errors: Array<string | { category: 'detector' | 'planner' | 'runtime' | 'telemetry'; message: string; hints?: string[] }>
  stop: () => Promise<void>
}

type ProcEntry = { name: string; proc: ChildProcess; port?: number; cwd?: string }

export async function apply(plan: ApplyPlan, options: ApplyOptions = {}): Promise<ApplyResult> {
  const repoPath = options.repoPath ?? process.cwd()
  const dataRoot = options.dataRoot ?? path.resolve(process.cwd(), 'data/sarge')
  const started: ProcEntry[] = []
  const errors: Array<string | { category: 'detector' | 'planner' | 'runtime' | 'telemetry'; message: string; hints?: string[] }> = []
  const telemetry = createTelemetry()
  const historyFile = path.join(dataRoot, 'history.jsonl')
  const runStartedAt = Date.now()
  let tookSnapshot = false
  const snapshotName = options.snapshot?.name || `pre-apply-${new Date(runStartedAt).toISOString()}`

  // Ensure log directories
  const logsDir = path.join(dataRoot, 'logs')
  fs.mkdirSync(logsDir, { recursive: true })
  const metricsDir = path.join(dataRoot, 'metrics')
  fs.mkdirSync(metricsDir, { recursive: true })
  ensureDashboards(dataRoot)

  const writeMetrics = () => {
    const p = path.join(metricsDir, 'metrics.prom')
    fs.writeFileSync(p, renderPrometheus(telemetry))
  }

  try {
    // Planner validations: missing envs or missing HTTP ports must be addressed before apply
    const missingEnvIssues = (plan.issues || []).filter((i: any) => i.kind === 'missing-env')
    if (missingEnvIssues.length) {
      const hints = missingEnvIssues.map((i: any) => `Missing env ${i.key} for services: ${(i.services || []).join(',') || 'n/a'}`)
      throw { category: 'planner', message: 'Missing required environment variables', hints }
    }
    const missingHttpPorts: string[] = []
    for (const svc of plan.blueprint.services) {
      const http = (svc as any).health?.http
      if (http) {
        const assigned = (plan.assignedPorts || []).find((a: any) => a.service === svc.name)?.assigned || []
        if (!assigned.length) missingHttpPorts.push(svc.name)
      }
    }
    if (missingHttpPorts.length) {
      throw { category: 'planner', message: 'HTTP services without assigned ports', hints: missingHttpPorts.map((n) => `Assign a port to service ${n}`) }
    }

    // Optional pre-apply snapshot
    if (options.snapshot?.manager) {
      try {
        await options.snapshot.manager.create(snapshotName)
        tookSnapshot = true
      } catch (e: any) {
        // Non-fatal telemetry category error
        errors.push({ category: 'telemetry', message: `snapshot.create failed: ${String(e?.message || e)}` })
      }
    }
    // Phase 1: resources (no-ops here; resources would be applied by adapters)
    // Phase 2: services
    for (const svcOp of plan.serviceOps) {
      if (svcOp.op === 'start') {
        const svc = plan.blueprint.services.find((s) => s.name === svcOp.name)
        if (!svc) continue
        const cwd = svc.cwd ? path.resolve(repoPath, svc.cwd) : repoPath
        const port = (svcOp.ports && svcOp.ports[0]) || undefined
        const logFile = path.join(logsDir, `${svcOp.name}.log`)
        const { child } = spawnService(svc.name, svc.startCommand || 'node server.js', cwd, logFile, port)
        started.push({ name: svc.name, proc: child, port, cwd })
        const ok = await waitHealthy(svc, port, options)
        if (!ok) {
          const hints: string[] = []
          if (svc.health?.http && !port) hints.push('Service has HTTP healthcheck but no port assigned; assign a port in plan')
          const missingEnvHints = (plan.issues || [])
            .filter((i: any) => i.kind === 'missing-env' && (i.services || []).includes(svc.name))
            .map((i: any) => `Missing env ${i.key}`)
          hints.push(...missingEnvHints)
          throw mkRuntimeError(`healthcheck failed for ${svc.name}`, hints)
        }
        // mark service up in telemetry once healthy
        markUp(telemetry, svc.name, true)
        writeMetrics()
      }
    }

    return {
      ok: true,
      startedServices: started.map((s) => s.name),
      errors,
      stop: async () => {
        await stopAll(started)
        // mark all services down on stop
        for (const s of started) markUp(telemetry, s.name, false)
        writeMetrics()
        persistHistory(historyFile, runStartedAt, true, started.map((s) => s.name), errors)
      }
    }
  } catch (e: any) {
    if (isStructuredError(e)) errors.push(e)
    else errors.push({ category: 'runtime', message: String(e?.message || e) })
    // rollback: stop everything and invoke hook
    await stopAll(started)
    // mark any started services down
    for (const s of started) markUp(telemetry, s.name, false)
    writeMetrics()
    // attempt snapshot rollback
    if (tookSnapshot && options.snapshot?.manager) {
      try { await options.snapshot.manager.replay(snapshotName) }
      catch (re: any) { errors.push({ category: 'runtime', message: `snapshot.replay failed: ${String(re?.message || re)}` }) }
    }
    if (options.rollback) await options.rollback()
    persistHistory(historyFile, runStartedAt, false, [], errors)
    return { ok: false, startedServices: [], errors, stop: async () => {} }
  }
}

function spawnService(name: string, command: string, cwd: string, logFile: string, port?: number) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true })
  const out = fs.createWriteStream(logFile, { flags: 'a' })
  const env = { ...process.env, ...(port ? { PORT: String(port) } : {}) }
  const child = spawn(command, { cwd, shell: true, env })
  child.stdout?.on('data', (d) => out.write(formatLog(name, 'stdout', d)))
  child.stderr?.on('data', (d) => out.write(formatLog(name, 'stderr', d)))
  child.on('exit', (code) => out.write(formatLog(name, 'exit', `code=${code}\n`)))
  return { child }
}

async function waitHealthy(
  svc: { name: string; health?: { http?: { path?: string } } },
  port: number | undefined,
  options: ApplyOptions
): Promise<boolean> {
  const timeoutMs = options.serviceStartTimeoutMs ?? 5000
  const retries = options.healthRetries ?? 10
  const pathPart = svc.health?.http?.path ?? '/'
  if (!port) return true
  const deadline = Date.now() + timeoutMs
  let attempt = 0
  // small initial delay to allow process bootstrap
  if (attempt === 0) await delay(200)
  while (Date.now() < deadline && attempt < retries) {
    attempt++
    try {
      const res = await fetch(`http://127.0.0.1:${port}${pathPart}`)
      if (res.ok) return true
    } catch { /* ignore */ }
    await delay(100)
  }
  return false
}

async function stopAll(started: ProcEntry[]) {
  for (const s of started.reverse()) {
    try {
      if (s.proc.pid) process.kill(s.proc.pid)
    } catch { /* ignore */ }
  }
}

function persistHistory(
  file: string,
  startedAt: number,
  ok: boolean,
  startedServices: string[],
  errors: Array<string | { category: string; message: string; hints?: string[] }>
) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    const rec = {
      ts: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      ok,
      startedServices,
      errors,
    }
    fs.appendFileSync(file, JSON.stringify(rec) + '\n')
  } catch {
    // ignore history persistence failures
  }
}

function mkRuntimeError(message: string, hints?: string[]) {
  return { category: 'runtime' as const, message, ...(hints && hints.length ? { hints } : {}) }
}

function isStructuredError(e: any): e is { category: any; message: string } {
  return e && typeof e === 'object' && typeof e.message === 'string' && typeof e.category === 'string'
}
