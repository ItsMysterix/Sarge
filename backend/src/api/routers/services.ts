import { router, publicProcedure } from "../../trpc"
import { secureProcedure } from "../trpc/middlewares/security"
import { z } from "zod"

export const servicesRouter = router({
  all: secureProcedure('services.all').query(async ({ ctx }) => {
    const result = await ctx.db.query("SELECT * FROM services ORDER BY name ASC")
    return result.rows
  }),

  uptime: secureProcedure('services.uptime')
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query(
        "SELECT * FROM service_uptime WHERE service_id = $1 ORDER BY timestamp DESC LIMIT 24",
        [input.id]
      )
      return result.rows.map((row: any) => ({
        timestamp: row.timestamp,
        value: Number(row.uptime_percent),
      }))
    }),
})
