import { router } from "../../trpc";
import { TRPCError } from '@trpc/server';
import { secureProcedure } from "../trpc/middlewares/security";
import createBufferedSubscription from "../lib/realtime";
import { startQueryTimer } from "../../metrics/exporter";
import { z } from "zod";
import { LogAggregator } from "../../services/log-aggregator";

const logAggregator = new LogAggregator();

export const logsRouter = router({
  // Advanced query for Vercel-style logs
  listing: secureProcedure('logs.listing')
    .input(z.object({
      projectId: z.string().optional(),
      environmentId: z.string().optional(),
      serviceId: z.string().optional(),
      levels: z.array(z.string()).optional(),
      methods: z.array(z.string()).optional(),
      statuses: z.array(z.number()).optional(),
      path: z.string().optional(),
      host: z.string().optional(),
      search: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.number().int().positive().max(1000).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const end = startQueryTimer('logs.listing');
      try {
        const selects = `SELECT id, project_id, environment_id, service_id, service, level, type, message, host, method, path, status, request_id, user_agent, duration, "timestamp", created_at`;
        let sql = `${selects} FROM logs`;
        const params: any[] = [];
        const where: string[] = [];

        if (input.projectId) {
          params.push(input.projectId);
          where.push(`project_id = $${params.length}`);
        }
        if (input.environmentId) {
          params.push(input.environmentId);
          where.push(`environment_id = $${params.length}`);
        }
        if (input.serviceId) {
          params.push(input.serviceId);
          where.push(`(service_id = $${params.length} OR service = $${params.length})`);
        }
        if (input.levels && input.levels.length > 0) {
          params.push(input.levels);
          where.push(`(level = ANY($${params.length}) OR type = ANY($${params.length}))`);
        }
        if (input.methods && input.methods.length > 0) {
          params.push(input.methods);
          where.push(`method = ANY($${params.length})`);
        }
        if (input.statuses && input.statuses.length > 0) {
          params.push(input.statuses);
          where.push(`status = ANY($${params.length})`);
        }
        if (input.path) {
          params.push(`%${input.path}%`);
          where.push(`path ILIKE $${params.length}`);
        }
        if (input.host) {
          params.push(input.host);
          where.push(`host = $${params.length}`);
        }
        if (input.search) {
          params.push(`%${input.search}%`);
          where.push(`(message ILIKE $${params.length} OR request_id ILIKE $${params.length})`);
        }
        if (input.startTime) {
          params.push(new Date(input.startTime));
          where.push(`COALESCE("timestamp", created_at) >= $${params.length}`);
        }
        if (input.endTime) {
          params.push(new Date(input.endTime));
          where.push(`COALESCE("timestamp", created_at) <= $${params.length}`);
        }

        if (input.cursor) {
          try {
            const decoded = JSON.parse(Buffer.from(input.cursor, 'base64').toString('utf8'));
            params.push(decoded.ts);
            params.push(decoded.id);
            where.push(`(COALESCE("timestamp", created_at), id) < ($${params.length - 1}, $${params.length})`);
          } catch { }
        }

        if (where.length) {
          sql += ` WHERE ${where.join(' AND ')}`;
        }

        sql += ` ORDER BY COALESCE("timestamp", created_at) DESC, id DESC`;
        params.push(input.limit);
        sql += ` LIMIT $${params.length}`;

        const result = await ctx.db.query(sql, params);
        const items = result?.rows || [];

        let nextCursor: string | null = null;
        if (items.length > 0 && items.length === input.limit) {
          const last = items[items.length - 1];
          nextCursor = Buffer.from(JSON.stringify({ ts: last.timestamp || last.created_at, id: last.id })).toString('base64');
        }

        return { items, nextCursor };
      } catch (e) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to query logs', cause: e as Error });
      } finally {
        end();
      }
    }),

  // Get metadata for filters (counts, unique values)
  metadata: secureProcedure('logs.metadata')
    .input(z.object({
      projectId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const projectId = input.projectId;
        const where = projectId ? `WHERE project_id = $1` : '';
        const params = projectId ? [projectId] : [];

        const [levels, methods, statuses, services] = await Promise.all([
          ctx.db.query(`SELECT level as value, COUNT(*) as count FROM logs ${where} GROUP BY level`, params),
          ctx.db.query(`SELECT method as value, COUNT(*) as count FROM logs ${where} GROUP BY method`, params),
          ctx.db.query(`SELECT status as value, COUNT(*) as count FROM logs ${where} GROUP BY status`, params),
          ctx.db.query(`SELECT COALESCE(service_id, service) as value, COUNT(*) as count FROM logs ${where} GROUP BY COALESCE(service_id, service)`, params),
        ]);

        return {
          levels: levels.rows,
          methods: methods.rows,
          statuses: statuses.rows,
          services: services.rows,
        };
      } catch (e) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch log metadata' });
      }
    }),

  // Ingest logs manually (for simulation/testing)
  ingest: secureProcedure('logs.ingest')
    .input(z.array(z.object({
      projectId: z.string().optional(),
      environmentId: z.string().optional(),
      serviceId: z.string().optional(),
      service: z.string().optional(),
      level: z.string().default('info'),
      message: z.string(),
      host: z.string().optional(),
      method: z.string().optional(),
      path: z.string().optional(),
      status: z.number().optional(),
      duration: z.number().optional(),
    })))
    .mutation(async ({ ctx, input }) => {
      try {
        for (const log of input) {
          const result = await ctx.db.query(
            `INSERT INTO logs 
             (project_id, environment_id, service_id, service, level, message, host, method, path, status, duration, created_at, "timestamp")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
             RETURNING id`,
            [log.projectId, log.environmentId, log.serviceId, log.service, log.level, log.message, log.host, log.method, log.path, log.status, log.duration]
          );

          // Emit for realtime
          ctx.ee.emit('logs:new', { ...log, id: result.rows[0].id, timestamp: new Date() });
        }
        return { success: true, count: input.length };
      } catch (e) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to ingest logs' });
      }
    }),

  stream: secureProcedure('logs.stream').subscription(
    createBufferedSubscription("logs:new", { bufferSize: 500, perTickCap: 100 })
  ),

  unified: secureProcedure('logs.unified')
    .input(z.object({
      deployments: z.array(z.object({ deploymentId: z.string(), providerId: z.string() })),
      startTime: z.number().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      return logAggregator.getUnifiedLogs(input.deployments, ctx.db, (ctx as any).userId, input)
    }),
});
