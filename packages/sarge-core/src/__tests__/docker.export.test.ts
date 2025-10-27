import { describe, it, expect } from 'vitest'
import { exportCompose } from '../docker'
import type { ApplyPlan } from '../planner/schema'
import type { StackBlueprint } from '../detector/schema'
import fs from 'node:fs'
import path from 'node:path'

function makePlan(): ApplyPlan {
  const blueprint: StackBlueprint = {
    services: [
      { name: 'web', type: 'web' as const, cwd: 'web', startCommand: 'node server.cjs', ports: [4010], envKeys: [], health: { http: { path: '/health' } } },
      { name: 'api', type: 'api' as const, cwd: 'api', startCommand: 'node server.cjs', ports: [4011], envKeys: [], health: { http: { path: '/health' } } }
    ],
    resources: {
      s3Buckets: ['uploads'],
      dynamoTables: [{ name: 'items', partitionKey: 'id' }],
      lambdaFunctions: []
    },
    ports: [4010, 4011],
    envKeys: [],
    docker: { dockerfile: false, composeFiles: [] },
    awsSdks: ['s3', 'dynamodb']
  }
  return {
    blueprint,
    assignedPorts: [
      { service: 'web', requested: [4010], assigned: [4010] },
      { service: 'api', requested: [4011], assigned: [4011] }
    ],
    issues: [],
    resourceOps: [],
    serviceOps: [
      { op: 'start', name: 'web', ports: [4010] },
      { op: 'start', name: 'api', ports: [4011] }
    ],
    telemetry: { prometheus: true, cloudwatchLogs: true },
    rollbackPoints: [],
    planText: ''
  }
}

describe('docker export', () => {
  it('renders deterministic docker-compose', () => {
    const plan = makePlan()
  const { yaml } = exportCompose(plan, { write: false })
    const golden = fs.readFileSync(path.join(__dirname, 'fixtures', 'docker-compose.golden.yml'), 'utf8')
    expect(yaml).toEqual(golden)
  })
})
