import { router, publicProcedure } from "../../trpc";
import { secureProcedure } from "../trpc/middlewares/security";
import createBufferedSubscription from "../lib/realtime";
import { startQueryTimer } from "../../metrics/exporter";
import { z } from "zod";

export const logsRouter = router({
  recent: secureProcedure('logs.recent')
    .input(z.object({
      type: z.string().optional(),
      service: z.string().optional(),
      search: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.number().int().positive().max(1000).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const end = startQueryTimer('logs.recent');
      try {
        const type = input.type;
        const service = input.service;
        const search = input.search;
        const limit = input.limit ?? 100;

        // Parse cursor if provided
        let cursorCreatedAt: string | null = null;
        let cursorId: string | number | null = null;
        if (input.cursor) {
          try {
            const decoded = JSON.parse(Buffer.from(input.cursor, 'base64').toString('utf8'));
            cursorCreatedAt = decoded.created_at ?? null;
            cursorId = decoded.id ?? null;
          } catch {}
        }

        // [v90f410f-NOCACHE] First, detect which columns exist
        let hasServiceId = false;
        let hasService = false;
        try {
          const schemaCheck = await ctx.db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'logs' 
            AND column_name IN ('service_id', 'service')
          `);
          const columns = schemaCheck?.rows?.map((r: any) => r.column_name) || [];
          hasServiceId = columns.includes('service_id');
          hasService = columns.includes('service');
        } catch (e) {
          console.warn('[logs.recent] Could not detect schema, assuming service column exists');
          hasService = true;
        }

        // Build SQL based on available columns
        const serviceCol = hasServiceId ? 'service_id' : (hasService ? 'service' : "'unknown'");
        const selects = `SELECT id, ${serviceCol} as service, type, message, "timestamp", created_at`;
        let sql = `${selects} FROM logs`;
        const params: any[] = [];
        const where: string[] = [];
        
        if (type && type !== 'all') {
          params.push(type);
          where.push(`type = $${params.length}`);
        }
        
        if (service && service !== 'all') {
          params.push(service);
          if (hasServiceId && hasService) {
            where.push(`(service_id = $${params.length} OR service = $${params.length})`);
          } else if (hasServiceId) {
            where.push(`service_id = $${params.length}`);
          } else if (hasService) {
            where.push(`service = $${params.length}`);
          }
        }
        
        if (search && search.length > 0) {
          params.push(`%${search}%`);
          if (hasServiceId && hasService) {
            where.push(`(message ILIKE $${params.length} OR service_id ILIKE $${params.length} OR service ILIKE $${params.length})`);
          } else if (hasServiceId) {
            where.push(`(message ILIKE $${params.length} OR service_id ILIKE $${params.length})`);
          } else if (hasService) {
            where.push(`(message ILIKE $${params.length} OR service ILIKE $${params.length})`);
          } else {
            where.push(`message ILIKE $${params.length}`);
          }
        }
        
        if (cursorCreatedAt && cursorId != null) {
          params.push(cursorCreatedAt);
          params.push(cursorId);
          where.push(`(created_at, id) < ($${params.length - 1}, $${params.length})`);
        }
        
        if (where.length) {
          sql += ` WHERE ${where.join(' AND ')}`;
        }
        
        sql += ` ORDER BY created_at DESC NULLS LAST, "timestamp" DESC NULLS LAST, id DESC`;
        params.push(limit);
        sql += ` LIMIT $${params.length}`;

        const result = await ctx.db.query(sql, params);

        const items = result?.rows || [];
        // nextCursor from last item
        let nextCursor: string | null = null;
        if (items.length > 0) {
          const last = items[items.length - 1];
          if (last) {
            nextCursor = Buffer.from(
              JSON.stringify({ created_at: last.created_at ?? last.timestamp ?? null, id: last.id })
            ).toString('base64');
          }
        }
        return { items, nextCursor };
      } catch (e) {
        try { console.warn('[logs.recent] returning empty:', (e as Error).message) } catch {}
        return { items: [], nextCursor: null } as { items: any[]; nextCursor: string | null };
      } finally {
        end();
      }
    }),
  
  services: secureProcedure('logs.services').query(async ({ ctx }) => {
    try {
      const result = await ctx.db.query(`
        SELECT DISTINCT COALESCE(service_id, service, 'unknown') as service 
        FROM logs 
        WHERE COALESCE(service_id, service) IS NOT NULL 
        ORDER BY COALESCE(service_id, service) ASC
      `);
      if (!result || !result.rows) {
        return [];
      }
      return result.rows.map((row: any) => row.service).filter(Boolean);
    } catch (e) {
      try { console.warn('[logs.services] returning []:', (e as Error).message) } catch {}
      return [];
    }
  }),

  // Fetch latest logs for a service (simple tail)
  tail: secureProcedure('logs.tail')
    .input(z.object({
      service: z.string().optional(),
      limit: z.number().int().positive().max(1000).default(100),
    }))
    .query(async ({ ctx, input }) => {
      const end = startQueryTimer('logs.tail');
      try {
        const params: any[] = [];
        let where = '';

        if (input.service && input.service !== 'all') {
          params.push(input.service);
          where = 'WHERE service = $1';
        }

        params.push(input.limit);

        const result = await ctx.db.query(
          `SELECT id, service, type, message, "timestamp", created_at
           FROM logs
           ${where}
           ORDER BY COALESCE("timestamp", created_at) DESC
           LIMIT $${params.length}`,
          params
        );

        return result?.rows || [];
      } catch (e) {
        try { console.warn('[logs.tail] returning []:', (e as Error).message) } catch {}
        return [];
      } finally {
        end();
      }
    }),

  // Search logs by message/service/time window
  search: secureProcedure('logs.search')
    .input(z.object({
      search: z.string().min(1),
      service: z.string().optional(),
      limit: z.number().int().positive().max(500).default(100),
    }))
    .query(async ({ ctx, input }) => {
      const end = startQueryTimer('logs.search');
      try {
        const params: any[] = [`%${input.search}%`];
        let where = 'WHERE message ILIKE $1';

        if (input.service && input.service !== 'all') {
          params.push(input.service);
          where += ` AND service = $${params.length}`;
        }

        params.push(input.limit);

        const result = await ctx.db.query(
          `SELECT id, service, type, message, "timestamp", created_at
           FROM logs
           ${where}
           ORDER BY COALESCE("timestamp", created_at) DESC
           LIMIT $${params.length}`,
          params
        );

        return result?.rows || [];
      } catch (e) {
        try { console.warn('[logs.search] returning []:', (e as Error).message) } catch {}
        return [];
      } finally {
        end();
      }
    }),

  stream: secureProcedure('logs.stream').subscription(
    createBufferedSubscription("logs:new", { bufferSize: 500, perTickCap: 100 })
  ),
});
