import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createGitHubScanner } from '../../services/github-scanner'
import { createDeploymentOrchestrator } from '../../services/deployment-orchestrator'
import { DeploymentExecutor } from '../../services/deployment-executor'
import { downloadAndExtractRepository } from '../../services/tarball-utils'
import { getProvider } from '../lib/providers'
import { getProviderCredentials } from '../lib/credentials'
import * as path from 'path'
import * as os from 'os'
import { spawn } from 'child_process'
import * as fs from 'fs'
import { saveLogs, getCore, getDataRoot } from './shared/sarge-helpers'
import { apiLogger } from '../../lib/logger'
import createBufferedSubscription from '../lib/realtime'
import { PlatformRouter, ServiceProfile } from '../../services/platform-router'

// Global instances
const orchestrator = createDeploymentOrchestrator()
const platformRouter = new PlatformRouter()



const DetectRepoInput = z.object({ path: z.string().min(1) })
const BlueprintSchema = z.object({
  services: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['web', 'api', 'worker']).default('api'),
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
  awsSdks: z.array(z.enum(['s3', 'dynamodb', 'lambda'])).default([])
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

  // Detect services in repository (supports path-based or GitHub-based detection)
  detectRepo: secureProcedure('sarge.oneclick.detectRepo')
    .input(z.union([
      DetectRepoInput,
      z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        branch: z.string().default('main'),
        accessToken: z.string().min(1),
      }),
    ]))
    .mutation(async ({ input, ctx }) => {
      try {
        // Path-based detection for local repos (restricted to admin)
        if ('path' in input) {
          const role = (ctx as any).role;
          if (role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Path-based detection is restricted to admins' });

          const core = await getCore()
          const blueprint = await core?.detector?.detectStack?.(input.path)
          return (
            blueprint || {
              services: [],
              resources: { s3Buckets: [], dynamoTables: [], lambdaFunctions: [] },
              ports: [],
              envKeys: [],
              docker: { dockerfile: false, composeFiles: [] },
              awsSdks: [],
            }
          )
        }

        apiLogger.info({ owner: input.owner, repo: input.repo }, '[OneClick] Scanning via GitHub API')

        const useAI = !!process.env.ANTHROPIC_API_KEY
        apiLogger.info({ useAI }, '[OneClick] AI Analysis mode')

        // Use GitHub scanner with AI support
        const scanner = createGitHubScanner(input.accessToken, useAI)
        const blueprint = await scanner.scanRepository(input.owner, input.repo, input.branch)

        apiLogger.info({ serviceCount: blueprint.services.length, externalCount: blueprint.externalServices.length }, '[OneClick] Scan complete')

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

      } catch (error) {
        apiLogger.error({ error, input: 'owner' in input ? { owner: input.owner, repo: input.repo } : {} }, '[OneClick] detectRepo error')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to analyze repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
          cause: error as Error,
        })
      }
    }),

  /**
   * Recommend platforms for the current stack blueprint.
   * Uses the Platform Selection Intelligence Engine.
   */
  recommendPlatforms: secureProcedure('sarge.oneclick.recommendPlatforms')
    .input(z.object({
      blueprint: z.any(),
    }))
    .mutation(async ({ input }) => {
      try {
        const blueprint = input.blueprint
        if (!blueprint || !Array.isArray(blueprint.services)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid blueprint provided' })
        }

        const results = blueprint.services.map((service: any) => {
          const profile: ServiceProfile = {
            name: service.name,
            techStack: [service.framework || '', service.language || ''].filter(Boolean),
            type: service.type as ServiceProfile['type'],
            requirements: {
              websockets: service.ports && service.ports.length > 0, // Heuristic
              longRunning: service.type !== 'web', // Heuristic for static vs server
              // Add more heuristics based on frameworks/detected patterns
            },
          }
          return platformRouter.recommend(profile)
        })

        return {
          results,
          overallRecommendation: results.length > 0 ? results[0].primary.platformId : 'local',
        }
      } catch (error) {
        apiLogger.error({ error }, '[OneClick] recommendPlatforms error')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate platform recommendations',
          cause: error as Error,
        })
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
      provider: z.string().optional(),
      environment: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      // Emit progress logs via event emitter so client can subscribe
      const topic = `oneclick:connected:${userId}:${input.owner}/${input.repo}`
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

          apiLogger.info({ owner: input.owner, repo: input.repo, level }, msg)

          // Save to database asynchronously (don't wait)
          saveLogs([{
            type: level === 'error' ? 'error' : level === 'progress' ? 'info' : 'info',
            message: msg,
            service: `${input.owner}/${input.repo}`,
            severity: level === 'error' ? 'high' : 'medium',
            timestamp: new Date().toISOString(),
          }]).catch(e => apiLogger.error({ err: e }, 'Failed to save deployment log'))
        } catch (err) {
          apiLogger.error({ err }, '[emit] Error')
        }
      }

      try {
        emit(`🚀 Starting deployment for ${input.owner
          } / ${input.repo}`)
        emit(`📍 Provider: ${input.provider || 'local'} | Environment: ${input.environment || 'preview'}`)

        // If provider is specified and not 'local' or 'docker', use provider-specific deployment
        if (input.provider && input.provider !== 'local' && input.provider !== 'docker') {
          const provider = getProvider(input.provider)
          if (provider) {
            emit(`☁️  Using ${provider.name} for deployment...`)

            try {
              const repoUrl = `https://github.com/${input.owner}/${input.repo}`
              const credentials = await getProviderCredentials(input.provider, ctx.db, (ctx as any).userId)

              // Call provider-specific deploy
              const deployResult = await provider.deploy({
                projectId: `${input.owner}-${input.repo}`,
                repoUrl,
                branch: input.branch,
                commit: '', // Can be enhanced to get latest commit
                environmentName: (input.environment as 'preview' | 'staging' | 'production') || 'preview',
                credentials,
                buildCommand: input.packageManager === 'pnpm' ? 'pnpm install && pnpm build' : 'npm install && npm run build',
                env: {},
              })

              if (deployResult.success) {
                emit(`✅ ${provider.name} deployment successful`)
                if (deployResult.previewUrl) emit(`🔗 Preview: ${deployResult.previewUrl}`)
                if (deployResult.productionUrl) emit(`🔗 Production: ${deployResult.productionUrl}`)

                // --- COST/QOVERY FEATURE: Save cost estimate ---
                try {
                  const cost = (provider as any).estimateCost ? await (provider as any).estimateCost({
                    environmentName: 'production',
                    resourceConfig: {},
                  }) : { estimatedMonthly: 0, currency: 'USD' }
                  // totalCost += cost.estimatedMonthly // totalCost is not defined in this scope
                  await ctx.db.query(
                    `INSERT INTO cost_estimates
                     (project_id, environment_id, provider_id, deployment_id, monthly_estimate, hourly_rate, breakdown, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                    [
                      `${input.owner}-${input.repo}`,
                      input.environment || 'preview',
                      input.provider,
                      deployResult.deploymentId,
                      cost.monthlyEstimate,
                      cost.hourlyRate,
                      JSON.stringify(cost.breakdown)
                    ]
                  ).catch((err: any) => apiLogger.warn({ err }, '[Cost] Failed to save estimate'));

                  emit(`💰 Estimated cost: $${cost.monthlyEstimate.toFixed(2)}/mo`);
                } catch (e) { apiLogger.warn({ err: e }, '[Cost] Estimation failed'); }

                return {
                  services: [{
                    name: `${input.repo}-${input.provider}`,
                    status: 'running',
                    port: 443,
                    url: deployResult.previewUrl || deployResult.productionUrl || 'https://deployed.example.com',
                  }],
                  blueprintSummary: { services: 1, projectType: provider.kind, framework: 'deployed' },
                  logTopic: topic,
                  logs,
                  deploymentId: deployResult.deploymentId,
                }
              } else {
                emit(`❌ ${provider.name} deployment failed: ${deployResult.error || 'Unknown error'}`)
                return {
                  services: [],
                  blueprintSummary: { services: 0, projectType: 'unknown', framework: 'unknown' },
                  logTopic: topic,
                  logs,
                  error: deployResult.error || `${provider.name} deployment failed`,
                }
              }
            } catch (providerErr) {
              const err = providerErr instanceof Error ? providerErr.message : String(providerErr)
              emit(`❌ ${input.provider} integration error: ${err}`)
              emit(`⚠️  Falling back to local deployment...`)
            }
          }
        }

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
          const tarResult = await downloadAndExtractRepository(input.owner, input.repo, input.branch, input.accessToken)

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
              error: tarResult.error || 'Failed to download repository tarball',
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
            apiLogger.info('[Deploy] Cleaned up temporary deployment files')
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
              error: result.error || 'Deployment executor failed',
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
          error: errorMsg,
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
      apiLogger.info({ owner: input.owner, repo: input.repo }, '[OneClick] Deploying from GitHub (no cloning)')

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

      apiLogger.info({ count: result.length }, '[OneClick] Deployed services')
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
    .mutation(async ({ ctx, input }) => {
      const role = (ctx as any).role;
      const repoPath = (role === 'admin' && input.repoPath) ? input.repoPath : process.cwd()

      // Start services via local runtime; caller may subscribe to logs separately
      const core = await getCore()
      try {
        core.traces.configureTracing?.({ enabled: true, dataRoot: getDataRoot() })
      } catch { }
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
      .input(z.object({
        stackId: z.string().min(1),
        service: z.string().min(1),
        provider: z.string().optional()
      }))
      .subscription(({ input, ctx }) => {
        // Dynamic import to avoid circular dependency issues if any
        const { observable } = require('@trpc/server/observable');

        return observable((emit: any) => {
          let cleanup = () => { };

          const run = async () => {
            try {
              if (!input.provider || input.provider === 'local') {
                // Local: Use event emitter
                const sub = createBufferedSubscription(ctx.ee, {
                  topics: [`serviceLogs:${input.service}`],
                  bufferSize: 200,
                  perTickCap: 100
                })()
                const subscription = sub.subscribe({
                  next: (data) => emit.next(data),
                  error: (err) => emit.error(err),
                  complete: () => emit.complete(),
                });
                cleanup = () => subscription.unsubscribe();
              } else {
                // Remote: Poll provider
                const provider = getProvider(input.provider);
                if (!provider) {
                  // Fallback to local if provider not found (or treat as error)
                  apiLogger.warn({ provider: input.provider }, '[logs.tail] Provider not found, falling back to local events');
                  const sub = createBufferedSubscription(ctx.ee, { topics: [`serviceLogs:${input.service}`] })()
                  const subscription = sub.subscribe({
                    next: (data) => emit.next(data),
                    error: (err) => emit.error(err),
                    complete: () => emit.complete(),
                  });
                  cleanup = () => subscription.unsubscribe();
                  return;
                }

                apiLogger.info({ provider: input.provider, stackId: input.stackId }, '[logs.tail] Polling provider logs');
                const credentials = await getProviderCredentials(input.provider, ctx.db, (ctx as any).userId);

                let lastTimestamp = 0;

                const poll = async () => {
                  try {
                    const logs = await provider.getLogs({
                      deploymentId: input.stackId,
                      credentials,
                      limit: 50,
                      startTime: lastTimestamp
                    });

                    // Deduplicate key could be needed, but for now relying on provider
                    for (const log of logs) {
                      const ts = new Date(log.timestamp).getTime();
                      if (ts > lastTimestamp) {
                        emit.next({
                          ts,
                          line: log.message,
                          level: log.level || 'info'
                        });
                        lastTimestamp = ts;
                      }
                    }
                  } catch (err) {
                    apiLogger.error({ err, provider: input.provider }, '[logs.tail] Error polling provider');
                  }
                };

                await poll(); // Initial fetch
                const interval = setInterval(poll, 5000); // Poll every 5s
                cleanup = () => clearInterval(interval);
              }
            } catch (err) {
              apiLogger.error({ err }, '[logs.tail] Setup error');
              emit.error(err);
            }
          };

          run();
          return () => cleanup();
        });
      })
  }),

  deployOrchestratedStack: secureProcedure('sarge.oneclick.deployOrchestratedStack')
    .input(z.object({
      projectSlug: z.string(),
      owner: z.string(),
      repo: z.string(),
      branch: z.string().default('main'),
      serviceIds: z.array(z.string()), // e.g. ['vercel-nextjs', 'render-service']
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // 1. Resolve Project
      const projectRes = await ctx.db.query('SELECT id FROM projects WHERE slug = $1', [input.projectSlug])
      const projectId = projectRes.rows[0]?.id
      if (!projectId) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });

      const results = []
      const errors = []

      // Provider extraction map (fallback)
      const getProviderId = (id: string) => {
        if (id.startsWith('vercel-')) return 'vercel'
        if (id.startsWith('render-')) return 'render'
        if (id.startsWith('railway-')) return 'railway'
        if (id.startsWith('fly-')) return 'fly'
        if (id.startsWith('aws-')) return 'aws'
        if (id.startsWith('gcp-')) return 'gcp'
        if (id.startsWith('azure-')) return 'azure'
        if (id.startsWith('neon-')) return 'neon'
        if (id.startsWith('planetscale-')) return 'planetscale'
        if (id.startsWith('supabase-')) return 'supabase'
        if (id.startsWith('mongodb-')) return 'mongodb'
        return 'local'
      }

      for (const serviceId of input.serviceIds) {
        const providerId = getProviderId(serviceId)
        apiLogger.info({ serviceId, providerId }, '[OneClick] Orchestrating deployment')

        if (providerId === 'local') {
          results.push({ serviceId, providerId, status: 'manual_setup_required' })
          continue
        }

        const provider = getProvider(providerId)
        if (!provider) {
          errors.push(`Provider ${providerId} for service ${serviceId} not supported`)
          continue
        }

        try {
          const credentials = await getProviderCredentials(providerId, ctx.db, userId)

          // 2. Actually Deploy
          const deployResult = await provider.deploy({
            projectId: input.projectSlug,
            repoUrl: `https://github.com/${input.owner}/${input.repo}`,
            branch: input.branch,
            commit: 'HEAD',
            environmentName: 'production',
            credentials,
            env: { 'SARGE_MANAGED': 'true', 'SERVICE_ID': serviceId }
          })

          if (!deployResult.success) {
            errors.push(`${serviceId} deploy failed: ${deployResult.error}`)
            continue
          }

          // 3. Create Environment record
          const envRes = await ctx.db.query(
            `INSERT INTO environments (project_id, provider_id, name, type, status, provider_metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
            [
              projectId,
              providerId,
              `${serviceId}-prod`,
              'production',
              'active',
              JSON.stringify({ deploymentId: deployResult.deploymentId, url: deployResult.productionUrl })
            ]
          )
          const envId = envRes.rows[0].id

          // 4. Create Service record
          await ctx.db.query(
            `INSERT INTO services (environment_id, name, type, repo_url, branch, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [envId, serviceId, 'web', `https://github.com/${input.owner}/${input.repo}`, input.branch, 'deploying']
          )

          results.push({
            serviceId,
            providerId,
            success: true,
            url: deployResult.productionUrl || deployResult.previewUrl
          })
        } catch (err: any) {
          apiLogger.error({ err, serviceId }, '[OneClick] Deployment internal error')
          errors.push(`${serviceId} internal error: ${err.message}`)
        }
      }

      return {
        success: errors.length === 0,
        results,
        errors
      }
    }),

  streamConnected: secureProcedure('sarge.oneclick.streamConnected')
    .input(z.object({ owner: z.string(), repo: z.string() }))
    .subscription(({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const topic = `oneclick:connected:${userId}:${input.owner}/${input.repo}`
      return createBufferedSubscription(ctx.ee, { topics: [topic], bufferSize: 300, perTickCap: 50 })()
    }),

  toggleDocker: secureProcedure('sarge.oneclick.toggleDocker', { requiresRole: 'admin' })
    .input(ToggleDockerInput)
    .mutation(async ({ input }) => {
      process.env.DOCKER_MODE = input.enabled ? 'true' : 'false'
      return { ok: true, enabled: input.enabled }
    })
})

export type OneclickRouter = typeof oneclickRouter
