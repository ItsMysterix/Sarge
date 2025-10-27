import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { describe, it, expect } from 'vitest'
import { planApply } from '../planner/planner'
import { apply } from '../apply'
import type { StackBlueprint } from '../detector/schema'

const repoRoot = path.join(__dirname, 'fixtures', 'services')

function tmpDataRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sarge-core-apply-'))
}

function mkBlueprint(crash = false): StackBlueprint {
  return {
    services: [
      { name: 'api', type: 'api', cwd: crash ? 'bad' : 'api', startCommand: 'node server.cjs', ports: [4021], envKeys: ['API_KEY'], health: { http: { path: '/health' } } }
    ],
    resources: { s3Buckets: [], dynamoTables: [], lambdaFunctions: [] },
    ports: [4021],
    envKeys: ['API_KEY'],
    docker: { dockerfile: false, composeFiles: [] },
    awsSdks: []
  }
}

describe('apply failure modes & rollback', () => {
  it('records history and returns structured error with hints on crash', async () => {
    const bp = mkBlueprint(true)
    const plan = planApply(bp, undefined, { providedEnv: { API_KEY: 'x' } })
    const dataRoot = tmpDataRoot()
    const result = await apply(plan, { repoPath: repoRoot, dataRoot, serviceStartTimeoutMs: 1000 })
    expect(result.ok).toBe(false)
    // structured error present
    const err = result.errors[0] as any
    expect(err.category).toBe('runtime')
  expect(err.hints === undefined || Array.isArray(err.hints)).toBe(true)
    // history recorded
    const historyPath = path.join(dataRoot, 'history.jsonl')
    const lines = fs.readFileSync(historyPath, 'utf8').trim().split(/\n/)
    const last = JSON.parse(lines[lines.length - 1])
    expect(last.ok).toBe(false)
    expect(Array.isArray(last.errors)).toBe(true)
  })

  it('creates pre-apply snapshot and replays on failure', async () => {
    const bp = mkBlueprint(true)
    const plan = planApply(bp, undefined, { providedEnv: { API_KEY: 'x' } })
    const dataRoot = tmpDataRoot()
    const calls: string[] = []
    const mgr = {
      create: async (name: string) => { calls.push(`create:${name}`) },
      replay: async (name: string) => { calls.push(`replay:${name}`) }
    } as any
    const result = await apply(plan, { repoPath: repoRoot, dataRoot, serviceStartTimeoutMs: 800, snapshot: { manager: mgr } })
    expect(result.ok).toBe(false)
    // verify snapshot create and replay were called
    expect(calls.some((c) => c.startsWith('create:'))).toBe(true)
    expect(calls.some((c) => c.startsWith('replay:'))).toBe(true)
  })

  it('fails early on missing env with planner category and records history', async () => {
    const bp: StackBlueprint = {
      services: [ { name: 'api', type: 'api', cwd: 'api', startCommand: 'node server.cjs', ports: [4022], envKeys: ['NEEDED'], health: { http: { path: '/health' } } } ],
      resources: { s3Buckets: [], dynamoTables: [], lambdaFunctions: [] },
      ports: [4022],
      envKeys: ['NEEDED'],
      docker: { dockerfile: false, composeFiles: [] },
      awsSdks: []
    }
    const plan = planApply(bp, undefined, { providedEnv: {} })
    const dataRoot = tmpDataRoot()
    const res = await apply(plan, { repoPath: repoRoot, dataRoot, serviceStartTimeoutMs: 500 })
    expect(res.ok).toBe(false)
    const err = res.errors[0] as any
    expect(err.category).toBe('planner')
    const historyPath = path.join(dataRoot, 'history.jsonl')
    const last = JSON.parse(fs.readFileSync(historyPath, 'utf8').trim().split(/\n/).pop()!)
    expect(last.ok).toBe(false)
  })

  it('fails early when HTTP service has no assigned port', async () => {
    const bp: StackBlueprint = {
      services: [ { name: 'web', type: 'web', cwd: 'web', startCommand: 'node server.cjs', ports: [], envKeys: [], health: { http: { path: '/health' } } } ],
      resources: { s3Buckets: [], dynamoTables: [], lambdaFunctions: [] },
      ports: [],
      envKeys: [],
      docker: { dockerfile: false, composeFiles: [] },
      awsSdks: []
    }
    const plan = planApply(bp)
    const dataRoot = tmpDataRoot()
    const res = await apply(plan, { repoPath: repoRoot, dataRoot, serviceStartTimeoutMs: 500 })
    expect(res.ok).toBe(false)
    const err = res.errors[0] as any
    expect(err.category).toBe('planner')
  })
})
