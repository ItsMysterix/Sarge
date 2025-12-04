import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { createGitHubScanner } from '../../services/github-scanner'
import { createDeploymentOrchestrator } from '../../services/deployment-orchestrator'

// Global orchestrator instance
const orchestrator = createDeploymentOrchestrator()

async function getCore(): Promise<any> {
  // Import sarge-core at runtime to avoid bundler static resolution during Next build
  // Use non-literal module name to prevent webpack from resolving it at build time
  const modName = ['sarge', '-', 'core'].join('')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  try { return require(modName) } catch (e: any) {
    if ((globalThis as any).__sargeCoreMock) return (globalThis as any).__sargeCoreMock
    if (e?.code === 'ERR_REQUIRE_ESM') {
      const mod = await import(modName)
      return mod
    }
    throw e
  }
}
import createBufferedSubscription from '../lib/realtime'

function getDataRoot() {
  // On Vercel/serverless, use /tmp (only writable location)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return require('path').join('/tmp', '.sarge')
  }
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

  // Detect services in repository (via GitHub API - NO CLONING!)
  // Uses Claude AI if ANTHROPIC_API_KEY is set, otherwise falls back to pattern matching
  detectRepo: secureProcedure('sarge.oneclick.detectRepo')
    .input(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      branch: z.string().default('main'),
      accessToken: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`[OneClick] Scanning ${input.owner}/${input.repo} via GitHub API`)
        
        const useAI = !!process.env.ANTHROPIC_API_KEY
        console.log(`[OneClick] AI Analysis: ${useAI ? 'Enabled (Claude 3.5 Sonnet)' : 'Disabled (pattern matching)'}`)
        
        // Use GitHub scanner with AI support
        const scanner = createGitHubScanner(input.accessToken, useAI)
        const blueprint = await scanner.scanRepository(input.owner, input.repo, input.branch)
        
        console.log(`[OneClick] Scan complete: ${blueprint.services.length} services, ${blueprint.externalServices.length} external`)
        
        // Convert to legacy blueprint format for compatibility
        // Ensure all data is serializable (no undefined, functions, etc.)
        const safeServices = Array.isArray(blueprint.services) ? blueprint.services : []
        const safeExternalServices = Array.isArray(blueprint.externalServices) ? blueprint.externalServices : []
        const safeEnvKeys = Array.isArray(blueprint.envKeys) ? blueprint.envKeys : []
        
        // Build response with NO undefined values to prevent SuperJSON serialization crashes
        const safePorts = safeServices
          .flatMap(s => (s && Array.isArray(s.ports) ? s.ports : []))
          .filter(p => p != null && typeof p === 'number')
        
        const safeEnvKeysFiltered = safeEnvKeys
          .filter(k => k != null && typeof k === 'string' && k.length > 0)
        
        const safeComposeFiles = (blueprint?.docker && Array.isArray(blueprint.docker.composeFiles))
          ? blueprint.docker.composeFiles.filter(f => f != null && typeof f === 'string' && f.length > 0)
          : []
        
        const response = {
          services: safeServices.map(s => {
            const svc = s || {}
            return {
              name: (svc.name && typeof svc.name === 'string') ? svc.name : 'unknown',
              type: (svc.type && typeof svc.type === 'string') ? svc.type : 'api',
              cwd: (svc.cwd && typeof svc.cwd === 'string') ? svc.cwd : '.',
              startCommand: (svc.startCommand && typeof svc.startCommand === 'string') ? svc.startCommand : '',
              buildCommand: (svc.buildCommand && typeof svc.buildCommand === 'string') ? svc.buildCommand : '',
              ports: Array.isArray(svc.ports) ? svc.ports.filter(p => p != null && typeof p === 'number') : [],
              envKeys: Array.isArray(svc.envKeys) ? svc.envKeys.filter(k => k != null && typeof k === 'string' && k) : [],
              framework: (svc.framework && typeof svc.framework === 'string') ? svc.framework : '',
            }
          }),
          resources: {
            s3Buckets: [],
            dynamoTables: [],
            lambdaFunctions: [],
          },
          ports: safePorts,
          envKeys: safeEnvKeysFiltered,
          docker: {
            dockerfile: !!(blueprint?.docker?.dockerfile),
            dockerCompose: !!(blueprint?.docker?.dockerCompose),
            composeFiles: safeComposeFiles,
          },
          awsSdks: [],
          externalServices: safeExternalServices.map(s => {
            const ext = s || {}
            return {
              name: (ext.name && typeof ext.name === 'string') ? ext.name : 'unknown',
              type: (ext.type && typeof ext.type === 'string') ? ext.type : 'database',
              ports: Array.isArray(ext.ports) ? ext.ports.filter(p => p != null && typeof p === 'number') : [],
              envKeys: Array.isArray(ext.envKeys) ? ext.envKeys.filter(k => k != null && typeof k === 'string' && k) : [],
              version: (ext.version && typeof ext.version === 'string') ? ext.version : '',
              dockerImage: (ext.dockerImage && typeof ext.dockerImage === 'string') ? ext.dockerImage : '',
            }
          }),
          projectType: (blueprint?.projectType && typeof blueprint.projectType === 'string') ? blueprint.projectType : 'unknown',
          packageManager: (blueprint?.packageManager && typeof blueprint.packageManager === 'string') ? blueprint.packageManager : 'npm',
          framework: (blueprint?.framework && typeof blueprint.framework === 'string') ? blueprint.framework : '',
        }
        
        // Strip all undefined values to prevent SuperJSON serialization crashes
        return JSON.parse(JSON.stringify(response))
      } catch (error) {
        console.error('[OneClick] detectRepo error:', error)
        // Return a resilient, mock-first response instead of throwing to avoid 500s on serverless
        return {
          services: [],
          resources: { s3Buckets: [], dynamoTables: [], lambdaFunctions: [] },
          ports: [],
          envKeys: [],
          docker: { dockerfile: false, dockerCompose: false, composeFiles: [] },
          awsSdks: [],
          externalServices: [],
          projectType: 'unknown',
          packageManager: 'npm',
          framework: '',
          error: error instanceof Error ? error.message : 'Failed to analyze repository',
        }
      }
    }),

  // Combined convenience: use connected repository (from /api/repository) and deploy
  deployConnected: secureProcedure('sarge.oneclick.deployConnected')
    .input(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      branch: z.string().default('main'),
      accessToken: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      // Emit progress logs via event emitter so client can subscribe
      const topic = `oneclick:connected:${input.owner}/${input.repo}`
      const classify = (rawMsg: string): string => {
        const normalized = typeof rawMsg === 'string' ? rawMsg : String(rawMsg ?? '')
        const msgLower = normalized.toLowerCase()
        if (!msgLower) return 'progress'
        if (msgLower.includes('error') || normalized.startsWith('❌')) return 'error'
        if (msgLower.includes('deploying') || msgLower.includes('starting')) return 'progress'
        if (msgLower.includes('complete') || normalized.startsWith('✅')) return 'success'
        return 'info'
      }
      const emit = (msg: string) => { try { ctx.ee.emit(topic, { ts: Date.now(), line: msg, level: classify(msg) }) } catch {} }
      emit(`Starting connected deploy for ${input.owner}/${input.repo}`)
      const scanner = createGitHubScanner(input.accessToken, !!process.env.ANTHROPIC_API_KEY)
      emit('Scanning repository (no clone)...')
      const blueprint = await scanner.scanRepository(input.owner, input.repo, input.branch)
      emit(`Detected ${blueprint.services.length} service(s)`)      
      const instances = await orchestrator.deploy({
        owner: input.owner,
        repo: input.repo,
        branch: input.branch,
        accessToken: input.accessToken,
        services: blueprint.services || [],
        externalServices: blueprint.externalServices || [],
      })
      emit('Services started locally')
      const result = Array.from(instances.values()).map(i => ({ name: i.name, status: i.status, port: i.port, url: i.url }))
      emit('Deployment complete')
      return { services: result, blueprintSummary: { services: blueprint.services.length, projectType: blueprint.projectType, framework: blueprint.framework }, logTopic: topic }
    }),

  // Deploy services without cloning!
  deployFromGitHub: secureProcedure('sarge.oneclick.deployFromGitHub')
    .input(z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      branch: z.string().default('main'),
      accessToken: z.string().min(1),
      blueprint: z.any(), // Blueprint from detectRepo
    }))
    .mutation(async ({ input }) => {
      console.log(`[OneClick] Deploying ${input.owner}/${input.repo} from GitHub (no cloning!)`)

      const instances = await orchestrator.deploy({
        owner: input.owner,
        repo: input.repo,
        branch: input.branch,
        accessToken: input.accessToken,
        services: input.blueprint.services || [],
        externalServices: input.blueprint.externalServices || [],
      })

      const result = Array.from(instances.values()).map(i => ({
        name: i.name,
        status: i.status,
        port: i.port,
        url: i.url,
      }))

      console.log(`[OneClick] Deployed ${result.length} services`)
      return { services: result, status: 'deployed' }
    }),

  // Stop all running services
  stopAll: secureProcedure('sarge.oneclick.stopAll')
    .mutation(async () => {
      await orchestrator.stopAll()
      return { success: true }
    }),

  // Get deployment status
  getDeploymentStatus: secureProcedure('sarge.oneclick.getDeploymentStatus')
    .query(async () => {
      const instances = orchestrator.getAllInstances()
      return {
        services: instances.map(i => ({
          name: i.name,
          status: i.status,
          port: i.port,
          url: i.url,
          logs: i.logs.slice(-50), // Last 50 log lines
        })),
      }
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
      const repoPath = input.repoPath || process.cwd()

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
  streamConnected: secureProcedure('sarge.oneclick.streamConnected')
    .input(z.object({ owner: z.string(), repo: z.string() }))
    .subscription(({ input, ctx }) => {
      const topic = `oneclick:connected:${input.owner}/${input.repo}`
      return createBufferedSubscription(ctx.ee, { topics: [topic], bufferSize: 300, perTickCap: 50 })()
  }),

  toggleDocker: secureProcedure('sarge.oneclick.toggleDocker')
    .input(ToggleDockerInput)
    .mutation(async ({ input }) => {
      process.env.DOCKER_MODE = input.enabled ? 'true' : 'false'
      return { ok: true, enabled: input.enabled }
    })
})

export type OneclickRouter = typeof oneclickRouter
