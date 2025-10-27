import { describe, it, expect } from 'vitest'
import { planApply } from '../planner/planner'
import type { StackBlueprint } from '../detector/schema'

const bpBase: StackBlueprint = {
  services: [
    { name: 'web', type: 'web', ports: [3000], envKeys: ['API_KEY'] },
    { name: 'api', type: 'api', ports: [3000], envKeys: ['DATABASE_URL'] }
  ],
  resources: { s3Buckets: ['assets'], dynamoTables: [{ name: 'users', partitionKey: 'pk' }], lambdaFunctions: [] },
  ports: [3000],
  envKeys: ['API_KEY', 'DATABASE_URL'],
  docker: { dockerfile: true, composeFiles: [] },
  awsSdks: ['s3', 'dynamodb']
}

describe('planner.planApply', () => {
  it('resolves port conflicts by assigning next free port and reports issues', () => {
  const plan = planApply(bpBase, { services: [], resources: { s3Buckets: [], dynamoTables: [], lambdaFunctions: [] } }, { basePort: 3000, reservedPorts: [3200] })
    const web = plan.assignedPorts.find((a: { service: string }) => a.service === 'web')!
    const api = plan.assignedPorts.find((a: { service: string }) => a.service === 'api')!
    expect(web.assigned[0]).toBe(3000)
    expect(api.assigned[0]).toBe(3001)
    expect(plan.issues.some((i: any) => i.kind === 'port-conflict')).toBe(true)
  })

  it('detects missing env keys with service mapping', () => {
  const plan = planApply(bpBase, undefined, { providedEnv: { DATABASE_URL: 'postgres://local' } })
  const missing = plan.issues.filter((i: any) => i.kind === 'missing-env') as any[]
    const keys = missing.map((m) => m.key)
    expect(keys).toContain('API_KEY')
    expect(keys).not.toContain('DATABASE_URL')
  })

  it('is idempotent when current equals blueprint (no ops)', () => {
  const current = { services: [ { name: 'web', type: 'web' as const, ports: [3000], env: {} }, { name: 'api', type: 'api' as const, ports: [3001], env: {} } ], resources: { s3Buckets: ['assets'], dynamoTables: [{ name: 'users', partitionKey: 'pk' }], lambdaFunctions: [] } }
  const plan = planApply(bpBase, current, { basePort: 3000 })
    expect(plan.resourceOps.length).toBe(0)
    // services should not require start/restart/stop when ports already match assignments
    expect(plan.serviceOps.length).toBe(0)
  })
})
