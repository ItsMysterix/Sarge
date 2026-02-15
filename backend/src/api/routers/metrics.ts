import { router } from "../../trpc";
import { TRPCError } from '@trpc/server';
import { secureProcedure } from "../trpc/middlewares/security";
import createBufferedSubscription from "../lib/realtime";
import { startQueryTimer, setServiceCpu, setServiceMemoryBytes, observeServiceLatencyMs } from "../../metrics/exporter";
import { z } from "zod";
import { MetricAggregator } from "../../services/metric-aggregator";

const metricAggregator = new MetricAggregator();

export const metricsRouter = router({
  latest: secureProcedure('metrics.latest').query(async ({ ctx }) => {
    const end = startQueryTimer('metrics.latest');
    try {
      const result = await ctx.db.query(
        `SELECT id, project_id, deployment_id, service_name,
                cpu_usage as cpu, memory_usage as memory, latency_ms as latency, 
                cost_daily as cost, uptime_percent, "timestamp", created_at
         FROM metrics
         ORDER BY created_at DESC NULLS LAST, "timestamp" DESC NULLS LAST
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
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch latest metrics', cause: e as Error });
    } finally {
      end();
    }
  }),

  // Workspace/project metrics (now backed by metrics table)
  getWorkspaceMetrics: secureProcedure('metrics.workspace')
    .input(z.object({
      workspaceId: z.string(), // maps to project_id
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      const end = startQueryTimer('metrics.workspace');
      try {
        const result = await ctx.db.query(
          `SELECT id, project_id, deployment_id, service_name,
                  cpu_usage as cpu, memory_usage as memory, latency_ms as latency,
                  cost_daily as cost, uptime_percent, "timestamp"
           FROM metrics
           WHERE project_id = $1
           ORDER BY "timestamp" DESC
           LIMIT $2`,
          [input.workspaceId, input.limit]
        );
        return result?.rows || [];
      } catch (e) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch workspace metrics', cause: e as Error });
      } finally {
        end();
      }
    }),

  getWorkspaceHealth: secureProcedure('metrics.workspaceHealth')
    .input(z.object({
      workspaceId: z.string(), // maps to project_id
    }))
    .query(async ({ ctx, input }) => {
      const end = startQueryTimer('metrics.workspaceHealth');
      try {
        const result = await ctx.db.query(
          `SELECT
             COUNT(*) as samples,
             AVG(uptime_percent) as avg_uptime,
             AVG(latency_ms) as avg_latency_ms,
             MAX("timestamp") as last_seen,
             COUNT(DISTINCT service_name) as services
           FROM metrics
           WHERE project_id = $1`,
          [input.workspaceId]
        );
        return result?.rows?.[0] || null;
      } catch (e) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch workspace health', cause: e as Error });
      } finally {
        end();
      }
    }),

  // Record service metric sample into metrics table
  recordServiceMetric: secureProcedure('metrics.record')
    .input(z.object({
      workspaceId: z.string(), // maps to project_id
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
      const end = startQueryTimer('metrics.record');
      try {
        const result = await ctx.db.query(
          `INSERT INTO metrics (
             project_id, deployment_id, service_name,
             cpu_usage, memory_usage, latency_ms, cost_daily, uptime_percent, "timestamp"
           ) VALUES ($1, $2, $3, $4, $5, $6, 0, 99.9, NOW())
           RETURNING id`,
          [
            input.workspaceId,
            input.deploymentId ?? null,
            input.serviceName,
            input.cpuPercent ?? 0,
            input.memoryMb ?? 0,
            input.avgResponseMs ?? 0,
          ]
        );
        return { success: true, id: result.rows[0].id };
      } catch (e) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to record metric', cause: e as Error });
      } finally {
        end();
      }
    }),

  // Aggregate service summaries from metrics table
  getServicesSummary: secureProcedure('metrics.servicesSummary')
    .query(async ({ ctx }) => {
      const end = startQueryTimer('metrics.servicesSummary');
      try {
        const result = await ctx.db.query(
          `SELECT service_name,
                  COUNT(*) as samples,
                  AVG(cpu_usage) as cpu_avg,
                  AVG(memory_usage) as memory_avg,
                  AVG(latency_ms) as latency_avg,
                  MAX("timestamp") as last_seen
           FROM metrics
           WHERE service_name IS NOT NULL
           GROUP BY service_name
           ORDER BY last_seen DESC
           LIMIT 100`
        );
        return result?.rows || [];
      } catch (e) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch services summary', cause: e as Error });
      } finally {
        end();
      }
    }),

  live: secureProcedure('metrics.live').subscription(
    createBufferedSubscription("metrics:new", { bufferSize: 100 })
  ),

  /**
   * Get a calculated health score for a cross-platform stack.
   * Normalizes metrics and alerts on anomalies.
   */
  stackHealth: secureProcedure('metrics.stackHealth')
    .input(z.object({
      deployments: z.array(z.object({ deploymentId: z.string(), providerId: z.string() })),
    }))
    .query(async ({ ctx, input }) => {
      return metricAggregator.getStackHealth(input.deployments, ctx.db, (ctx as any).userId)
    }),
});
