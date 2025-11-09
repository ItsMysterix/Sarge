import { router, publicProcedure } from "../../trpc";
import { secureProcedure } from "../trpc/middlewares/security";
import createBufferedSubscription from "../lib/realtime";
import { startQueryTimer, setServiceCpu, setServiceMemoryBytes, observeServiceLatencyMs } from "../../metrics/exporter";

export const metricsRouter = router({
  latest: secureProcedure('metrics.latest').query(async ({ ctx }) => {
    const end = startQueryTimer('metrics.latest');
    const result = await ctx.db.query(
      `SELECT id, project_id, cpu_usage as cpu, memory_usage as memory, latency_ms as latency, cost_daily as cost, uptime_percent, "timestamp"
       FROM metrics
       ORDER BY "timestamp" DESC
       LIMIT 1`
    );
    end();
    const row = result.rows[0] ?? null;
    if (row) {
      if (row.project_id) {
        if (typeof row.cpu === 'number') setServiceCpu(String(row.project_id), Number(row.cpu));
        if (typeof row.memory === 'number') setServiceMemoryBytes(String(row.project_id), Number(row.memory));
        if (typeof row.latency === 'number') observeServiceLatencyMs(String(row.project_id), Number(row.latency));
      }
    }
    return row;
  }),

  live: secureProcedure('metrics.live').subscription(
    createBufferedSubscription("metrics:new", { bufferSize: 100 })
  ),
});
