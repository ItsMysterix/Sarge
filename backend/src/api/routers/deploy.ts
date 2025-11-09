import { router, publicProcedure } from '../../trpc';
import { secureProcedure } from '../trpc/middlewares/security';
import { z } from 'zod';
import createBufferedSubscription from '../lib/realtime';
import { startQueryTimer } from '../../metrics/exporter';
import { observable } from '@trpc/server/observable';
import { topicAll, topicOne } from '../lib/deployEmit';
import { workspaceManager } from '../../services/workspace-manager';

export const deployRouter = router({
  create: secureProcedure('deploy.create')
    .input(z.object({
      workspaceId: z.string().optional(),
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
    }))
    .mutation(async ({ ctx, input }) => {
      const end = startQueryTimer('deploy.create');
      const commit = input.commit ?? null;
      const summary = input.summary ?? `Deployment from ${input.branch}`;
      
      let workspaceName = 'Unknown'
      let workspacePath = ''
      
      if (input.workspaceId) {
        const workspace = workspaceManager.getWorkspace(input.workspaceId)
        if (workspace) {
          workspaceName = workspace.name
          workspacePath = workspace.path
        }
      }

      const result = await ctx.db.query(
        `INSERT INTO deployments (
          workspace_id, workspace_name, workspace_path,
          branch, commit, status, summary, 
          services, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
        [
          input.workspaceId || null,
          workspaceName,
          workspacePath,
          input.branch, 
          commit, 
          "running", 
          summary,
          JSON.stringify(input.services || [])
        ]
      )
      end();

      const deployment = result.rows[0]
      
      // Emit deployment event for real-time updates
      if (deployment?.id != null) {
        ctx.ee.emit("deploys:update", { 
          id: deployment.id,
          workspaceId: input.workspaceId,
          status: 'running',
          services: input.services || [],
        })
      }
      return deployment
    }),
  
  getDeployments: secureProcedure('deploy.get').query(async ({ ctx }) => {
    const result = await ctx.db.query(
      `SELECT 
        id, workspace_id, workspace_name, workspace_path,
        branch, commit, status, summary, services,
        created_at, updated_at
       FROM deployments 
       ORDER BY created_at DESC 
       LIMIT 100`
    )
    
    // Parse JSON services column
    const deployments = result.rows.map(row => ({
      ...row,
      services: typeof row.services === 'string' ? JSON.parse(row.services) : row.services
    }))
    
    return deployments
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
      const result = await ctx.db.query(
        `SELECT id, step, type, message, timestamp 
         FROM deployment_logs 
         WHERE deployment_id = $1 
         ORDER BY timestamp ASC`,
        [input.deploymentId]
      )
      return result.rows
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
})
