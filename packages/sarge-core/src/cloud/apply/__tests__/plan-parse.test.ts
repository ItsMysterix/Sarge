import { describe, it, expect } from 'vitest'
import { parsePlanJson, redactSecrets } from '../index'

const samplePlan = {
  format_version: '1.0',
  resource_changes: [
    { address: 'aws_s3_bucket.bucket_a', change: { actions: ['create'] } },
    { address: 'aws_dynamodb_table.table_x', change: { actions: ['update'] } },
    { address: 'aws_lambda_function.fn1', change: { actions: ['delete'] } },
    { address: 'null_resource.svc_api', change: { actions: ['replace'] } },
  ],
}

describe('cloud.apply plan parsing', () => {
  it('parses actions deterministically', () => {
    const s = parsePlanJson(samplePlan)
    expect(s).toEqual({
      toCreate: ['aws_s3_bucket.bucket_a'],
      toChange: ['aws_dynamodb_table.table_x', 'null_resource.svc_api'],
      toDestroy: ['aws_lambda_function.fn1'],
    })
  })

  it('redacts secrets in log lines', () => {
    const line = 'AWS_SECRET_ACCESS_KEY = abc123 AWS_ACCESS_KEY_ID = AKIA...'
    const redacted = redactSecrets(line)
    expect(redacted).not.toContain('abc123')
    expect(redacted).toContain('AWS_SECRET_ACCESS_KEY = ****')
  })
})
