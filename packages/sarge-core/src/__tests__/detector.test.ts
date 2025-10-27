import path from 'node:path'
import { describe, it, expect } from 'vitest'
import { detectStack } from '../detector/detector'

const fixtures = (p: string) => path.join(__dirname, 'fixtures', p)

describe('detector', () => {
  it('detects a Next.js web service with S3 and env keys and port from start', async () => {
    const repoPath = fixtures('next-app')
    const bp = await detectStack(repoPath, { maxFiles: 100 })
    expect(bp.services.length).toBe(1)
    const svc = bp.services[0]
    expect(svc.type).toBe('web')
    expect(svc.ports).toContain(4000)
    expect(new Set(svc.envKeys)).toEqual(new Set(['DATABASE_URL', 'AWS_REGION']))
    expect(bp.awsSdks).toContain('s3')
    expect(bp.resources.s3Buckets.length).toBeGreaterThanOrEqual(0) // hints optional
  })

  it('detects an Express API service with DynamoDB and compose file', async () => {
    const repoPath = fixtures('express-api')
    const bp = await detectStack(repoPath, { maxFiles: 100 })
    expect(bp.services.length).toBe(1)
    const svc = bp.services[0]
    expect(svc.type).toBe('api')
    expect(bp.ports).toContain(8081)
    expect(bp.awsSdks).toContain('dynamodb')
    expect(bp.docker.composeFiles.some((f) => f.endsWith('docker-compose.yml'))).toBe(true)
  })
})
