import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { configureTracing, startSpan, runInSpan, listTraces, getTrace } from './traces'

let tmpdir: string

beforeAll(() => {
  tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'sarge-traces-'))
  const dataRoot = path.join(tmpdir, 'data')
  fs.mkdirSync(dataRoot, { recursive: true })
  configureTracing({ enabled: true, dataRoot })
})

afterAll(() => {
  try { fs.rmSync(tmpdir, { recursive: true, force: true }) } catch {}
})

describe('traces', () => {
  test('writes and lists a nested trace deterministically', async () => {
    const root = startSpan('root-op', { attributes: { service: 'test' } })
    // child A
    const a = startSpan('child-A', { traceId: root.traceId, parentSpanId: root.spanId })
    a.event('a-start')
    a.end('OK')
    // child B with nested C
    await runInSpan('child-B', async (b) => {
      await new Promise((r) => setTimeout(r, 5))
      b.event('b-mid', { step: 1 })
      runInSpan('child-C', () => { /* sync */ }, { traceId: b.traceId, parentSpanId: b.spanId })
    }, { traceId: root.traceId, parentSpanId: root.spanId })
    root.end('OK')

    const dataRoot = (global as any).undefined ?? path.join(tmpdir, 'data')
    const traces = listTraces(dataRoot)
    expect(traces.length).toBe(1)
    const t = traces[0]
    expect(t.traceId).toBeTruthy()
    expect(t.rootName).toBe('root-op')
  expect(t.spanCount).toBe(4)
    expect(t.durationMs).toBeGreaterThanOrEqual(0)

    const detail = getTrace(dataRoot, t.traceId)!
  expect(detail.spans.length).toBe(4)
  // spans are sorted by start time; verify membership (ordering may tie at ms granularity)
  const names = detail.spans.map((s) => s.name)
  expect(names).toContain('root-op')
  expect(names).toContain('child-A')
  expect(names).toContain('child-B')
  expect(names).toContain('child-C')
  // parentage retained for B/C (B and C are not at fixed indices due to timing jitter)
  const spanB = detail.spans.find((s) => s.name === 'child-B')!
  const spanC = detail.spans.find((s) => s.name === 'child-C')!
  expect(spanB.parentSpanId).toBe(root.spanId)
  expect(spanC.parentSpanId).toBe(spanB.spanId)
  })
})
