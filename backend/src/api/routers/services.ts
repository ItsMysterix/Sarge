import { t } from "../lib/trpc"
import { z } from "zod"
import { pool } from "../lib/db"

export const servicesRouter = t.router({
  all: t.procedure.query(async () => {
    const result = await pool.query("SELECT * FROM services ORDER BY name ASC")
    return result.rows
  }),

  uptime: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const result = await pool.query(
        "SELECT * FROM service_uptime WHERE service_id = $1 ORDER BY timestamp DESC LIMIT 24",
        [input.id]
      )
      return result.rows.map(row => ({
        timestamp: row.timestamp,
        value: Number(row.uptime_percent),
      }))
    }),
})
