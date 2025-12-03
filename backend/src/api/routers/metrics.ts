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
        `SELECT id, project_id, workspace_id, deployment_id, service_name,
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

  // Get metrics for a specific workspace
  getWorkspaceMetrics: secureProcedure('metrics.workspace')
    .input(z.object({
      workspaceId: z.string(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `SELECT * FROM service_metrics
           WHERE workspace_id = $1
           ORDER BY updated_at DESC
           LIMIT $2`,
          [input.workspaceId, input.limit]
        );
        return result.rows;
      } catch (e) {
        try { console.warn('[metrics.workspace] returning []:', (e as Error).message) } catch {}
        return [] as any[];
      }
    }),

  // Get workspace health score
  getWorkspaceHealth: secureProcedure('metrics.workspaceHealth')
    .input(z.object({
      workspaceId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        if (input.workspaceId) {
          const result = await ctx.db.query(
            `SELECT * FROM workspace_health WHERE workspace_id = $1`,
            [input.workspaceId]
          );
          return result.rows[0] || null;
        } else {
          // Get all workspace health scores
          const result = await ctx.db.query(
            `SELECT * FROM workspace_health ORDER BY grade_score DESC`
          );
          return result.rows;
        }
      } catch (e) {
        try { console.warn('[metrics.workspaceHealth] returning fallback:', (e as Error).message) } catch {}
        return input.workspaceId ? null : [] as any[];
      }
    }),

  // Record service metric
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
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        `INSERT INTO service_metrics (
          workspace_id, deployment_id, service_name, port, status,
          cpu_percent, memory_mb, request_count, error_count,
          avg_response_ms, uptime_seconds, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *`,
        [
          input.workspaceId,
          input.deploymentId || null,
          input.serviceName,
          input.port || null,
          input.status,
          input.cpuPercent || null,
          input.memoryMb || null,
          input.requestCount,
          input.errorCount,
          input.avgResponseMs || null,
          input.uptimeSeconds,
        ]
      );
      
      // Emit event for real-time updates
      ctx.ee.emit("metrics:new", result.rows[0]);
      
      return result.rows[0];
    }),

  // Update workspace health score
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
    .mutation(async ({ ctx, input }) => {
      // Upsert workspace health
      const result = await ctx.db.query(
        `INSERT INTO workspace_health (
          workspace_id, workspace_name, overall_grade, grade_score,
          avg_uptime, avg_response_ms, active_services, daily_cost, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (workspace_id) DO UPDATE SET
          workspace_name = EXCLUDED.workspace_name,
          overall_grade = COALESCE(EXCLUDED.overall_grade, workspace_health.overall_grade),
          grade_score = COALESCE(EXCLUDED.grade_score, workspace_health.grade_score),
          avg_uptime = COALESCE(EXCLUDED.avg_uptime, workspace_health.avg_uptime),
          avg_response_ms = COALESCE(EXCLUDED.avg_response_ms, workspace_health.avg_response_ms),
          active_services = COALESCE(EXCLUDED.active_services, workspace_health.active_services),
          daily_cost = COALESCE(EXCLUDED.daily_cost, workspace_health.daily_cost),
          updated_at = NOW()
        RETURNING *`,
        [
          input.workspaceId,
          input.workspaceName,
          input.overallGrade || null,
          input.gradeScore || null,
          input.avgUptime || null,
          input.avgResponseMs || null,
          input.activeServices || null,
          input.dailyCost || null,
        ]
      );
      
      return result.rows[0];
    }),

  // Get all service metrics summary
  getServicesSummary: secureProcedure('metrics.servicesSummary')
    .query(async ({ ctx }) => {
      try {
        const result = await ctx.db.query(
          `SELECT 
            sm.workspace_id,
            sm.service_name,
            sm.port,
            sm.status,
            AVG(sm.cpu_percent) as avg_cpu,
            AVG(sm.memory_mb) as avg_memory,
            SUM(sm.request_count) as total_requests,
            SUM(sm.error_count) as total_errors,
            AVG(sm.avg_response_ms) as avg_response,
            MAX(sm.updated_at) as last_updated
           FROM service_metrics sm
           WHERE sm.updated_at > NOW() - INTERVAL '24 hours'
           GROUP BY sm.workspace_id, sm.service_name, sm.port, sm.status
           ORDER BY sm.workspace_id, sm.service_name`
        );
        
        return result.rows;
      } catch (e) {
        try { console.warn('[metrics.servicesSummary] returning []:', (e as Error).message) } catch {}
        return [] as any[];
      }
    }),

  live: secureProcedure('metrics.live').subscription(
    createBufferedSubscription("metrics:new", { bufferSize: 100 })
  ),
});
