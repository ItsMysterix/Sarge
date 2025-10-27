import * as fs from 'fs'
import * as path from 'path'
import YAML from 'yaml'

export type InfraAction =
  | { kind: 'cpuSpike'; durationMs: number; intensity: number }
  | { kind: 'networkDelay'; service?: string; latencyMs: number; jitterMs?: number }
  | { kind: 'dropMessages'; service?: string; percent: number; durationMs: number }
  | { kind: 'processKill'; service: string }
  | { kind: 'diskFill'; service?: string; sizeMB: number; capMB?: number }
  | { kind: 'wait'; ms: number }
  | { kind: 'assertHealth'; minHealthyPct: number }
  | { kind: 'assertSli'; name: string; op: 'lt'|'lte'|'gt'|'gte'|'eq'; value: number }

export type InfraTestSpec = {
  name: string
  steps: InfraAction[]
  profile?: string
}

export type TestCaseResult = {
  name: string
  success: boolean
  error?: string
  durationMs: number
}

export type TestRunResult = {
  suiteName: string
  cases: TestCaseResult[]
  startedAt: string
  finishedAt: string
  junitXml: string
  summary: { total: number; passed: number; failed: number; durationMs: number }
}

export function parseSpecFile(filePath: string): InfraTestSpec {
  const raw = fs.readFileSync(filePath, 'utf8')
  const doc = YAML.parse(raw)
  const name = doc.name || path.basename(filePath)
  const steps = (doc.steps || []) as InfraAction[]
  const profile = doc.profile
  return { name, steps, profile }
}

export async function runSpec(spec: InfraTestSpec, opts: { dataRoot: string }): Promise<TestRunResult> {
  const startedAt = new Date().toISOString()
  const cases: TestCaseResult[] = []

  // Deterministic chaos: we do not perform real side-effects by default.
  // We simulate actions and record timings, suitable for offline runs.

  for (const step of spec.steps) {
    const t0 = Date.now()
    try {
      switch (step.kind) {
        case 'cpuSpike': {
          // Busy loop for a capped duration (simulate)
          const cap = Math.min(step.durationMs, 2000)
          const end = Date.now() + cap
          while (Date.now() < end) {
            // simple math to keep CPU occupied deterministically
            Math.sqrt(144)
          }
          cases.push({ name: 'cpuSpike', success: true, durationMs: Date.now() - t0 })
          break
        }
        case 'networkDelay': {
          await sleep(Math.min(step.latencyMs + (step.jitterMs || 0), 1000))
          cases.push({ name: `networkDelay(${step.service || 'all'})`, success: true, durationMs: Date.now() - t0 })
          break
        }
        case 'dropMessages': {
          await sleep(Math.min(step.durationMs, 1000))
          cases.push({ name: `dropMessages(${step.percent}%)`, success: true, durationMs: Date.now() - t0 })
          break
        }
        case 'processKill': {
          // Offline mode: simulate kill by logging
          cases.push({ name: `processKill(${step.service})`, success: true, durationMs: Date.now() - t0 })
          break
        }
        case 'diskFill': {
          const cap = Math.min(step.capMB || 50, step.sizeMB)
          await sleep(Math.min(cap * 2, 1000))
          cases.push({ name: `diskFill(${cap}MB)`, success: true, durationMs: Date.now() - t0 })
          break
        }
        case 'wait': {
          await sleep(Math.min(step.ms, 1000))
          cases.push({ name: `wait(${step.ms}ms)`, success: true, durationMs: Date.now() - t0 })
          break
        }
        case 'assertHealth': {
          // Deterministic: read a health snapshot if exists; else assume partial
          const health = tryReadHealth(opts.dataRoot)
          const healthyPct = health?.healthyPct ?? 50
          const ok = healthyPct >= step.minHealthyPct
          cases.push({ name: `assertHealth(>=${step.minHealthyPct}%)`, success: ok, durationMs: Date.now() - t0, error: ok ? undefined : `healthy=${healthyPct}%` })
          break
        }
        case 'assertSli': {
          const val = tryReadSli(opts.dataRoot, step.name)
          const ok = compare(val, step.op, step.value)
          cases.push({ name: `assertSli(${step.name} ${step.op} ${step.value})`, success: ok, durationMs: Date.now() - t0, error: ok ? undefined : `actual=${val}` })
          break
        }
        default: {
          cases.push({ name: 'unknown', success: false, durationMs: Date.now() - t0, error: 'unknown step' })
        }
      }
    } catch (e: any) {
      cases.push({ name: (step as any).kind || 'step', success: false, durationMs: Date.now() - t0, error: e?.message || String(e) })
    }
  }

  const finishedAt = new Date().toISOString()
  const passed = cases.filter(c => c.success).length
  const failed = cases.length - passed
  const junitXml = renderJUnit(spec.name, cases)
  return {
    suiteName: spec.name,
    cases,
    startedAt,
    finishedAt,
    junitXml,
    summary: { total: cases.length, passed, failed, durationMs: new Date(finishedAt).getTime() - new Date(startedAt).getTime() }
  }
}

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)) }

function tryReadHealth(dataRoot: string): { healthyPct: number } | null {
  try {
    const f = path.join(dataRoot, 'health.json')
    if (!fs.existsSync(f)) return null
    const o = JSON.parse(fs.readFileSync(f, 'utf8'))
    return { healthyPct: typeof o.healthyPct === 'number' ? o.healthyPct : 50 }
  } catch { return null }
}

function tryReadSli(dataRoot: string, name: string): number {
  try {
    const f = path.join(dataRoot, 'slis.json')
    if (!fs.existsSync(f)) return NaN
    const o = JSON.parse(fs.readFileSync(f, 'utf8'))
    const v = o[name]
    return typeof v === 'number' ? v : NaN
  } catch { return NaN }
}

function compare(actual: number, op: 'lt'|'lte'|'gt'|'gte'|'eq', expected: number): boolean {
  if (Number.isNaN(actual)) return false
  switch (op) {
    case 'lt': return actual < expected
    case 'lte': return actual <= expected
    case 'gt': return actual > expected
    case 'gte': return actual >= expected
    case 'eq': return actual === expected
  }
}

function xmlEscape(s: string) { return s.replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;','\'':'&apos;'} as any)[c]) }

function renderJUnit(suite: string, cases: TestCaseResult[]): string {
  const tests = cases.length
  const failures = cases.filter(c => !c.success).length
  const time = cases.reduce((a, c) => a + c.durationMs, 0) / 1000
  const body = cases.map(c => {
    const name = xmlEscape(c.name)
    const t = (c.durationMs / 1000).toFixed(3)
    if (c.success) return `<testcase name="${name}" time="${t}" />`
    return `<testcase name="${name}" time="${t}"><failure message="${xmlEscape(c.error || 'failed')}"/></testcase>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<testsuite name="${xmlEscape(suite)}" tests="${tests}" failures="${failures}" time="${time.toFixed(3)}">${body}</testsuite>`
}
