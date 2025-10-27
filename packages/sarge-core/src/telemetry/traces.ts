import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export type SpanStatus = 'OK' | 'ERROR'

export type SpanEvent = {
  name: string
  timeUnixMs: number
  attributes?: Record<string, any>
}

export type SpanRecord = {
  traceId: string
  spanId: string
  parentSpanId?: string
  name: string
  startTimeUnixMs: number
  endTimeUnixMs: number
  attributes?: Record<string, any>
  status?: SpanStatus
  events?: SpanEvent[]
}

export type TraceHeader = {
  type: 'trace'
  traceId: string
  rootName: string
  startTimeUnixMs: number
}

export type TraceSummary = {
  traceId: string
  rootName: string
  startTimeUnixMs: number
  durationMs: number
  spanCount: number
}

export type TraceDetail = {
  summary: TraceSummary
  spans: SpanRecord[]
}

export type TracingConfig = {
  enabled: boolean
  dataRoot: string
}

let globalConfig: TracingConfig | null = null

export function configureTracing(cfg: TracingConfig) {
  globalConfig = cfg
  if (cfg.enabled) ensureDir(path.join(cfg.dataRoot, 'traces'))
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
}

function traceFile(dataRoot: string, traceId: string) {
  return path.join(dataRoot, 'traces', `${traceId}.jsonl`)
}

export type StartSpanOptions = {
  traceId?: string
  parentSpanId?: string
  attributes?: Record<string, any>
}

export type ActiveSpan = {
  traceId: string
  spanId: string
  parentSpanId?: string
  name: string
  startTimeUnixMs: number
  attributes?: Record<string, any>
  end: (status?: SpanStatus, moreAttributes?: Record<string, any>) => void
  event: (name: string, attributes?: Record<string, any>) => void
}

export function startSpan(name: string, opts?: StartSpanOptions): ActiveSpan {
  if (!globalConfig || !globalConfig.enabled) {
    // return a no-op span
    const now = Date.now()
    let ended = false
    return {
      traceId: opts?.traceId ?? crypto.randomUUID().replace(/-/g, ''),
      spanId: crypto.randomUUID().replace(/-/g, ''),
      parentSpanId: opts?.parentSpanId,
      name,
      startTimeUnixMs: now,
      attributes: opts?.attributes,
      end: () => { ended = true },
      event: () => { /* no-op */ },
    }
  }
  const { dataRoot } = globalConfig
  const traceId = opts?.traceId ?? crypto.randomUUID().replace(/-/g, '')
  const spanId = crypto.randomUUID().replace(/-/g, '')
  const startTimeUnixMs = Date.now()
  const rec: Omit<SpanRecord, 'endTimeUnixMs'> = {
    traceId,
    spanId,
    parentSpanId: opts?.parentSpanId,
    name,
    startTimeUnixMs,
    attributes: opts?.attributes,
  }
  const file = traceFile(dataRoot, traceId)
  if (!fs.existsSync(file)) {
    // first write a header line
    const header: TraceHeader = { type: 'trace', traceId, rootName: name, startTimeUnixMs }
    ensureDir(path.dirname(file))
    fs.writeFileSync(file, JSON.stringify(header) + '\n')
  }
  const events: SpanEvent[] = []
  return {
    traceId,
    spanId,
    parentSpanId: rec.parentSpanId,
    name,
    startTimeUnixMs,
    attributes: rec.attributes,
    end: (status?: SpanStatus, moreAttributes?: Record<string, any>) => {
      const endTimeUnixMs = Date.now()
      const out: SpanRecord = { ...rec, endTimeUnixMs, status, attributes: { ...(rec.attributes ?? {}), ...(moreAttributes ?? {}) }, events }
      fs.appendFileSync(file, JSON.stringify(out) + '\n')
    },
    event: (ename: string, attributes?: Record<string, any>) => {
      events.push({ name: ename, timeUnixMs: Date.now(), attributes })
    },
  }
}

export function runInSpan<T>(name: string, fn: (span: ActiveSpan) => Promise<T> | T, opts?: StartSpanOptions): Promise<T> | T {
  const span = startSpan(name, opts)
  try {
    const r = fn(span)
    if (r && typeof (r as any).then === 'function') {
      return (r as Promise<T>)
        .then((v) => { span.end('OK'); return v })
        .catch((e) => { span.end('ERROR', { error: serializeError(e) }); throw e })
    }
    span.end('OK')
    return r as T
  } catch (e) {
    span.end('ERROR', { error: serializeError(e) })
    throw e
  }
}

