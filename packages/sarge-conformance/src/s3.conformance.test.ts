import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from 'sarge-aws-shim/dist/server.js'
import { S3Client, CreateBucketCommand, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, DeleteBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

let port: number
let stop: () => Promise<void>

function endpoint() {
  return `http://127.0.0.1:${port}/s3`
}

function makeClient() {
  return new S3Client({
    region: 'us-east-1',
    endpoint: endpoint(),
    forcePathStyle: true,
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  })
}

beforeAll(async () => {
  process.env.SARGE_AWS_INSECURE = '1'
  const srv = createServer({ insecure: true })
  port = await srv.listen(0)
  stop = () => new Promise((resolve) => srv.server.close(() => resolve()))
})

afterAll(async () => {
  await stop()
})

describe('S3 MVP conformance', () => {
  it('bucket lifecycle + object CRUD + list', async () => {
    const s3 = makeClient()
  const Bucket = `conform-b1-${Date.now().toString(36)}`

    console.log('STEP create-bucket')
    await s3.send(new CreateBucketCommand({ Bucket, ACL: 'private' }))

    const Key1 = 'photos/cat.jpg'
    const Body1 = Buffer.from('hello world')
  console.log('STEP put-object')
  await s3.send(new PutObjectCommand({ Bucket, Key: Key1, Body: Body1, ContentType: 'text/plain', ACL: 'public-read' }))

  console.log('STEP head-object')
  const head = await s3.send(new HeadObjectCommand({ Bucket, Key: Key1 }))
    expect(head.ETag).toBeDefined()
    expect(head.ContentType).toBe('text/plain')

  console.log('STEP get-object')
  const get = await s3.send(new GetObjectCommand({ Bucket, Key: Key1 }))
    const getBuf = Buffer.from(await get.Body!.transformToByteArray())
    expect(getBuf.equals(Body1)).toBe(true)

  console.log('STEP list-objects-v2')
  const list = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: 'photos/', Delimiter: '/' }))
  expect(list.Contents?.map((o: any) => o.Key)).toContain(Key1)
  expect(list.CommonPrefixes?.map((p: any) => p.Prefix)).toContain('photos/')

  console.log('STEP delete-object')
  await s3.send(new DeleteObjectCommand({ Bucket, Key: Key1 }))

    console.log('STEP delete-bucket')
    await s3.send(new DeleteBucketCommand({ Bucket }))
  })
})
