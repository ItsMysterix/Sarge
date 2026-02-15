import { router } from '../../trpc';
import { secureProcedure } from '../trpc/middlewares/security';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import createBufferedSubscription from '../lib/realtime';
import { startQueryTimer } from '../../metrics/exporter';
import { observable } from '@trpc/server/observable';
import { topicAll, topicOne } from '../lib/deployEmit';
import { getProvider } from '../lib/providers';
import { getProviderCredentials } from '../lib/credentials';

// Sub-module imports
import { deployToProvider, estimateCost, getProviderStatus } from './deploy/provider';
import { rollback, getRollbackHistory, trackCost, getCostHistory } from './deploy/rollback';

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
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch deployment stats', cause: e as Error });
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
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Deployment not found' });
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
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Deployment not found' });
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

  // --- Provider Integration (extracted to deploy/provider.ts) ---
  deployToProvider,
  estimateCost,
  getProviderStatus,

  // --- Rollback & Cost (extracted to deploy/rollback.ts) ---
  rollback,
  getRollbackHistory,
  trackCost,
  getCostHistory,
})
