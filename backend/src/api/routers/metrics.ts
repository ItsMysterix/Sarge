import { t } from "../lib/trpc";
import { pool, ee } from "../lib/db";
import { Observable } from "rxjs";

export const metricsRouter = t.router({
  latest: t.procedure.query(async () => {
    const result = await pool.query(`SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 1`);
    const metrics = result.rows[0] || generateMockMetrics();
    return metrics;
  }),

  live: t.procedure.subscription(() => {
    return new Observable<any>((emit) => {
      const handler = (data: any) => emit.next(data);
      ee.on("metric", handler);
      return () => ee.off("metric", handler);
    });
  }),
});

function generateMockMetrics() {
  return {
    id: Math.random().toString(36).substring(2, 9),
    cpu: 70 + Math.floor(Math.random() * 10),
    memory: 80 + Math.floor(Math.random() * 10),
    latency: 40 + Math.floor(Math.random() * 20),
    cost: 91.4 + Math.random() * 5,
    timestamp: new Date().toISOString(),
  };
}
