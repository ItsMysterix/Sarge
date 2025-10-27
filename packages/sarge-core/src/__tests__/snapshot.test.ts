import { describe, it, expect } from 'vitest'
import { SnapshotManager, SnapshotOptions } from '../snapshot/index'

function makeTmpRoot() {
  const os = require('os') as typeof import('os')
  const fs = require('fs') as typeof import('fs')
  const path = require('path') as typeof import('path')
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sarge-snap-'))
  return dir
}

describe('SnapshotManager basic', () => {
  it('captures and replays via adapters', async () => {
    const dataRoot = makeTmpRoot()
    const s3Store = new Map<string, Buffer>()
    const dynamoRows: any[] = []
    const opts: SnapshotOptions = {
      dataRoot,
      s3: {
        async listBuckets() { return ['b1'] },
        async createBucket() {},
        async listObjects(bucket: string) { return bucket === 'b1' ? [{ key: 'k1' }] as any : [] },
        async getObject() { return { body: Buffer.from('hello'), contentType: 'text/plain' } },
        async putObject(bucket, key, body) { s3Store.set(`${bucket}/${key}`, body) },
      },
      dynamo: {
        async listTables() { return ['T1'] },
        async describeTable(name: string) { return { TableName: name, KeySchema: [{ AttributeName: 'pk', KeyType: 'HASH' }], AttributeDefinitions: [{ AttributeName: 'pk', AttributeType: 'S' }] } },
        async scanAll() { return [{ pk: { S: 'a' }, v: { N: '1' } }] },
        async createTable() {},
        async putItem(_name: string, item: any) { dynamoRows.push(item) },
      },
    }
    const mgr = new SnapshotManager(opts)
    await mgr.create('snap1')
    await mgr.replay('snap1')
    expect(s3Store.get('b1/k1')?.toString()).toBe('hello')
    expect(dynamoRows.length).toBe(1)
  })
})
