import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { workspaceManager } from '../../services/workspace-manager'

async function getCore(): Promise<any> {
  // Import sarge-core at runtime to avoid type dependency on built artifacts during tests
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  try { return require('sarge-core') } catch (e: any) {
    if ((globalThis as any).__sargeCoreMock) return (globalThis as any).__sargeCoreMock
    if (e?.code === 'ERR_REQUIRE_ESM') {
      const mod = await import('sarge-core')
      return mod
    }
    throw e
  }
}
import createBufferedSubscription from '../lib/realtime'

function getDataRoot() {
  const base = process.env.SARGE_DATA_DIR ? require('path').resolve(process.cwd(), process.env.SARGE_DATA_DIR) : require('path').resolve(process.cwd(), 'data/sarge/workspaces/default')
  return base
}

const DetectRepoInput = z.object({ path: z.string().min(1) })
const BlueprintSchema = z.object({
  services: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['web','api','worker']).default('api'),
      cwd: z.string().optional(),
      startCommand: z.string().optional(),
      ports: z.array(z.number().int().positive()).default([]),
      envKeys: z.array(z.string()).default([]),
      health: z.any().optional()
    })
  ).default([]),
  resources: z.object({
    s3Buckets: z.array(z.string()).default([]),
    dynamoTables: z.array(z.object({ name: z.string() })).default([]),
    lambdaFunctions: z.array(z.object({ name: z.string() })).default([])
  }).default({ s3Buckets: [], dynamoTables: [], lambdaFunctions: [] }),
  ports: z.array(z.number().int().positive()).default([]),
  envKeys: z.array(z.string()).default([]),
  docker: z.object({ dockerfile: z.boolean().default(false), composeFiles: z.array(z.string()).default([]) }).default({ dockerfile: false, composeFiles: [] }),
  awsSdks: z.array(z.enum(['s3','dynamodb','lambda'])).default([])
})
const PlanInput = z.object({ blueprint: BlueprintSchema })
const ApplyInput = z.object({ plan: z.any() })
const StatusInput = z.object({ stackId: z.string().min(1) })
const LogsTailInput = z.object({ stackId: z.string().min(1), service: z.string().min(1) })
const ToggleDockerInput = z.object({ enabled: z.boolean() })
// Accept both HTTPS URLs and SSH SCP-like syntax (e.g., git@github.com:owner/repo.git)
const CloneRepoInput = z.object({
  repoUrl: z
    .string()
    .min(1)
    .refine(
      (v) => /^https?:\/\//.test(v) || /^git@[\w.-]+:.+/.test(v) || /^ssh:\/\//.test(v),
      'Invalid repository URL. Use https://github.com/owner/repo(.git) or git@github.com:owner/repo.git'
    ),
  branch: z.string().default('main'),
})
const RegisterLocalInput = z.object({ 
  localPath: z.string().min(1) 
})
const WorkspaceIdInput = z.object({ 
  workspaceId: z.string().min(1) 
})

