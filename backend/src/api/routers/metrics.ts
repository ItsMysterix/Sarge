import { router, publicProcedure } from "../../trpc";
import { secureProcedure } from "../trpc/middlewares/security";
import createBufferedSubscription from "../lib/realtime";
import { startQueryTimer, setServiceCpu, setServiceMemoryBytes, observeServiceLatencyMs } from "../../metrics/exporter";

export const metricsRouter = router({
  latest: secureProcedure('metrics.latest').query(async ({ ctx }) => {
    const end = startQueryTimer('metrics.latest');
    const result = await ctx.db.query(
      `SELECT id, service_id, cpu, memory, latency, cost, "timestamp", created_at
       FROM metrics
       ORDER BY created_at DESC NULLS LAST, "timestamp" DESC NULLS LAST
       LIMIT 1`
    );
    end();
    const row = result.rows[0] ?? null;
    if (row) {
      if (row.service_id) {
        if (typeof row.cpu === 'number') setServiceCpu(String(row.service_id), Number(row.cpu));
        if (typeof row.memory === 'number') setServiceMemoryBytes(String(row.service_id), Number(row.memory));
        if (typeof row.latency === 'number') observeServiceLatencyMs(String(row.service_id), Number(row.latency));
      }
    }
    return row;
  }),

  live: secureProcedure('metrics.live').subscription(
    createBufferedSubscription("metrics:new", { bufferSize: 100 })
  ),
});
