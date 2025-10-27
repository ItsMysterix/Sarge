import { router, publicProcedure } from "../../trpc"
import { secureProcedure } from "../trpc/middlewares/security"
import { z } from "zod"
import createBufferedSubscription from "../lib/realtime"
import { TRPCError } from "@trpc/server"
import { metricsRouter } from "./metrics"
import { logsRouter } from "./logs"
import { deployRouter } from "./deploy"
import { oneclickRouter } from "./oneclick"
import { servicesRouter as legacyServicesRouter } from "./services"
import * as fs from 'fs'
import * as path from 'path'
async function getCore(): Promise<any> {
  try { return require('sarge-core') } catch (e: any) {
    if ((globalThis as any).__sargeCoreMock) return (globalThis as any).__sargeCoreMock
    if (e?.code === 'ERR_REQUIRE_ESM') {
      const mod = await import('sarge-core')
      return mod
    }
    throw e
  }
}
// Avoid hard dependency on workspace packages in test builds
// We'll soft-require inside factories

// Schemas
const SnapshotCreateInput = z.object({
  label: z.string().min(1),
  description: z.string().optional(),
})

const SnapshotReplayInput = z.object({ id: z.string().min(1) })

const StackIdInput = z.object({ id: z.string().min(1) })
const StackCreateInput = z.object({
  name: z.string().min(1),
  services: z.array(z.object({ id: z.string().min(1) })).default([]),
})
const StackApplyInput = z.object({
  name: z.string().min(1),
  compose: z.array(z.object({ id: z.string().min(1) })).default([]),
})

const ServiceIdInput = z.object({ id: z.string().min(1) })
const ServiceLogsTailInput = z.object({ id: z.string().min(1) })

const ResourceSearchInput = z.object({
  q: z.string().min(1),
  kinds: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(1000).optional(),
})

// AWS shapes
const S3ListObjectsInput = z.object({
  bucket: z.string().min(1),
  prefix: z.string().optional(),
  maxKeys: z.number().int().positive().max(1000).optional(),
  continuationToken: z.string().optional(),
})
const S3PutObjectInput = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  content: z.union([z.string(), z.instanceof(Uint8Array)]),
  contentType: z.string().optional(),
})
const S3GetObjectInput = z.object({ bucket: z.string().min(1), key: z.string().min(1) })
const S3DeleteObjectInput = z.object({ bucket: z.string().min(1), key: z.string().min(1) })

const DynamoCreateTableInput = z.object({
  tableName: z.string().min(1),
  keySchema: z.array(z.object({ attributeName: z.string(), keyType: z.enum(["HASH","RANGE"]) })).min(1),
  attributeDefinitions: z.array(z.object({ attributeName: z.string(), attributeType: z.enum(["S","N","B"]) })).min(1),
  billingMode: z.enum(["PAY_PER_REQUEST","PROVISIONED"]).default("PAY_PER_REQUEST"),
})
const DynamoKeyInput = z.object({ tableName: z.string().min(1), key: z.record(z.string(), z.any()) })
const DynamoPutItemInput = z.object({ tableName: z.string().min(1), item: z.record(z.string(), z.any()) })
const DynamoQueryInput = z.object({ tableName: z.string().min(1), keyCondition: z.string().min(1), limit: z.number().int().positive().max(1000).optional() })
const DynamoScanInput = z.object({ tableName: z.string().min(1), limit: z.number().int().positive().max(1000).optional() })

const LambdaInvokeInput = z.object({ functionName: z.string().min(1), payload: z.any().optional(), qualifier: z.string().optional() })
const LambdaCreateFunctionInput = z.object({
  functionName: z.string().min(1),
  runtime: z.string().min(1),
  handler: z.string().min(1),
  code: z.object({ zipBase64: z.string().min(1) }),
})
const LambdaUpdateCodeInput = z.object({ functionName: z.string().min(1), code: z.object({ zipBase64: z.string().min(1) }) })

function notImplemented(): never {
  throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'Operation not implemented in current build' })
}

