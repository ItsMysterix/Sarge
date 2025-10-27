import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { estimate, CURRENT_PRICING_VERSION } from './index'

function tmpdir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sarge-cost-'))
  return dir
}

describe('cost.estimate', () => {
  it('computes S3 and Dynamo storage costs plus usage hints', () => {
    const root = tmpdir()
    // S3: create bucket with two objects via meta files
    const s3dir = path.join(root, 's3', 'bucket-a', 'folder')
    fs.mkdirSync(s3dir, { recursive: true })
    fs.writeFileSync(path.join(s3dir, 'obj1.meta.json'), JSON.stringify({ size: 2_000_000 })) // 2 MB
    fs.writeFileSync(path.join(s3dir, 'obj2.meta.json'), JSON.stringify({ size: 3_000_000 })) // 3 MB

    // Dynamo: table with two json items
    const ddir = path.join(root, 'dynamo', 'TableA', 'data')
    fs.mkdirSync(ddir, { recursive: true })
    fs.writeFileSync(path.join(ddir, 'item1.json'), JSON.stringify({ id: 1, v: 'x'.repeat(1000) }))
    fs.writeFileSync(path.join(ddir, 'item2.json'), JSON.stringify({ id: 2, v: 'y'.repeat(2000) }))

    const out = estimate({ kind: 'local', dataRoot: root, usage: {
      s3: { putRequests: 2000, getRequests: 3000 },
      dynamo: { readRequests: 500_000, writeRequests: 200_000 },
      lambda: { requests: 1_000_000, gbSeconds: 1000 },
      sqs: { requests: 1_000_000 },
      sns: { requests: 500_000 },
    } })

    expect(out.pricingVersion).toBe(CURRENT_PRICING_VERSION)
    // Assert stable shape
    expect(out).toMatchInlineSnapshot(`
      {
        "breakdown": {
          "dynamo": {
            "requestsUSD": 0.38,
            "storageGB": 0,
            "storageUSD": 0,
          },
          "lambda": {
            "computeUSD": 0.0167,
            "requestsUSD": 0.2,
          },
          "s3": {
            "requestsUSD": 0.01,
            "storageGB": 0.01,
            "storageUSD": 0,
          },
          "sns": {
            "requestsUSD": 0.25,
          },
          "sqs": {
            "requestsUSD": 0.4,
          },
        },
        "pricingVersion": "2025-10-01",
        "totalMonthlyUSD": 1.26,
      }
    `)
  })
})
