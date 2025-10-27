import { describe, it, expect } from 'vitest'
import { explainStack, gatherStackContext } from './index'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

describe('explainStack', () => {
  it('generates deterministic markdown from identical inputs', () => {
    const input = {
      stackId: 'test-stack',
      dataRoot: '/tmp/test',
      context: {
        services: [
          { id: 's1', name: 'api', kind: 'lambda', state: 'running', port: 3000 },
          { id: 's2', name: 'worker', kind: 'lambda', state: 'stopped' },
        ],
        resources: [
          { id: 'r1', kind: 's3', name: 'uploads' },
          { id: 'r2', kind: 'dynamo', name: 'users' },
        ],
        health: [
          { service: 'api', healthy: true },
          { service: 'worker', healthy: false, message: 'Service stopped' },
        ],
        errors: [
          { service: 'api', message: 'Connection timeout', timestamp: '2025-10-25T10:00:00Z', count: 5 },
        ],
        costEstimate: {
          totalUSD: 12.5,
          breakdown: { s3: 2.0, dynamo: 5.5, lambda: 5.0 },
        },
        lastDeploy: {
          timestamp: '2025-10-25T09:00:00Z',
          changes: [
            { type: 'added', description: 'Added worker lambda' },
            { type: 'modified', description: 'Updated api handler' },
          ],
        },
      },
    }

    const result1 = explainStack(input)
    const result2 = explainStack(input)

    // Metadata timestamps will differ, but markdown should be identical for same timestamp
    expect(result1.markdown).toBe(result2.markdown)
    expect(result1.metadata.stackId).toBe('test-stack')
    expect(result1.metadata.version).toBe('1.0.0')
  })

  it('includes topology section with services and resources', () => {
    const input = {
      stackId: 'my-stack',
      dataRoot: '/tmp/test',
      context: {
        services: [
          { id: 's1', name: 'api', kind: 'express', state: 'running', port: 8080 },
        ],
        resources: [
          { id: 'r1', kind: 's3', name: 'bucket-a' },
          { id: 'r2', kind: 's3', name: 'bucket-b' },
        ],
      },
    }

    const result = explainStack(input)

    expect(result.markdown).toContain('## Topology')
    expect(result.markdown).toContain('1 service(s)')
    expect(result.markdown).toContain('2 resource(s)')
    expect(result.markdown).toContain('**api**')
    expect(result.markdown).toContain('http://localhost:8080')
    expect(result.markdown).toContain('**s3:** 2')
  })

  it('shows health status with percentage', () => {
    const input = {
      stackId: 'health-test',
      dataRoot: '/tmp/test',
      context: {
        health: [
          { service: 'api', healthy: true },
          { service: 'worker', healthy: true },
          { service: 'cron', healthy: false, message: 'Failed health check' },
        ],
      },
    }

    const result = explainStack(input)

    expect(result.markdown).toContain('## Health')
    expect(result.markdown).toContain('2/3')
    expect(result.markdown).toContain('cron: Failed health check')
  })

  it('lists top errors with counts and links to logs', () => {
    const input = {
      stackId: 'errors-test',
      dataRoot: '/tmp/test',
      context: {
        errors: [
          { service: 'api', message: 'DB connection failed', timestamp: '2025-10-25T10:00:00Z', count: 10 },
          { service: 'worker', message: 'Timeout', timestamp: '2025-10-25T10:01:00Z', count: 3 },
        ],
      },
    }

    const result = explainStack(input)

    expect(result.markdown).toContain('## Top Errors')
    expect(result.markdown).toContain('**api:** DB connection failed (10x)')
    expect(result.markdown).toContain('**worker:** Timeout (3x)')
    expect(result.markdown).toContain('[View all logs](/logs)')
  })

  it('includes cost estimate with breakdown and link', () => {
    const input = {
      stackId: 'cost-test',
      dataRoot: '/tmp/test',
      context: {
        costEstimate: {
          totalUSD: 25.75,
          breakdown: {
            s3: 5.0,
            dynamo: 10.5,
            lambda: 10.25,
          },
        },
      },
    }

    const result = explainStack(input)

    expect(result.markdown).toContain('## Cost Estimate')
    expect(result.markdown).toContain('$25.75/month')
    expect(result.markdown).toContain('dynamo: $10.50')
    expect(result.markdown).toContain('lambda: $10.25')
    expect(result.markdown).toContain('s3: $5.00')
    expect(result.markdown).toContain('[View detailed cost analysis](/settings?tab=cost)')
  })

  it('shows recent changes since last deploy', () => {
    const input = {
      stackId: 'deploy-test',
      dataRoot: '/tmp/test',
      context: {
        lastDeploy: {
          timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // 2h ago
          changes: [
            { type: 'added', description: 'New S3 bucket' },
            { type: 'modified', description: 'Updated lambda runtime' },
            { type: 'removed', description: 'Deleted old table' },
          ],
        },
      },
    }

    const result = explainStack(input)

    expect(result.markdown).toContain('## Recent Changes')
    expect(result.markdown).toContain('2h ago')
    expect(result.markdown).toContain('➕ New S3 bucket')
    expect(result.markdown).toContain('✏️ Updated lambda runtime')
    expect(result.markdown).toContain('➖ Deleted old table')
    expect(result.markdown).toContain('[View deployment history](/deployments)')
  })

  it('handles empty stack gracefully', () => {
    const input = {
      stackId: 'empty-stack',
      dataRoot: '/tmp/test',
      context: {},
    }

    const result = explainStack(input)

    expect(result.markdown).toContain('# Stack: empty-stack')
    expect(result.markdown).toContain('No services or resources detected')
    expect(result.markdown).toContain('No health checks available')
    expect(result.markdown).toContain('Generated locally by Sarge')
  })
})