function serializeError(e: unknown) {
  if (!e || typeof e !== 'object') return { message: String(e) }
  const any = e as any
  return { name: any.name ?? 'Error', message: any.message ?? String(e), stack: any.stack }
}

export function listTraces(dataRoot: string, limit = 50): TraceSummary[] {
  const dir = path.join(dataRoot, 'traces')
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl'))
  const out: TraceSummary[] = []
  for (const f of files) {
    const p = path.join(dir, f)
    const lines = readLines(p, 3, true) // first + last two
    const header = lines.first?.trim()
    const last = lines.last?.trim()
    if (!header) continue
    try {
      const h = JSON.parse(header) as TraceHeader
      if (h.type !== 'trace') continue
      const spanCount = Math.max(0, (lines.totalLines ?? 1) - 1)
      let durationMs = 0
      if (last) {
        try {
          const lastObj = JSON.parse(last) as SpanRecord
          durationMs = Math.max(0, (lastObj.endTimeUnixMs ?? h.startTimeUnixMs) - h.startTimeUnixMs)
        } catch {}
      }
      out.push({ traceId: h.traceId, rootName: h.rootName, startTimeUnixMs: h.startTimeUnixMs, durationMs, spanCount })
    } catch {}
  }
  out.sort((a, b) => b.startTimeUnixMs - a.startTimeUnixMs)
  return out.slice(0, limit)
}

export function getTrace(dataRoot: string, traceId: string): TraceDetail | null {
  const file = traceFile(dataRoot, traceId)
  if (!fs.existsSync(file)) return null
  const content = fs.readFileSync(file, 'utf-8')
  const lines = content.trim().split('\n')
  if (lines.length === 0) return null
  const header = JSON.parse(lines[0]) as TraceHeader
  const spans: SpanRecord[] = []
  for (let i = 1; i < lines.length; i++) {
    try {
      const rec = JSON.parse(lines[i]) as SpanRecord
      spans.push(rec)
    } catch {}
  }
  spans.sort((a, b) => a.startTimeUnixMs - b.startTimeUnixMs)
  const lastEnd = spans.reduce((acc, s) => Math.max(acc, s.endTimeUnixMs), header.startTimeUnixMs)
  const summary: TraceSummary = {
    traceId: header.traceId,
    rootName: header.rootName,
    startTimeUnixMs: header.startTimeUnixMs,
    durationMs: Math.max(0, lastEnd - header.startTimeUnixMs),
    spanCount: spans.length,
  }
  return { summary, spans }
}

function readLines(filePath: string, keepEnds = 2, alsoCount = false): { first?: string; last?: string; totalLines?: number } {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.trim().split('\n')
    const obj: { first?: string; last?: string; totalLines?: number } = {}
    obj.first = lines[0]
    if (keepEnds >= 2) obj.last = lines[lines.length - 1]
    if (alsoCount) obj.totalLines = lines.length
    return obj
  } catch {
    return {}
  }
}

// Minimal OTLP JSON exporter stub (optional future: forward to Tempo)
export function exportAsOtlpJson(detail: TraceDetail) {
  // Shape compatible with OTLP JSON is complex; we keep a minimal mapping useful for local viewers
  return {
    resourceSpans: [
      {
        scopeSpans: [
          {
            spans: detail.spans.map((s) => ({
              traceId: s.traceId,
              spanId: s.spanId,
              parentSpanId: s.parentSpanId,
              name: s.name,
              startTimeUnixNano: BigInt(s.startTimeUnixMs) * BigInt(1_000_000),
              endTimeUnixNano: BigInt(s.endTimeUnixMs) * BigInt(1_000_000),
              attributes: toOtelAttributes(s.attributes),
              events: (s.events ?? []).map((e) => ({
                name: e.name,
                timeUnixNano: BigInt(e.timeUnixMs) * BigInt(1_000_000),
                attributes: toOtelAttributes(e.attributes),
              })),
              status: s.status ? { code: s.status === 'OK' ? 'STATUS_CODE_OK' : 'STATUS_CODE_ERROR' } : undefined,
            })),
          },
        ],
      },
    ],
  }
}

function toOtelAttributes(obj?: Record<string, any>) {
  if (!obj) return []
  const out: Array<{ key: string; value: any }> = []
  for (const [k, v] of Object.entries(obj)) out.push({ key: k, value: v })
  return out
}
