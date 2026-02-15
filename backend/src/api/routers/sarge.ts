import { router } from "../../trpc"
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
  // Avoid static resolution of sarge-core during Next build by obfuscating module name
  const modName = ['sarge', '-', 'core'].join('')
  try { return require(modName) } catch (e: any) {
    if (e?.code === 'ERR_REQUIRE_ESM') {
      const mod = await import(modName)
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

  // Note: stacks router is in routers/stacks.ts and exposed at top-level as trpc.stacks.*
  // Kept here for backward compatibility but prefer using trpc.stacks.* directly

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

  stacks: router({
    list: secureProcedure('sarge.stacks.list').query(async () => ([] as any[])),
  }),

  aws: router({
    s3: router({
      listBuckets: secureProcedure('sarge.aws.s3.listBuckets').query(async () => ([] as any[])),
    }),
  }),

  resources: router({
    search: secureProcedure('sarge.resources.search').input(ResourceSearchInput).query(async () => ([] as any[])),
  }),

  cost: router({
    estimate: secureProcedure('sarge.cost.estimate')
      .input(z.object({
        stackId: z.string().default('default'), usage: z.object({
          s3: z.object({ putRequests: z.number().optional(), getRequests: z.number().optional() }).optional(),
          dynamo: z.object({ readRequests: z.number().optional(), writeRequests: z.number().optional() }).optional(),
          lambda: z.object({ requests: z.number().optional(), gbSeconds: z.number().optional() }).optional(),
          sqs: z.object({ requests: z.number().optional() }).optional(),
          sns: z.object({ requests: z.number().optional() }).optional(),
        }).partial().optional()
      }))
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

  // Note: awsRouter with real database operations is in routers/aws.ts 
  // and exposed at top-level as trpc.aws.* (s3, dynamodb, lambda)
  // (removed duplicate mock aws router to avoid confusion)

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
  // On Vercel/serverless, use /tmp (only writable location)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', '.sarge')
  }
  const base = process.env.SARGE_DATA_DIR ? path.resolve(process.cwd(), process.env.SARGE_DATA_DIR) : path.resolve(process.cwd(), 'data/sarge/workspaces/default')
  return base
}

async function makeSnapshotManager(dataRoot: string) {
  const core = await getCore()
  let S3Ctor: any
  let DdbcCtor: any
  const s3Name = ['sarge', '-', 'services', '-', 's3'].join('')
  const dynamoName = ['sarge', '-', 'services', '-', 'dynamo'].join('')
  try { S3Ctor = require(s3Name).S3Service } catch { S3Ctor = class { async createBucket() { } async listObjectsV2() { return { contents: [] } } async getObject() { return { body: Buffer.from(''), meta: { contentType: 'application/octet-stream' } } } async putObject() { } } }
  try { DdbcCtor = require(dynamoName).DynamoService } catch { DdbcCtor = class { async listTables() { return { TableNames: [] } } async describeTable(_n: string) { return { Table: { KeySchema: [], AttributeDefinitions: [] } } } async scan() { return { Items: [] } } async createTable() { } async putItem() { } } }
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
