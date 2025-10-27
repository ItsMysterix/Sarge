import { describe, it, expect } from 'vitest'
import * as path from 'path'
import * as fs from 'fs'
import { generateTerraformJson, exportTerraform } from '../terraform'
import { StackBlueprint } from '../../detector/schema'

function readFixture(p: string) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../../__tests__/fixtures', p), 'utf8'))
}

describe('terraform exporter', () => {
  const bp: StackBlueprint = {
    services: [
      { name: 'web', type: 'web', ports: [3000], envKeys: [], startCommand: 'next dev' },
      { name: 'api', type: 'api', ports: [3001], envKeys: [], startCommand: 'node server.js' },
    ],
    resources: {
      s3Buckets: ['uploads', 'assets'],
      dynamoTables: [
        { name: 'users', partitionKey: 'id' },
        { name: 'events', partitionKey: 'pk', sortKey: 'sk' },
      ],
      lambdaFunctions: [
        { name: 'img-resize', handler: 'index.handler', runtime: 'nodejs20.x' },
      ],
    },
    ports: [],
    envKeys: [],
    docker: { dockerfile: false, composeFiles: [] },
    awsSdks: ['s3', 'dynamodb', 'lambda']
  }

  it('generates deterministic JSON objects', () => {
    const out = generateTerraformJson(bp, 'us-east-1')
    expect(out.provider).toEqual(readFixture('terraform/providers.tf.golden.json'))
    expect(out.s3).toEqual(readFixture('terraform/s3.tf.golden.json'))
    expect(out.dynamo).toEqual(readFixture('terraform/dynamo.tf.golden.json'))
    expect(out.lambda).toEqual(readFixture('terraform/lambda.tf.golden.json'))
    expect(out.services).toEqual(readFixture('terraform/services.tf.golden.json'))
  })

  it('writes deterministic files', async () => {
    const tmp = fs.mkdtempSync(path.join(process.cwd(), '.vitest-tf-'))
    const res = await exportTerraform(bp, { outDir: tmp, region: 'us-east-1' })
    const names = res.files.map((f) => path.basename(f)).sort()
    expect(names).toEqual(['dynamo.tf.json','lambda.tf.json','providers.tf.json','s3.tf.json','services.tf.json'])
    // Compare file contents against goldens
    for (const f of res.files) {
      const base = path.basename(f).replace(/\.tf\.json$/, '.tf.golden.json')
      const got = JSON.parse(fs.readFileSync(f, 'utf8'))
      const exp = readFixture(path.join('terraform', base))
      expect(got).toEqual(exp)
    }
  })
})
