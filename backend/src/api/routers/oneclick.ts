import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { createGitHubScanner } from '../../services/github-scanner'
import { createDeploymentOrchestrator } from '../../services/deployment-orchestrator'
import { DeploymentExecutor } from '../../services/deployment-executor'
import { downloadAndExtractRepository } from '../../services/tarball-utils'
import * as path from 'path'
import * as os from 'os'
import { spawn } from 'child_process'
import * as fs from 'fs'

// Global orchestrator instance
const orchestrator = createDeploymentOrchestrator()

// Helper to save logs to database
async function saveLogs(logs: Array<{ type: string; message: string; service: string; severity?: string; timestamp?: string }>) {
  try {
    // On Vercel, use full URL with host. On local, use localhost.
    const isVercel = process.env.VERCEL === '1'
    const fetchUrl = isVercel 
      ? `https://${process.env.VERCEL_URL || 'v0-sarge.vercel.app'}/api/logs`
      : 'http://localhost:3000/api/logs'
    
    console.log('[saveLogs] Posting to:', fetchUrl, 'with', logs.length, 'log(s)', '(Vercel:', isVercel, ')')
    
    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logs),
    }).catch((err) => {
      console.error('[saveLogs] Fetch error:', err)
      return null
    })
    
    if (response && !response.ok) {
      console.error('[saveLogs] Server error:', response.status, response.statusText)
      try {
        const text = await response.text()
        console.error('[saveLogs] Response:', text)
      } catch {}
    } else if (response) {
      console.log('[saveLogs] Success:', response.status)
    }
  } catch (e) {
    console.error('[saveLogs] Error:', e)
  }
}

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
        
        // DEFENSIVE: Map services with null guards to prevent serialization issues
        const safeServices = Array.isArray(blueprint?.services) ? 
          blueprint.services.map(s => ({
            name: String(s?.name || 'unknown'),
            type: String(s?.type || 'api'),
            cwd: String(s?.cwd || '.'),
            startCommand: String(s?.startCommand || ''),
            buildCommand: String(s?.buildCommand || ''),
            ports: Array.isArray(s?.ports) ? s.ports.filter(p => typeof p === 'number') : [],
            envKeys: Array.isArray(s?.envKeys) ? s.envKeys.filter(k => typeof k === 'string') : [],
            framework: String(s?.framework || ''),
          })) : []
        
        const safeExternal = Array.isArray(blueprint?.externalServices) ?
          blueprint.externalServices.map(s => ({
            name: String(s?.name || 'unknown'),
            type: String(s?.type || 'database'),
            ports: Array.isArray(s?.ports) ? s.ports.filter(p => typeof p === 'number') : [],
            envKeys: Array.isArray(s?.envKeys) ? s.envKeys.filter(k => typeof k === 'string') : [],
            version: String(s?.version || ''),
            dockerImage: String(s?.dockerImage || ''),
          })) : []
        
        // Return fully guarded response
        return {
          services: safeServices,
          resources: {
            s3Buckets: [],
            dynamoTables: [],
            lambdaFunctions: [],
          },
          ports: safeServices.flatMap(s => s.ports),
          envKeys: Array.isArray(blueprint?.envKeys) ? blueprint.envKeys.filter(k => typeof k === 'string') : [],
          docker: {
            dockerfile: Boolean(blueprint?.docker?.dockerfile),
            dockerCompose: Boolean(blueprint?.docker?.dockerCompose),
            composeFiles: Array.isArray(blueprint?.docker?.composeFiles) ? blueprint.docker.composeFiles : [],
          },
          awsSdks: [],
          externalServices: safeExternal,
          projectType: String(blueprint?.projectType || 'unknown'),
          packageManager: String(blueprint?.packageManager || 'npm'),
          framework: String(blueprint?.framework || ''),
        }
        
        /* ORIGINAL CODE - COMMENTED OUT FOR TESTING
        const useAI = !!process.env.ANTHROPIC_API_KEY
        console.log(`[OneClick] AI Analysis: ${useAI ? 'Enabled (Claude 3.5 Sonnet)' : 'Disabled (pattern matching)'}`)
        
        // Use GitHub scanner with AI support
        const scanner = createGitHubScanner(input.accessToken, useAI)
        const blueprint = await scanner.scanRepository(input.owner, input.repo, input.branch)
        
        console.log('[OneClick] Returning test response')
        return testResponse
        
        /* ORIGINAL CODE - COMMENTED OUT FOR TESTING
        const useAI = !!process.env.ANTHROPIC_API_KEY
        console.log(`[OneClick] AI Analysis: ${useAI ? 'Enabled (Claude 3.5 Sonnet)' : 'Disabled (pattern matching)'}`)
        
        // Use GitHub scanner with AI support
        const scanner = createGitHubScanner(input.accessToken, useAI)
        const blueprint = await scanner.scanRepository(input.owner, input.repo, input.branch)
        
        console.log(`[OneClick] Scan complete: ${blueprint.services.length} services, ${blueprint.externalServices.length} external`)
        console.log(`[OneClick] Blueprint type:`, typeof blueprint, 'Keys:', Object.keys(blueprint))
        
        // Convert to legacy blueprint format for compatibility
        // Ensure all data is serializable (no undefined, functions, etc.)
        const safeServices = Array.isArray(blueprint.services) ? blueprint.services.filter(s => s != null) : []
        const safeExternalServices = Array.isArray(blueprint.externalServices) ? blueprint.externalServices.filter(e => e != null) : []
        const safeEnvKeys = Array.isArray(blueprint.envKeys) ? blueprint.envKeys.filter(k => k != null) : []
        
        console.log(`[OneClick] Safe arrays - services: ${safeServices.length}, external: ${safeExternalServices.length}, envKeys: ${safeEnvKeys.length}`)
        
        // Build response with NO undefined values to prevent SuperJSON serialization crashes
        const safePorts = safeServices
          .flatMap(s => (s && Array.isArray(s.ports) ? s.ports : []))
          .filter(p => p != null && typeof p === 'number')
        
        const safeEnvKeysFiltered = safeEnvKeys
          .filter(k => k != null && typeof k === 'string' && k.length > 0)
        
        const safeComposeFiles = (blueprint?.docker && Array.isArray(blueprint.docker.composeFiles))
          ? blueprint.docker.composeFiles.filter(f => f != null && typeof f === 'string' && f.length > 0)
          : []
        
        console.log(`[OneClick] Building response object...`)
        
        // Return ultra-simple structure - absolutely NO filter operations
        const simpleResponse = {
          services: safeServices.map(s => {
            // Manually build safe port array
            const safePorts: number[] = []
            if (s?.ports && Array.isArray(s.ports)) {
              for (const p of s.ports) {
                if (typeof p === 'number') safePorts.push(p)
              }
            }
            
            // Manually build safe envKeys array
            const safeEnvKeys: string[] = []
            if (s?.envKeys && Array.isArray(s.envKeys)) {
              for (const k of s.envKeys) {
                if (typeof k === 'string' && k) safeEnvKeys.push(k)
              }
            }
            
            return {
              name: String(s?.name || 'unknown'),
              type: String(s?.type || 'api'),
              cwd: String(s?.cwd || '.'),
              startCommand: String(s?.startCommand || ''),
              buildCommand: String(s?.buildCommand || ''),
              ports: safePorts,
              envKeys: safeEnvKeys,
              framework: String(s?.framework || ''),
            }
          }),
          resources: {
            s3Buckets: [],
            dynamoTables: [],
            lambdaFunctions: [],
          },
          ports: safePorts.map(p => Number(p)),
          envKeys: safeEnvKeysFiltered.map(k => String(k)),
          docker: {
            dockerfile: Boolean(blueprint?.docker?.dockerfile),
            dockerCompose: Boolean(blueprint?.docker?.dockerCompose),
            composeFiles: safeComposeFiles.map(f => String(f)),
          },
          awsSdks: [],
          externalServices: safeExternalServices.map(s => {
            // Manually build safe port array
            const extSafePorts: number[] = []
            if (s?.ports && Array.isArray(s.ports)) {
              for (const p of s.ports) {
                if (typeof p === 'number') extSafePorts.push(p)
              }
            }
            
            // Manually build safe envKeys array
            const extSafeEnvKeys: string[] = []
            if (s?.envKeys && Array.isArray(s.envKeys)) {
              for (const k of s.envKeys) {
                if (typeof k === 'string' && k) extSafeEnvKeys.push(k)
              }
            }
            
            return {
              name: String(s?.name || 'unknown'),
              type: String(s?.type || 'database'),
              ports: extSafePorts,
              envKeys: extSafeEnvKeys,
              version: String(s?.version || ''),
              dockerImage: String(s?.dockerImage || ''),
            }
          }),
          projectType: String(blueprint?.projectType || 'unknown'),
          packageManager: String(blueprint?.packageManager || 'npm'),
          framework: String(blueprint?.framework || ''),
        }
        
        console.log('[OneClick] Simple response ready, services:', simpleResponse.services.length)
        return simpleResponse
        */
      } catch (error) {
        console.error('[OneClick] detectRepo error:', error)
        console.error('[OneClick] Error stack:', error instanceof Error ? error.stack : 'no stack')
        console.error('[OneClick] Error name:', error instanceof Error ? error.name : typeof error)
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
      startPort: z.number().optional().default(3000),
      packageManager: z.string().optional().default('pnpm'),
      deploymentMethod: z.enum(['local', 'docker']).optional().default('local'),
    }))
    .mutation(async ({ input, ctx }) => {
      // Emit progress logs via event emitter so client can subscribe
      const topic = `oneclick:connected:${input.owner}/${input.repo}`
      const logs: any[] = []
      
      const classify = (rawMsg: string): string => {
        const normalized = typeof rawMsg === 'string' ? rawMsg : String(rawMsg ?? '')
        const msgLower = normalized.toLowerCase()
        if (!msgLower) return 'info'
        if (msgLower.includes('error') || normalized.startsWith('❌')) return 'error'
        if (msgLower.includes('deploying') || msgLower.includes('starting')) return 'progress'
        if (msgLower.includes('complete') || normalized.startsWith('✅')) return 'success'
        return 'info'
      }
      
      const emit = (msg: string) => { 
        try { 
          const level = classify(msg)
          const logEntry = { ts: Date.now(), line: msg, level }
          logs.push(logEntry)
          ctx.ee.emit(topic, logEntry)
          
          console.log(`[Deployment ${input.owner}/${input.repo}] [${level.toUpperCase()}] ${msg}`)
          
          // Save to database asynchronously (don't wait)
          saveLogs([{
            type: level === 'error' ? 'error' : level === 'progress' ? 'info' : 'info',
            message: msg,
            service: `${input.owner}/${input.repo}`,
            severity: level === 'error' ? 'high' : 'medium',
            timestamp: new Date().toISOString(),
          }]).catch(e => console.error('Failed to save log:', e))
        } catch (err) {
          console.error('[emit] Error:', err)
        } 
      }
      
      try {
        emit(`🚀 Starting deployment for ${input.owner}/${input.repo}`)
        
        if (input.deploymentMethod === 'docker') {
          // Use Docker deployment via orchestrator
          emit(`🐳 Deploying via Docker...`)
          const instances = await orchestrator.deploy({
            owner: input.owner,
            repo: input.repo,
            branch: input.branch,
            accessToken: input.accessToken,
            services: [],
            externalServices: [],
          })
          
          const services = Array.from(instances.values()).map(i => ({
            name: i.name,
            status: i.status,
            port: i.port,
            url: i.url,
          }))
          
          emit(`✅ Docker deployment complete - ${services.length} service(s) running`)
          return {
            services,
            blueprintSummary: { services: services.length, projectType: 'unknown', framework: 'unknown' },
            logTopic: topic,
            logs,
          }
        } else {
          // Use local process deployment
          emit(`💻 Deploying locally...`)
          
          // Download and extract repository tarball
          emit(`📥 Downloading repository...`)
          const tarResult = await downloadAndExtractRepository(input.owner, input.repo, input.branch)
          
          if (!tarResult.success) {
            emit(`❌ Failed to download repository: ${tarResult.error}`)
            tarResult.cleanup()
            return {
              services: [],
              blueprintSummary: { services: 0, projectType: 'unknown', framework: 'unknown' },
              logTopic: topic,
              logs: logs.concat([{
                ts: Date.now(),
                line: `Download error: ${tarResult.error}`,
                level: 'error',
              }]),
            }
          }
          
          emit(`✅ Repository downloaded successfully`)
          
          // Use real deployment executor
          const repoPath = tarResult.path
          const executor = new DeploymentExecutor()
          
          // Stream logs to client
          executor.setOnLog((log) => {
            const formattedMsg = log.line
            emit(formattedMsg)
          })
          
          // Execute real deployment
          emit(`📂 Preparing deployment environment...`)
          const result = await executor.deploy(repoPath, input.packageManager, input.startPort)
          
          // Cleanup temp directory after deployment
          setTimeout(() => {
            tarResult.cleanup()
            console.log(`[Deploy] Cleaned up temporary deployment files`)
          }, 5000) // Give client time to fetch logs before cleanup
          
          if (result.success) {
            emit(`✅ Deployment successful - Application running on port ${input.startPort}`)
            return {
              services: [{ name: input.repo, status: 'running', port: input.startPort, url: `http://localhost:${input.startPort}` }],
              blueprintSummary: { services: 1, projectType: 'unknown', framework: 'unknown' },
              logTopic: topic,
              logs: logs.concat(result.logs.map(l => ({ ts: l.timestamp, line: l.line, level: l.level }))),
            }
          } else {
            emit(`❌ Deployment failed: ${result.error || 'Unknown error'}`)
            return {
              services: [],
              blueprintSummary: { services: 0, projectType: 'unknown', framework: 'unknown' },
              logTopic: topic,
              logs: logs.concat(result.logs.map(l => ({ ts: l.timestamp, line: l.line, level: l.level }))),
            }
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        emit(`❌ Deployment error: ${errorMsg}`)
        return {
          services: [],
          blueprintSummary: { services: 0, projectType: 'unknown', framework: 'unknown' },
          logTopic: topic,
          logs,
        }
      }
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
