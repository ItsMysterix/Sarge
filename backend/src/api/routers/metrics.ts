import { router } from "../../trpc";
import { TRPCError } from '@trpc/server';
import { secureProcedure } from "../trpc/middlewares/security";
import createBufferedSubscription from "../lib/realtime";
import { startQueryTimer, setServiceCpu, setServiceMemoryBytes, observeServiceLatencyMs } from "../../metrics/exporter";
import { z } from "zod";
import { MetricAggregator } from "../../services/metric-aggregator";

const metricAggregator = new MetricAggregator();

export const metricsRouter = router({
  latest: secureProcedure('metrics.latest')
    .input(z.object({ projectId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const end = startQueryTimer('metrics.latest');
      try {
        const sql = input?.projectId
          ? `SELECT id, project_id, deployment_id, service_name,
                    cpu_usage as cpu, memory_usage as memory, latency_ms as latency, 
                    cost_daily as cost, uptime_percent, "timestamp", created_at
             FROM metrics
             WHERE project_id = $1
             ORDER BY created_at DESC NULLS LAST, "timestamp" DESC NULLS LAST
             LIMIT 1`
          : `SELECT id, project_id, deployment_id, service_name,
                    cpu_usage as cpu, memory_usage as memory, latency_ms as latency, 
                    cost_daily as cost, uptime_percent, "timestamp", created_at
             FROM metrics
             ORDER BY created_at DESC NULLS LAST, "timestamp" DESC NULLS LAST
             LIMIT 1`;

        const params = input?.projectId ? [input.projectId] : [];
        const result = await ctx.db.query(sql, params);
        if (!result || !result.rows || result.rows.length === 0) {
          return null;
        }
        const row = result.rows[0] as any;
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

  /**
   * OpenTelemetry-compatible intake.
   * Maps OTel resource metrics to Sarge's unified metrics table.
   */
  otelIntake: secureProcedure('metrics.otelIntake')
    .input(z.object({
      resourceMetrics: z.array(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      const end = startQueryTimer('metrics.otelIntake');
      try {
        // Simple mapping from OTel schema to Sarge schema
        for (const rm of input.resourceMetrics) {
          const serviceName = rm.resource?.attributes?.find((a: any) => a.key === 'service.name')?.value?.stringValue || 'unknown-otel-service';
          const projectId = rm.resource?.attributes?.find((a: any) => a.key === 'sarge.project_id')?.value?.stringValue;

          if (!projectId) continue;

          for (const sm of rm.scopeMetrics || []) {
            for (const m of sm.metrics || []) {
              const name = m.name;
              const value = m.sum?.dataPoints?.[0]?.asDouble || m.gauge?.dataPoints?.[0]?.asDouble || 0;

              // Record based on metric name mapping
              let cpu = 0, memory = 0, latency = 0;
              if (name.includes('cpu')) cpu = value;
              if (name.includes('memory')) memory = value;
              if (name.includes('latency') || name.includes('duration')) latency = value;

              await ctx.db.query(
                `INSERT INTO metrics (
                   project_id, service_name, cpu_usage, memory_usage, latency_ms, "timestamp"
                 ) VALUES ($1, $2, $3, $4, $5, NOW())`,
                [projectId, serviceName, cpu, memory, latency]
              );
            }
          }
        }
        return { success: true };
      } catch (e) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to process OTel metrics', cause: e as Error });
      } finally {
        end();
      }
    }),
});
