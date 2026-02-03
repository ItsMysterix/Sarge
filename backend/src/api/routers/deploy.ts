import { router, publicProcedure } from '../../trpc';
import { secureProcedure } from '../trpc/middlewares/security';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import createBufferedSubscription from '../lib/realtime';
import { startQueryTimer } from '../../metrics/exporter';
import { observable } from '@trpc/server/observable';
import { topicAll, topicOne } from '../lib/deployEmit';
import { getProvider } from '../lib/providers';
import { getProviderCredentials } from '../lib/credentials';

export const deployRouter = router({
  create: secureProcedure('deploy.create')
    .input(z.object({
      workspaceId: z.string().optional(), // Deprecated - kept for compatibility
      branch: z.string().default("main"),
      commit: z.string().optional(),
      summary: z.string().optional(),
      repoUrl: z.string().optional(), // GitHub repo URL to clone
      buildCommand: z.string().optional(), // Custom build command
      services: z.array(z.object({
        name: z.string(),
        port: z.number(),
        url: z.string(),
        status: z.enum(['starting', 'running', 'stopped', 'failed']).default('starting'),
      })).optional(),
      // Multi-provider fields
      provider: z.string().optional(), // 'vercel' | 'railway' | 'render' | 'aws' | 'cloudflare' | 'fly' | 'gcp' | 'azure'
      environment: z.string().optional(), // 'preview' | 'staging' | 'production'
    }))
    .mutation(async ({ ctx, input }) => {
      const end = startQueryTimer('deploy.create');
      const commit = input.commit ?? null;
      const provider = input.provider || 'aws'; // Default to AWS for backward compatibility
      const environment = input.environment || 'preview';

      // Build summary with provider/env metadata for parsing in UI
      let summary = input.summary ?? `Deployment from ${input.branch}`;
      summary = `[provider:${provider}] [env:${environment}] ${summary}`;

      const result = await ctx.db.query(
        `INSERT INTO deployments (
          branch, commit, status, summary, 
          services, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
        [
          input.branch,
          commit,
          "pending",
          summary,
          JSON.stringify(input.services || [])
        ]
      )
      end();

      if (!result || !result.rows || result.rows.length === 0) {
        throw new Error('Failed to create deployment record');
      }
      const deployment = result.rows[0]

      // Queue deployment for async execution
      if (deployment?.id != null) {
        ctx.ee.emit('deploys:enqueue', { id: deployment.id })
      }

      // If a provider is specified, attempt real deployment
      if (input.provider && input.provider !== 'aws') {
        try {
          const providerImpl = getProvider(input.provider)
          if (providerImpl) {
            // Get credentials from env vars or DB (auto-detects)
            const credentials = await getProviderCredentials(input.provider, ctx.db, (ctx as any).userId)
            const projectId = (ctx as any).projectId || 'sarge-project'

            const deployResult = await providerImpl.deploy({
              projectId,
              repoUrl: input.repoUrl || '',
              branch: input.branch,
              commit: input.commit || '',
              environmentName: (input.environment as 'preview' | 'staging' | 'production') || 'preview',
              credentials,
              buildCommand: input.buildCommand,
              env: {},
            })

            if (deployResult.success) {
              // Update deployment with provider metadata
              await ctx.db.query(
                `UPDATE deployments 
                 SET summary = $1, updated_at = NOW()
                 WHERE id = $2`,
                [`[provider:${input.provider}] [env:${environment}] ${input.summary || `Deployment from ${input.branch}`}`, deployment.id]
              )
            }
          }
        } catch (err) {
          console.error(`[deploy] Provider ${input.provider} integration error:`, err)
          // Fall back to local deployment simulation
        }
      }

      // Emit deployment event for real-time updates
      if (deployment?.id != null) {
        ctx.ee.emit("deploys:update", {
          id: deployment.id,
          workspaceId: input.workspaceId,
          status: 'pending',
          services: input.services || [],
          provider: input.provider,
          environment: input.environment,
        })
      }
      return deployment
    }),

  getDeployments: secureProcedure('deploy.get')
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(), // created_at ISO string
    }).optional())
    .query(async ({ ctx, input }) => {
      try {
        const limit = input?.limit || 50;
        const cursor = input?.cursor;

        const queryParams: any[] = [limit + 1];
        let query = `
          SELECT 
            id, branch, commit, status, summary, services,
            created_at, updated_at
          FROM deployments 
          WHERE 1=1
        `;

        if (cursor) {
          query += ` AND created_at < $2`;
          queryParams.push(cursor);
        }

        query += ` ORDER BY created_at DESC LIMIT $1`;

        const result = await ctx.db.query(query, queryParams);

        if (!result || !result.rows) {
          return { items: [], nextCursor: undefined };
        }

        // Parse JSON services column
        const items = result.rows.map(row => ({
          ...row,
          services: typeof row.services === 'string' ? JSON.parse(row.services) : row.services
        }));

        let nextCursor: string | undefined = undefined;
        if (items.length > limit) {
          const nextItem = items.pop();
          nextCursor = nextItem?.created_at?.toISOString();
        }

        return { items, nextCursor };
      } catch (e) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch deployments', cause: e as Error });
      }
    }),

  stats: secureProcedure('deploy.stats')
    .input(z.object({ projectId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      try {
        // Parallel queries for efficiency
        const [counts, todayCount] = await Promise.all([
          ctx.db.query(`
             SELECT 
               COUNT(*) as total,
               COUNT(CASE WHEN status = 'success' THEN 1 END) as success,
               COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
               COUNT(CASE WHEN status = 'running' OR status = 'pending' THEN 1 END) as active
             FROM deployments
           `),
          ctx.db.query(`
             SELECT COUNT(*) as count FROM deployments WHERE created_at >= $1
           `, [today.toISOString()])
        ]);

        const row = counts.rows[0];
        return {
          total: parseInt(row.total),
          success: parseInt(row.success),
          failed: parseInt(row.failed),
          active: parseInt(row.active),
          todayCount: parseInt(todayCount.rows[0].count),
          successRate: parseInt(row.total) > 0 ? (parseInt(row.success) / parseInt(row.total) * 100).toFixed(1) : '0.0'
        };
      } catch (e) {
        return { total: 0, success: 0, failed: 0, active: 0, todayCount: 0, successRate: '0.0' };
      }
    }),

  updateDeploymentStatus: secureProcedure('deploy.updateStatus')
    .input(z.object({
      deploymentId: z.string(),
      status: z.enum(['pending', 'running', 'success', 'failed', 'stopped']),
      services: z.array(z.object({
        name: z.string(),
        port: z.number(),
        url: z.string(),
        status: z.enum(['starting', 'running', 'stopped', 'failed']),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        `UPDATE deployments 
         SET status = $1, services = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [input.status, JSON.stringify(input.services || []), input.deploymentId]
      )

      if (!result || !result.rows || result.rows.length === 0) {
        return null;
      }
      const deployment = result.rows[0]

      // Emit update event
      if (deployment) {
        ctx.ee.emit("deploys:update", {
          id: deployment.id,
          status: deployment.status,
          services: input.services || [],
        })
      }

      return deployment
    }),

  stopDeployment: secureProcedure('deploy.stop')
    .input(z.object({ deploymentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        `UPDATE deployments 
         SET status = 'stopped', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [input.deploymentId]
      )

      if (!result || !result.rows || result.rows.length === 0) {
        return null;
      }
      const deployment = result.rows[0]

      if (deployment) {
        ctx.ee.emit("deploys:update", {
          id: deployment.id,
          status: 'stopped',
        })
      }

      return deployment
    }),

  getDeploymentLogs: secureProcedure('deploy.getLogs')
    .input(z.object({ deploymentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `SELECT id, step, type, message, timestamp 
           FROM deployment_logs 
           WHERE deployment_id = $1 
           ORDER BY timestamp ASC`,
          [input.deploymentId]
        )
        if (!result || !result.rows) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No deployment logs found' });
        }
        return result.rows;
      } catch (e) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch deployment logs', cause: e as Error });
      }
    }),

  subscribe: secureProcedure('deploy.subscribe')
    .input(z.object({ deploymentId: z.string().optional() }).optional())
    .subscription(({ ctx, input }) => {
      const id = input?.deploymentId;
      return observable<any>((emit) => {
        // Emit a one-time ready frame
        emit.next({ type: 'ready', id: id ?? '*' });
        const subFactory = createBufferedSubscription(ctx.ee, {
          topics: id ? [topicOne(id)] : [topicAll],
          perTickCap: 100,
          bufferSize: 50,
          predicate: id ? (ev) => ev?.id === id : undefined,
        });
        const inner = subFactory();
        const subscription = (inner as any).subscribe({
          next: (v: any) => emit.next(v),
          error: (e: any) => emit.error(e),
          complete: () => emit.complete(),
        });
        return () => subscription.unsubscribe?.();
      });
    }),

  // New: Deploy to a specific provider with full provider context
  deployToProvider: secureProcedure('deploy.deployToProvider')
    .input(z.object({
      providerId: z.string(), // 'vercel' | 'railway' | etc
      repoUrl: z.string(),
      branch: z.string().default('main'),
      commit: z.string().optional(),
      buildCommand: z.string().optional(),
      startCommand: z.string().optional(),
      environmentName: z.string().default('preview'), // 'preview' | 'staging' | 'production'
      resourceConfig: z.object({
        cpu: z.number().optional(),
        memory: z.number().optional(),
        replicas: z.number().optional(),
      }).optional(),
      env: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const provider = getProvider(input.providerId)
      if (!provider) {
        throw new Error(`Provider ${input.providerId} not supported`)
      }

      try {
        // Get provider-specific deploy credentials from env/DB
        const credentials = await getProviderCredentials(input.providerId, ctx.db, (ctx as any).userId)

        const deployResult = await provider.deploy({
          projectId: (ctx as any).projectId || 'sarge-project',
          repoUrl: input.repoUrl,
          branch: input.branch,
          commit: input.commit || '',
          environmentName: (input.environmentName as any) || 'preview',
          credentials,
          buildCommand: input.buildCommand,
          startCommand: input.startCommand,
          resourceConfig: input.resourceConfig,
          env: input.env ? Object.entries(input.env).reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {}) : {},
        })

        // Create deployment record
        const summary = `[provider:${input.providerId}] [env:${input.environmentName}] Deployed to ${provider.name}`
        const result = await ctx.db.query(
          `INSERT INTO deployments (
            branch, commit, status, summary, services, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
          [
            input.branch,
            input.commit || null,
            deployResult.success ? 'success' : 'failed',
            summary,
            JSON.stringify([])
          ]
        )

        if (result?.rows?.[0]) {
          ctx.ee.emit("deploys:update", {
            id: result.rows[0].id,
            status: deployResult.success ? 'success' : 'failed',
            provider: input.providerId,
            environment: input.environmentName,
            previewUrl: deployResult.previewUrl,
            productionUrl: deployResult.productionUrl,
          })
        }

        return {
          success: deployResult.success,
          deploymentId: result?.rows?.[0]?.id,
          previewUrl: deployResult.previewUrl,
          productionUrl: deployResult.productionUrl,
          error: deployResult.error,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Deploy failed'
        throw new Error(`${input.providerId} deploy error: ${message}`)
      }
    }),

  // Get estimated cost for provider + environment
  estimateCost: secureProcedure('deploy.estimateCost')
    .input(z.object({
      providerId: z.string(),
      environmentName: z.string(),
      resourceConfig: z.object({
        cpu: z.number().optional(),
        memory: z.number().optional(),
        storage: z.number().optional(),
      }).optional(),
    }))
    .query(async ({ input }) => {
      const provider = getProvider(input.providerId)
      if (!provider) {
        throw new Error(`Provider ${input.providerId} not supported`)
      }

      try {
        const cost = await provider.estimateCost({
          environmentName: input.environmentName,
          resourceConfig: input.resourceConfig,
        })
        return cost
      } catch (err) {
        console.error(`[deploy.estimateCost] Error:`, err)
        return { hourlyRate: 0, monthlyEstimate: 0, breakdown: {} }
      }
    }),

  // Get deployment status from provider
  getProviderStatus: secureProcedure('deploy.getProviderStatus')
    .input(z.object({
      providerId: z.string(),
      deploymentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const provider = getProvider(input.providerId)
      if (!provider) {
        throw new Error(`Provider ${input.providerId} not supported`)
      }

      try {
        const credentials = await getProviderCredentials(input.providerId, ctx.db, (ctx as any).userId)
        const status = await provider.getStatus({
          deploymentId: input.deploymentId,
          credentials,
        })
        return status
      } catch (err) {
        console.error(`[deploy.getProviderStatus] Error:`, err)
        return {
          status: 'unknown',
          progress: 0,
          message: 'Unable to fetch status',
        }
      }
    }),

  // Rollback to a previous deployment
  rollback: secureProcedure('deploy.rollback')
    .input(z.object({
      deploymentId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx as any).userId || 'system'

      try {
        // Get current deployment info
        const currentDeploy = await ctx.db.query(
          `SELECT id, branch, commit, status FROM deployments WHERE id = $1`,
          [input.deploymentId]
        )

        if (!currentDeploy?.rows?.[0]) {
          throw new Error('Deployment not found')
        }

        // Get previous successful deployment
        const previousDeploy = await ctx.db.query(
          `SELECT id, branch, commit FROM deployments 
           WHERE status = 'success' AND id != $1 AND created_at < (
             SELECT created_at FROM deployments WHERE id = $1
           )
           ORDER BY created_at DESC LIMIT 1`,
          [input.deploymentId]
        )

        if (!previousDeploy?.rows?.[0]) {
          throw new Error('No previous deployment to rollback to')
        }

        // Create rollback record
        const rollbackResult = await ctx.db.query(
          `INSERT INTO deployment_rollbacks (
            deployment_id, previous_deployment_id, reason, triggered_by, status, created_at
          ) VALUES ($1, $2, $3, $4, 'in-progress', NOW())
          RETURNING id`,
          [
            input.deploymentId,
            previousDeploy.rows[0].id,
            input.reason || 'Manual rollback',
            userId
          ]
        ).catch((err: any) => {
          if (err?.message?.includes('deployment_rollbacks')) {
            console.warn('[deploy.rollback] Table not migrated yet')
            return { rows: [{ id: `rollback-${Date.now()}` }] }
          }
          throw err
        })

        // Mark current deployment as rolled back
        await ctx.db.query(
          `UPDATE deployments SET status = 'rolled-back', updated_at = NOW() WHERE id = $1`,
          [input.deploymentId]
        )

        // Log the rollback
        await ctx.db.query(
          `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, metadata, created_at)
           VALUES ('deployment.rolledback', 'deployment', $1, $2, $3, NOW())`,
          [input.deploymentId, userId, JSON.stringify({
            to: previousDeploy.rows[0].id,
            reason: input.reason
          })]
        ).catch(() => { })

        // Update rollback status
        await ctx.db.query(
          `UPDATE deployment_rollbacks SET status = 'completed', completed_at = NOW() WHERE id = $1`,
          [rollbackResult.rows[0].id]
        ).catch(() => { })

        return {
          success: true,
          rollbackId: rollbackResult.rows[0].id,
          previousDeploymentId: previousDeploy.rows[0].id,
        }
      } catch (err) {
        console.error('[deploy.rollback] Error:', err)
        throw err
      }
    }),

  // Get rollback history for a deployment
  getRollbackHistory: secureProcedure('deploy.getRollbackHistory')
    .input(z.object({
      deploymentId: z.string().optional(),
      projectId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        let query = `SELECT * FROM deployment_rollbacks`
        const params: any[] = []

        if (input.deploymentId) {
          query += ` WHERE deployment_id = $1 OR previous_deployment_id = $1`
          params.push(input.deploymentId)
        }

        query += ` ORDER BY created_at DESC LIMIT 50`

        const result = await ctx.db.query(query, params)
        if (!result || !result.rows) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No rollback history found' })
        }

        return result.rows
      } catch (err) {
        console.error('[deploy.getRollbackHistory] Error:', err)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch rollback history', cause: err as Error })
      }
    }),

  // Track deployment cost
  trackCost: secureProcedure('deploy.trackCost')
    .input(z.object({
      deploymentId: z.string(),
      projectId: z.string(),
      environmentId: z.string(),
      providerId: z.string(),
      hourlyRate: z.number(),
      monthlyEstimate: z.number(),
      breakdown: z.record(z.string(), z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `INSERT INTO cost_estimates (
            project_id, environment_id, provider_id, deployment_id,
            hourly_rate, monthly_estimate, breakdown, start_date, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING id`,
          [
            input.projectId,
            input.environmentId,
            input.providerId,
            input.deploymentId,
            input.hourlyRate,
            input.monthlyEstimate,
            JSON.stringify(input.breakdown)
          ]
        ).catch((err: any) => {
          if (err?.message?.includes('cost_estimates')) {
            console.warn('[deploy.trackCost] Table not migrated yet')
            return { rows: [{ id: `cost-${Date.now()}` }] }
          }
          throw err
        })

        return { costId: result.rows[0].id }
      } catch (err) {
        console.error('[deploy.trackCost] Error:', err)
        throw err
      }
    }),

  // Get cost history for a project/environment
  getCostHistory: secureProcedure('deploy.getCostHistory')
    .input(z.object({
      projectId: z.string(),
      environmentId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        let query = `SELECT * FROM cost_estimates WHERE project_id = $1`
        const params: any[] = [input.projectId]

        if (input.environmentId) {
          params.push(input.environmentId)
          query += ` AND environment_id = $${params.length}`
        }

        if (input.startDate) {
          params.push(input.startDate)
          query += ` AND start_date >= $${params.length}`
        }

        if (input.endDate) {
          params.push(input.endDate)
          query += ` AND start_date <= $${params.length}`
        }

        query += ` ORDER BY start_date DESC LIMIT 100`

        const result = await ctx.db.query(query, params).catch((err: any) => {
          if (err?.message?.includes('cost_estimates')) {
            return { rows: [] }
          }
          throw err
        })

        // Calculate totals
        const costs = result?.rows || []
        const totalMonthly = costs.reduce((sum, c) => sum + parseFloat(c.monthly_estimate || 0), 0)

        return {
          costs,
          totalMonthly,
          currency: 'USD',
        }
      } catch (err) {
        console.error('[deploy.getCostHistory] Error:', err)
        return { costs: [], totalMonthly: 0, currency: 'USD' }
      }
    }),
})