export const sargeRouter = router({
  workspace: router({
    status: secureProcedure('sarge.workspace.status').query(async () => {
      return {
        id: 'default',
        name: 'default',
        stacks: 0,
        services: 0,
        telemetry: { logs: { structuredJson: true }, metrics: { prometheusExport: true } },
        dataRoot: 'data/sarge/workspaces/default',
      }
    }),
    health: secureProcedure('sarge.workspace.health').query(async () => ({ healthy: true })),
    snapshots: router({
      create: secureProcedure('sarge.workspace.snapshots.create').input(SnapshotCreateInput).mutation(async ({ input }) => {
        const dataRoot = getDataRoot()
        const mgr = await makeSnapshotManager(dataRoot)
        const spec = await mgr.create(input.label)
        return { id: input.label, label: input.label, description: input.description ?? null, createdAt: spec.createdAt }
      }),
      list: secureProcedure('sarge.workspace.snapshots.list').query(async () => {
        const dataRoot = getDataRoot()
        const dir = path.join(dataRoot, 'snapshots')
        const items: Array<{ id: string; createdAt: string }> = []
        if (fs.existsSync(dir)) {
          for (const f of fs.readdirSync(dir)) {
            if (!f.endsWith('.json')) continue
            const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as { name: string; createdAt: string }
            items.push({ id: raw.name, createdAt: raw.createdAt })
          }
        }
        items.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        return { items }
      }),
      replay: secureProcedure('sarge.workspace.snapshots.replay').input(SnapshotReplayInput).mutation(async ({ input }) => {
        const dataRoot = getDataRoot()
        const mgr = await makeSnapshotManager(dataRoot)
        await mgr.replay(input.id)
        return { ok: true }
      }),
    }),
  }),

  stacks: router({
      license: router({
        status: secureProcedure('sarge.license.status').query(async () => {
          async function getCore(): Promise<any> {
            try { return require('sarge-core') } catch (e: any) {
              if (e?.code === 'ERR_REQUIRE_ESM') {
                const mod = await import('sarge-core'); return mod
              }
              throw e
            }
          }
          const core = await getCore()
          const base = process.env.SARGE_DATA_DIR ? require('path').resolve(process.cwd(), process.env.SARGE_DATA_DIR) : require('path').resolve(process.cwd(), 'data/sarge/workspaces/default')
          const st = core?.licensing?.getStatus?.({ dataRoot: base }) ?? { edition: 'community', features: { teamSpaces: false, cloudApply: false }, valid: true, expired: false, inGrace: false, messages: ['Community edition'] }
          return st
        })
      }),
    list: secureProcedure('sarge.stacks.list').query(async () => ([] as any[])),
    create: secureProcedure('sarge.stacks.create').input(StackCreateInput).mutation(async ({ input }) => ({ id: `stk_${Date.now()}`, name: input.name })),
    delete: secureProcedure('sarge.stacks.delete').input(StackIdInput).mutation(async () => ({ ok: true })),
    apply: secureProcedure('sarge.stacks.apply').input(StackApplyInput).mutation(async ({ input }) => ({ id: `stk_${Date.now()}`, name: input.name, composed: input.compose.map(s => s.id) })),
  }),

  services: router({
    list: secureProcedure('sarge.services.list').query(async () => ([] as any[])),
    enable: secureProcedure('sarge.services.enable').input(ServiceIdInput).mutation(async () => ({ ok: false, reason: 'not_implemented' })),
    disable: secureProcedure('sarge.services.disable').input(ServiceIdInput).mutation(async () => ({ ok: false, reason: 'not_implemented' })),
    inspect: secureProcedure('sarge.services.inspect').input(ServiceIdInput).query(async ({ input }) => ({ id: input.id, state: 'init' })),
    logs: router({
      tail: secureProcedure('sarge.services.logs.tail').input(ServiceLogsTailInput).subscription(({ input, ctx }) => {
        return createBufferedSubscription(ctx.ee, { topics: [`serviceLogs:${input.id}`], bufferSize: 200, perTickCap: 100 })()
      }),
    }),
  }),

  resources: router({
    search: secureProcedure('sarge.resources.search').input(ResourceSearchInput).query(async () => ([] as any[])),
  }),

  cost: router({
    estimate: secureProcedure('sarge.cost.estimate')
      .input(z.object({ stackId: z.string().default('default'), usage: z.object({
        s3: z.object({ putRequests: z.number().optional(), getRequests: z.number().optional() }).optional(),
        dynamo: z.object({ readRequests: z.number().optional(), writeRequests: z.number().optional() }).optional(),
        lambda: z.object({ requests: z.number().optional(), gbSeconds: z.number().optional() }).optional(),
        sqs: z.object({ requests: z.number().optional() }).optional(),
        sns: z.object({ requests: z.number().optional() }).optional(),
      }).partial().optional() }))
      .query(async ({ input }) => {
        const dataRoot = getDataRoot()
        const core = await getCore()
        const out = core.cost.estimate({ kind: 'local', dataRoot, usage: input.usage })
        return out
      })
  }),

  export: router({
    terraform: secureProcedure('sarge.export.terraform')
      .input(z.object({ outDir: z.string().default('./infra'), blueprint: z.any().optional(), region: z.string().optional() }))
      .mutation(async ({ input }) => {
        const core = await getCore()
        const bp = input.blueprint ?? {
          services: [],
          resources: { s3Buckets: [], dynamoTables: [], lambdaFunctions: [] },
          ports: [], envKeys: [], docker: { dockerfile: false, composeFiles: [] }, awsSdks: []
        }
        const out = await core.exporters.terraform.export(bp, { outDir: input.outDir, region: input.region })
        return { ok: true, files: out.files }
      })
  }),

  explain: router({
    stack: secureProcedure('sarge.explain.stack')
      .input(z.object({
        stackId: z.string().default('default'),
        includeHealth: z.boolean().optional(),
        includeErrors: z.boolean().optional(),
        includeCost: z.boolean().optional(),
        includeLastDeploy: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        const core = await getCore()
        const dataRoot = getDataRoot()
        
        // Gather context from local filesystem
        const context = await core.explainer.gatherStackContext(
          input.stackId,
          dataRoot,
          {
            includeHealth: input.includeHealth ?? true,
            includeErrors: input.includeErrors ?? true,
            includeCost: input.includeCost ?? true,
            includeLastDeploy: input.includeLastDeploy ?? true,
          }
        )
        
        // Generate explanation
        const explanation = core.explainer.explainStack({
          stackId: input.stackId,
          dataRoot,
          context,
        })
        
        return explanation
      })
  }),

  aws: router({
    s3: router({
      listBuckets: secureProcedure('sarge.aws.s3.listBuckets').query(async () => ([] as any[])),
      listObjects: secureProcedure('sarge.aws.s3.listObjects').input(S3ListObjectsInput).query(async () => ({ items: [] as any[], nextToken: null as string | null })),
      putObject: secureProcedure('sarge.aws.s3.putObject').input(S3PutObjectInput).mutation(async () => notImplemented()),
      getObject: secureProcedure('sarge.aws.s3.getObject').input(S3GetObjectInput).query(async () => notImplemented()),
      deleteObject: secureProcedure('sarge.aws.s3.deleteObject').input(S3DeleteObjectInput).mutation(async () => notImplemented()),
    }),
    dynamo: router({
      createTable: secureProcedure('sarge.aws.dynamo.createTable').input(DynamoCreateTableInput).mutation(async () => notImplemented()),
      putItem: secureProcedure('sarge.aws.dynamo.putItem').input(DynamoPutItemInput).mutation(async () => notImplemented()),
      getItem: secureProcedure('sarge.aws.dynamo.getItem').input(DynamoKeyInput).query(async () => notImplemented()),
      query: secureProcedure('sarge.aws.dynamo.query').input(DynamoQueryInput).query(async () => notImplemented()),
      scan: secureProcedure('sarge.aws.dynamo.scan').input(DynamoScanInput).query(async () => notImplemented()),
    }),
    lambda: router({
      listFunctions: secureProcedure('sarge.aws.lambda.listFunctions').query(async () => ([] as any[])),
      invoke: secureProcedure('sarge.aws.lambda.invoke').input(LambdaInvokeInput).mutation(async () => notImplemented()),
      createFunction: secureProcedure('sarge.aws.lambda.createFunction').input(LambdaCreateFunctionInput).mutation(async () => notImplemented()),
      updateFunctionCode: secureProcedure('sarge.aws.lambda.updateFunctionCode').input(LambdaUpdateCodeInput).mutation(async () => notImplemented()),
    }),
  }),

  // Back-compat: re-export legacy routers underneath sarge.legacy.*
  legacy: router({
    metrics: metricsRouter,
    logs: logsRouter,
    deploy: deployRouter,
    services: legacyServicesRouter,
  }),

  oneclick: oneclickRouter,
})

export type SargeRouter = typeof sargeRouter

function getDataRoot() {
  const base = process.env.SARGE_DATA_DIR ? path.resolve(process.cwd(), process.env.SARGE_DATA_DIR) : path.resolve(process.cwd(), 'data/sarge/workspaces/default')
  return base
}

async function makeSnapshotManager(dataRoot: string) {
  const core = await getCore()
  let S3Ctor: any
  let DdbcCtor: any
  try { S3Ctor = require('sarge-services-s3').S3Service } catch { S3Ctor = class { async createBucket(){} async listObjectsV2(){ return { contents: [] } } async getObject(){ return { body: Buffer.from(''), meta: { contentType: 'application/octet-stream' } } } async putObject(){} } }
  try { DdbcCtor = require('sarge-services-dynamo').DynamoService } catch { DdbcCtor = class { async listTables(){ return { TableNames: [] } } async describeTable(_n: string){ return { Table: { KeySchema: [], AttributeDefinitions: [] } } } async scan(){ return { Items: [] } } async createTable(){ } async putItem(){ } } }
  const s3 = new S3Ctor({ dataRoot })
  const ddb = new DdbcCtor({ dataRoot })
  return new core.SnapshotManager({
    dataRoot,
    s3: {
      async listBuckets() {
        const s3root = path.join(dataRoot, 's3')
        if (!fs.existsSync(s3root)) return []
        return fs.readdirSync(s3root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
      },
      async createBucket(name: string) { await s3.createBucket(name) },
      async listObjects(bucket: string) { const out = await s3.listObjectsV2(bucket); return out.contents.map((o: any) => ({ key: o.key })) },
      async getObject(bucket: string, key: string) { const got = await s3.getObject(bucket, key); return { body: got.body, contentType: got.meta.contentType } },
      async putObject(bucket: string, key: string, body: Buffer, contentType?: string) { await s3.putObject(bucket, key, body, contentType) },
    },
    dynamo: {
      async listTables() { const out = await ddb.listTables(); return out.TableNames },
      async describeTable(name: string) { const out = await ddb.describeTable(name); return { TableName: name, KeySchema: out.Table.KeySchema, AttributeDefinitions: out.Table.AttributeDefinitions } },
      async scanAll(name: string) { const out = await ddb.scan({ TableName: name }); return out.Items },
      async createTable(desc: any) { await ddb.createTable(desc) },
      async putItem(name: string, item: any) { await ddb.putItem({ TableName: name, Item: item }) },
    },
  })
}
