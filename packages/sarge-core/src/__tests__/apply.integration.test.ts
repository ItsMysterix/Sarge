import path from 'node:path'
import { describe, it, expect } from 'vitest'
import { planApply } from '../planner/planner'
import { apply } from '../apply'
import type { StackBlueprint } from '../detector/schema'

const repoRoot = path.join(__dirname, 'fixtures', 'services')

function mkBlueprint(): StackBlueprint {
  return {
    services: [
      { name: 'web', type: 'web', cwd: 'web', startCommand: 'node server.cjs', ports: [4010], envKeys: [], health: { http: { path: '/health' } } },
      { name: 'api', type: 'api', cwd: 'api', startCommand: 'node server.cjs', ports: [4011], envKeys: [], health: { http: { path: '/health' } } }
    ],
    resources: { s3Buckets: [], dynamoTables: [], lambdaFunctions: [] },
    ports: [4010, 4011],
    envKeys: [],
    docker: { dockerfile: false, composeFiles: [] },
    awsSdks: []
  }
}

describe('apply engine (node/js)', () => {
  it('starts two services and shuts down gracefully', async () => {
    const bp = mkBlueprint()
    const plan = planApply(bp, { services: [], resources: { s3Buckets: [], dynamoTables: [], lambdaFunctions: [] } })
    // debug
    // eslint-disable-next-line no-console
    console.log('serviceOps', plan.serviceOps)
  const result = await apply(plan, { repoPath: repoRoot, serviceStartTimeoutMs: 5000 })
  // eslint-disable-next-line no-console
    if (!result.ok) {
      console.log('apply errors:', result.errors)
      try {
        const fs = await import('node:fs')
        const log = fs.readFileSync(path.join(process.cwd(), 'data/sarge/logs/web.log'), 'utf8')
        console.log('web.log tail:', log.split('\n').slice(-5).join('\n'))
      } catch {}
    }
    expect(result.ok).toBe(true)
    expect(result.startedServices).toEqual(['web', 'api'])
    await result.stop()
  })

  it('rolls back when a service fails to start', async () => {
    const bp = mkBlueprint()
    // replace api to bad
  bp.services[1] = { ...bp.services[1], cwd: 'bad', startCommand: 'node server.cjs', ports: [4012], health: { http: { path: '/health' } } }
    const plan = planApply(bp)
    const result = await apply(plan, { repoPath: repoRoot, serviceStartTimeoutMs: 1500 })
    expect(result.ok).toBe(false)
    expect(result.startedServices).toEqual([])
  })
})
