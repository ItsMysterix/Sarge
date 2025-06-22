import { t } from "../lib/trpc";
import { pool, ee } from "../lib/db";
import { z } from "zod";
import { Observable } from "rxjs";

export const logsRouter = t.router({
  recent: t.procedure
    .input(z.object({ type: z.string().optional() }))
    .query(async ({ input }) => {
      const type = input.type;
      const query = type && type !== "all"
        ? `SELECT * FROM logs WHERE type = $1 ORDER BY timestamp DESC LIMIT 100`
        : `SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100`;

      const params = type && type !== "all" ? [type] : [];
      const result = await pool.query(query, params);
      return result.rows;
    }),

  stream: t.procedure.subscription(() => {
    return new Observable<any>((emit) => {
      const handler = (data: any) => emit.next(data);
      ee.on("log", handler);
      return () => ee.off("log", handler);
    });
  }),
});