describe('gatherStackContext', () => {
  it('returns empty context when state file missing', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sarge-test-'))
    const context = await gatherStackContext('test', tmpDir)

    expect(context).toBeDefined()
    expect(context?.services).toEqual([])
    expect(context?.resources).toEqual([])
    expect(context?.health).toEqual([])
    expect(context?.errors).toEqual([])
  })

  it('reads services and resources from state.json', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sarge-test-'))
    const state = {
      workspace: {
        stacks: [
          {
            id: 'test',
            name: 'test',
            services: [{ name: 'api', kind: 'lambda', state: 'running', port: 3000 }],
            resources: [{ name: 'bucket', kind: 's3' }],
          },
        ],
      },
    }
    fs.writeFileSync(path.join(tmpDir, 'state.json'), JSON.stringify(state))

    const context = await gatherStackContext('test', tmpDir, { includeHealth: true })

    expect(context).toBeDefined()
    expect(context?.services).toHaveLength(1)
    expect(context?.services![0].name).toBe('api')
    expect(context?.resources).toHaveLength(1)
    expect(context?.resources![0].name).toBe('bucket')
    expect(context?.health).toHaveLength(1)
    expect(context?.health![0].healthy).toBe(true)
  })

  it('scans logs for errors when includeErrors is true', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sarge-test-'))
    const logsDir = path.join(tmpDir, 'logs')
    fs.mkdirSync(logsDir)
    
    const state = {
      workspace: {
        stacks: [
          {
            id: 'test',
            services: [{ name: 'api', kind: 'lambda', state: 'running' }],
          },
        ],
      },
    }
    fs.writeFileSync(path.join(tmpDir, 'state.json'), JSON.stringify(state))
    fs.writeFileSync(
      path.join(logsDir, 'api.log'),
      'INFO: Starting\nERROR: Connection failed\nERROR: Connection failed\nINFO: Done\n'
    )

    const context = await gatherStackContext('test', tmpDir, { includeErrors: true })

    expect(context).toBeDefined()
    expect(context?.errors!.length).toBeGreaterThan(0)
    expect(context?.errors![0].service).toBe('api')
    expect(context?.errors![0].message).toContain('Connection failed')
    expect(context?.errors![0].count).toBeGreaterThan(1)
  })
})
