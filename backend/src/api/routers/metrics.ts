import { router, publicProcedure } from "../../trpc";
import { secureProcedure } from "../trpc/middlewares/security";
import createBufferedSubscription from "../lib/realtime";
import { startQueryTimer, setServiceCpu, setServiceMemoryBytes, observeServiceLatencyMs } from "../../metrics/exporter";
import { z } from "zod";

export const metricsRouter = router({
  latest: secureProcedure('metrics.latest').query(async ({ ctx }) => {
    const end = startQueryTimer('metrics.latest');
    try {
      const result = await ctx.db.query(
        `SELECT id, project_id, deployment_id, service_name,
                cpu_usage as cpu, memory_usage as memory, latency_ms as latency, 
                cost_daily as cost, uptime_percent, "timestamp"
         FROM metrics
         ORDER BY "timestamp" DESC
         LIMIT 1`
      );
      if (!result || !result.rows || result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      if (row && row.project_id) {
        if (typeof row.cpu === 'number') setServiceCpu(String(row.project_id), Number(row.cpu));
        if (typeof row.memory === 'number') setServiceMemoryBytes(String(row.project_id), Number(row.memory));
        if (typeof row.latency === 'number') observeServiceLatencyMs(String(row.project_id), Number(row.latency));
      }
      return row || null;
    } catch (e) {
      // If table is missing or DB unavailable, degrade gracefully
      try { console.warn('[metrics.latest] returning null:', (e as Error).message) } catch {}
      return null;
    } finally {
      end();
    }
  }),

  // Deprecated workspace metrics endpoints - workspaces removed
  getWorkspaceMetrics: secureProcedure('metrics.workspace')
    .input(z.object({
      workspaceId: z.string(),
      limit: z.number().default(100),
    }))
    .query(async () => {
      console.warn('[metrics.workspace] deprecated - workspaces removed')
      return []
    }),

  getWorkspaceHealth: secureProcedure('metrics.workspaceHealth')
    .input(z.object({
      workspaceId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      console.warn('[metrics.workspaceHealth] deprecated - workspaces removed')
      return input.workspaceId ? null : []
    }),

  // Deprecated workspace-based service metric recording
  recordServiceMetric: secureProcedure('metrics.record')
    .input(z.object({
      workspaceId: z.string(),
      deploymentId: z.number().optional(),
      serviceName: z.string(),
      port: z.number().optional(),
      status: z.enum(['running', 'stopped', 'error']).default('running'),
      cpuPercent: z.number().optional(),
      memoryMb: z.number().optional(),
      requestCount: z.number().default(0),
      errorCount: z.number().default(0),
      avgResponseMs: z.number().optional(),
      uptimeSeconds: z.number().default(0),
    }))
    .mutation(async () => {
      console.warn('[metrics.record] deprecated - workspaces removed')
      return null
    }),

  // Deprecated workspace health tracking
  updateWorkspaceHealth: secureProcedure('metrics.updateHealth')
    .input(z.object({
      workspaceId: z.string(),
      workspaceName: z.string(),
      overallGrade: z.string().optional(),
      gradeScore: z.number().optional(),
      avgUptime: z.number().optional(),
      avgResponseMs: z.number().optional(),
      activeServices: z.number().optional(),
      dailyCost: z.number().optional(),
    }))
    .mutation(async () => {
      console.warn('[metrics.updateHealth] deprecated - workspaces removed')
      return null
    }),

  // Deprecated workspace-based service metrics
  getServicesSummary: secureProcedure('metrics.servicesSummary')
    .query(async () => {
      console.warn('[metrics.servicesSummary] deprecated - workspaces removed')
      return []
    }),

  live: secureProcedure('metrics.live').subscription(
    createBufferedSubscription("metrics:new", { bufferSize: 100 })
  ),
});
