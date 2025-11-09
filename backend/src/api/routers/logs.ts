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

      // Build SQL dynamically to keep parameter ordering correct
      const selects = `SELECT id, service_id, type, message, service, "timestamp", created_at`;
      let sql = `${selects} FROM logs`;
      const params: any[] = [];
      const where: string[] = [];
      
      if (type && type !== 'all') {
        params.push(type);
        where.push(`type = $${params.length}`);
      }
      
      if (service && service !== 'all') {
        params.push(service);
        where.push(`service = $${params.length}`);
      }
      
      if (search && search.length > 0) {
        params.push(`%${search}%`);
        where.push(`(message ILIKE $${params.length} OR service ILIKE $${params.length})`);
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
      end();

      const items = result.rows;
      // nextCursor from last item
      let nextCursor: string | null = null;
      if (items.length > 0) {
        const last = items[items.length - 1];
        nextCursor = Buffer.from(
          JSON.stringify({ created_at: last.created_at ?? last.timestamp ?? null, id: last.id })
        ).toString('base64');
      }
      return { items, nextCursor };
    }),
  
  services: secureProcedure('logs.services').query(async ({ ctx }) => {
    const result = await ctx.db.query(`
      SELECT DISTINCT service 
      FROM logs 
      WHERE service IS NOT NULL 
      ORDER BY service ASC
    `);
    return result.rows.map((row: any) => row.service);
  }),

  stream: secureProcedure('logs.stream').subscription(
    createBufferedSubscription("logs:new", { bufferSize: 500, perTickCap: 100 })
  ),
});
