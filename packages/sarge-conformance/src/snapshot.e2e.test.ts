import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { S3Service } from 'sarge-services-s3'
import { DynamoService } from 'sarge-services-dynamo'
import { SnapshotManager, SnapshotOptions } from 'sarge-core'

function tmpRoot() { return fs.mkdtempSync(path.join(os.tmpdir(), 'sarge-snap-')) }

function makeAdapters(dataRoot: string, s3: S3Service, ddb: DynamoService): SnapshotOptions {
  return {
    dataRoot,
    s3: {
      async listBuckets() {
        const s3root = path.join(dataRoot, 's3')
        if (!fs.existsSync(s3root)) return []
        return fs.readdirSync(s3root, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
      },
      async createBucket(name: string) { await s3.createBucket(name) },
      async listObjects(bucket: string) {
        const out = await s3.listObjectsV2(bucket)
        return out.contents.map((o: any) => ({ key: o.key }))
      },
      async getObject(bucket: string, key: string) { const got = await s3.getObject(bucket, key); return { body: got.body, contentType: got.meta.contentType } },
      async putObject(bucket: string, key: string, body: Buffer, contentType?: string) { await s3.putObject(bucket, key, body, contentType) },
    },
    dynamo: {
      async listTables() { const out = await ddb.listTables(); return out.TableNames },
      async describeTable(name: string) { const out = await ddb.describeTable(name); return { TableName: name, KeySchema: out.Table.KeySchema, AttributeDefinitions: out.Table.AttributeDefinitions } },
      async scanAll(name: string) { const out = await ddb.scan({ TableName: name }); return out.Items },
      async createTable(desc: { TableName: string; KeySchema: any; AttributeDefinitions: any }) { await ddb.createTable(desc as any) },
      async putItem(name: string, item: any) { await ddb.putItem({ TableName: name, Item: item }) },
    }
  }
}

describe('Snapshot E2E with S3 and Dynamo', () => {
  it('round-trips data through snapshot', async () => {
    const dataRoot = tmpRoot()
    const s3 = new S3Service({ dataRoot })
    const ddb = new DynamoService({ dataRoot })

    await s3.createBucket('b1')
    await s3.putObject('b1', 'foo.txt', Buffer.from('hello'), 'text/plain')
    await ddb.createTable({ TableName: 'Users', KeySchema: [{ AttributeName: 'pk', KeyType: 'HASH' }], AttributeDefinitions: [{ AttributeName: 'pk', AttributeType: 'S' }] })
    await ddb.putItem({ TableName: 'Users', Item: { pk: { S: 'u1' }, name: { S: 'Ada' } } })

    const mgr = new SnapshotManager(makeAdapters(dataRoot, s3, ddb))
    await mgr.create('snap1')

    // wipe
    fs.rmSync(path.join(dataRoot, 's3'), { recursive: true, force: true })
    fs.rmSync(path.join(dataRoot, 'dynamo'), { recursive: true, force: true })

    // replay
    await mgr.replay('snap1')

    const obj = await s3.getObject('b1', 'foo.txt')
    expect(obj.body.toString()).toBe('hello')
    const row = await ddb.getItem({ TableName: 'Users', Key: { pk: { S: 'u1' } as any } as any })
    expect(row.Item?.name?.S).toBe('Ada')
  })
})
