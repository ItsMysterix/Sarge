import * as fs from 'fs'
import * as path from 'path'

export interface SnapshotOptions {
  dataRoot: string
  s3?: S3Adapter
  dynamo?: DynamoAdapter
  lambda?: LambdaAdapter
  logs?: LogsAdapter
  metrics?: MetricsAdapter
}

export interface S3Adapter {
  listBuckets(): Promise<string[]>
  listObjects(bucket: string): Promise<{ key: string }[]>
  getObject(bucket: string, key: string): Promise<{ body: Buffer; contentType?: string }>
  putObject(bucket: string, key: string, body: Buffer, contentType?: string): Promise<void>
  createBucket(name: string): Promise<void>
}

export interface DynamoAdapter {
  listTables(): Promise<string[]>
  describeTable(name: string): Promise<{ TableName: string; KeySchema: any; AttributeDefinitions: any }>
  scanAll(name: string): Promise<any[]>
  createTable(desc: { TableName: string; KeySchema: any; AttributeDefinitions: any }): Promise<void>
  putItem(name: string, item: any): Promise<void>
}

export interface LambdaAdapter {
  listFunctions(): Promise<Array<{ functionName: string; codeHash: string }>>
}

export interface LogsAdapter {
  getWindow(startTime: number, endTime: number): Promise<Array<{ timestamp: number; message: string }>>
}

export interface MetricsAdapter {
  scrape(): Promise<string>
}

export interface SnapshotSpec {
  name: string
  createdAt: string
  s3?: {
    buckets: Array<{ name: string; objects: Array<{ key: string; contentType?: string; bodyB64: string }> }>
  }
  dynamo?: {
    tables: Array<{ name: string; schema: { KeySchema: any; AttributeDefinitions: any }; items: any[] }>
  }
  lambda?: {
    functions: Array<{ functionName: string; codeHash: string }>
  }
  logs?: { startTime: number; endTime: number; events: Array<{ timestamp: number; message: string }> }
  metrics?: { scrape: string }
}

export class SnapshotManager {
  private opts: SnapshotOptions
  private root: string
  constructor(opts: SnapshotOptions) {
    this.opts = opts
    this.root = path.join(opts.dataRoot, 'snapshots')
    fs.mkdirSync(this.root, { recursive: true })
  }

  async create(name: string, windowMs = 5 * 60 * 1000): Promise<SnapshotSpec> {
    const spec: SnapshotSpec = { name, createdAt: new Date().toISOString() }
    // S3
    if (this.opts.s3) {
      const buckets = await this.opts.s3.listBuckets()
      const bSpecs: Array<{ name: string; objects: Array<{ key: string; contentType?: string; bodyB64: string }> }> = []
      for (const b of buckets) {
        const objs = await this.opts.s3.listObjects(b)
        const oSpecs: Array<{ key: string; contentType?: string; bodyB64: string }> = []
        for (const o of objs) {
          const got = await this.opts.s3.getObject(b, o.key)
          oSpecs.push({ key: o.key, contentType: got.contentType, bodyB64: got.body.toString('base64') })
        }
        bSpecs.push({ name: b, objects: oSpecs })
      }
      spec.s3 = { buckets: bSpecs }
    }
    // Dynamo
    if (this.opts.dynamo) {
      const names = await this.opts.dynamo.listTables()
      const tables: Array<{ name: string; schema: { KeySchema: any; AttributeDefinitions: any }; items: any[] }> = []
      for (const t of names) {
        const desc = await this.opts.dynamo.describeTable(t)
        const items = await this.opts.dynamo.scanAll(t)
        tables.push({ name: t, schema: { KeySchema: desc.KeySchema, AttributeDefinitions: desc.AttributeDefinitions }, items })
      }
      spec.dynamo = { tables }
    }
    // Lambda
    if (this.opts.lambda) {
      const fns = await this.opts.lambda.listFunctions()
      spec.lambda = { functions: fns }
    }
    // Logs window (last windowMs)
    if (this.opts.logs) {
      const end = Date.now()
      const start = end - windowMs
      const events = await this.opts.logs.getWindow(start, end)
      spec.logs = { startTime: start, endTime: end, events }
    }
    // Metrics scrape
    if (this.opts.metrics) {
      const scrape = await this.opts.metrics.scrape()
      spec.metrics = { scrape }
    }
    this.writeSpec(spec)
    return spec
  }

  async replay(name: string): Promise<void> {
    const spec = this.readSpec(name)
    // Restore S3
    if (spec.s3 && this.opts.s3) {
      for (const b of spec.s3.buckets) {
        await this.opts.s3.createBucket(b.name)
        for (const o of b.objects) {
          await this.opts.s3.putObject(b.name, o.key, Buffer.from(o.bodyB64, 'base64'), o.contentType)
        }
      }
    }
    // Restore Dynamo
    if (spec.dynamo && this.opts.dynamo) {
      for (const t of spec.dynamo.tables) {
        await this.opts.dynamo.createTable({ TableName: t.name, KeySchema: t.schema.KeySchema, AttributeDefinitions: t.schema.AttributeDefinitions })
        for (const it of t.items) await this.opts.dynamo.putItem(t.name, it)
      }
    }
  }

  private specPath(name: string) { return path.join(this.root, `${safe(name)}.json`) }
  private writeSpec(spec: SnapshotSpec) { fs.writeFileSync(this.specPath(spec.name), JSON.stringify(spec, null, 2)) }
  private readSpec(name: string): SnapshotSpec { return JSON.parse(fs.readFileSync(this.specPath(name), 'utf-8')) as SnapshotSpec }
}

function safe(s: string): string { return s.replace(/[^a-zA-Z0-9._-]/g, '_') }