export const oneclickRouter = router({
  // Workspace management
  workspaces: router({
    // Clone GitHub repo to local workspace
    cloneRepo: secureProcedure('sarge.oneclick.workspaces.cloneRepo')
      .input(CloneRepoInput)
      .mutation(async ({ input }) => {
        const workspace = await workspaceManager.cloneRepo(input.repoUrl, input.branch)
        return workspace
      }),

    // Register existing local folder
    registerLocal: secureProcedure('sarge.oneclick.workspaces.registerLocal')
      .input(RegisterLocalInput)
      .mutation(async ({ input }) => {
        const workspace = workspaceManager.registerLocal(input.localPath)
        return workspace
      }),

    // List all workspaces
    list: secureProcedure('sarge.oneclick.workspaces.list')
      .query(async () => {
        const workspaces = workspaceManager.listWorkspaces()
        return workspaces
      }),

    // Get workspace details
    get: secureProcedure('sarge.oneclick.workspaces.get')
      .input(WorkspaceIdInput)
      .query(async ({ input }) => {
        const workspace = workspaceManager.getWorkspace(input.workspaceId)
        if (!workspace) {
          throw new Error(`Workspace not found: ${input.workspaceId}`)
        }
        return workspace
      }),

    // Delete workspace
    delete: secureProcedure('sarge.oneclick.workspaces.delete')
      .input(WorkspaceIdInput)
      .mutation(async ({ input }) => {
        await workspaceManager.deleteWorkspace(input.workspaceId)
        return { success: true }
      }),

    // Pull latest changes (GitHub only)
    pull: secureProcedure('sarge.oneclick.workspaces.pull')
      .input(WorkspaceIdInput)
      .mutation(async ({ input }) => {
        await workspaceManager.pullLatest(input.workspaceId)
        return { success: true }
      }),
  }),

  // Detect services in workspace
  detectRepo: secureProcedure('sarge.oneclick.detectRepo')
    .input(z.object({
      path: z.string().optional(),
      workspaceId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      let repoPath: string

      if (input.workspaceId) {
        // Use workspace
        const workspace = workspaceManager.getWorkspace(input.workspaceId)
        if (!workspace) {
          throw new Error(`Workspace not found: ${input.workspaceId}`)
        }
        repoPath = workspace.path
      } else if (input.path) {
        // Use provided path
        repoPath = input.path
      } else {
        // Default to current directory
        repoPath = process.cwd()
      }

      const core = await getCore()
      const bp = await core.detector.detectStack(repoPath)
      return bp
    }),

  plan: secureProcedure('sarge.oneclick.plan')
    .input(PlanInput)
    .mutation(async ({ input }) => {
  const core = await getCore()
  const planOut = await core.planner.planApply(input.blueprint, { providedEnv: {} })
      return planOut
    }),

  apply: secureProcedure('sarge.oneclick.apply', { requiresRole: 'operator', requiresLicenseFeature: 'cloudApply' })
    .input(z.object({
      plan: z.any(),
      workspaceId: z.string().optional(),
      repoPath: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      let repoPath: string

      if (input.workspaceId) {
        // Use workspace
        const workspace = workspaceManager.getWorkspace(input.workspaceId)
        if (!workspace) {
          throw new Error(`Workspace not found: ${input.workspaceId}`)
        }
        repoPath = workspace.path
      } else if (input.repoPath) {
        // Use provided path
        repoPath = input.repoPath
      } else {
        // Default to current directory
        repoPath = process.cwd()
      }

      // Start services via local runtime; caller may subscribe to logs separately
  const core = await getCore()
  try {
        core.traces.configureTracing?.({ enabled: true, dataRoot: getDataRoot() })
      } catch {}
      const res = await (core.traces.runInSpan?.('oneclick.apply', async () => {
        const startRes = await core.apply.apply(input.plan, { repoPath })
        return startRes
      }) ?? core.apply.apply(input.plan, { repoPath }))
      const ports = (input.plan.assignedPorts as any[]).map((p: any) => ({ service: p.service, port: p.assigned[0] || null }))
      const urls = ports.filter((p: any) => p.port).map((p: any) => ({ service: p.service, url: `http://localhost:${p.port}` }))
      // Immediately stop to keep API deterministic unless persistence is enabled
      const persist = process.env.PERSIST_ONECLICK === 'true'
      if (!persist) {
        await res.stop()
      }
      return { status: res.ok ? 'started' : 'error', ports, urls, errors: res.errors, persisted: persist }
    }),

  status: secureProcedure('sarge.oneclick.status')
    .input(StatusInput)
    .query(async () => ({ healthy: true, services: [] as any[] })),

  logs: router({
    tail: secureProcedure('sarge.oneclick.logs.tail')
      .input(LogsTailInput)
      .subscription(({ input, ctx }) => {
        return createBufferedSubscription(ctx.ee, { topics: [`serviceLogs:${input.service}`], bufferSize: 200, perTickCap: 100 })()
      })
  }),

  toggleDocker: secureProcedure('sarge.oneclick.toggleDocker')
    .input(ToggleDockerInput)
    .mutation(async ({ input }) => {
      process.env.DOCKER_MODE = input.enabled ? 'true' : 'false'
      return { ok: true, enabled: input.enabled }
    })
})

export type OneclickRouter = typeof oneclickRouter
