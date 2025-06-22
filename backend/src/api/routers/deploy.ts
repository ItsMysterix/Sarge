import { t } from "../lib/trpc"
import { z } from "zod"
import { pool } from "../lib/db"
import { ee } from "../lib/events"
import { observable } from "@trpc/server/observable"

export const deployRouter = t.router({
  create: t.procedure
    .input(z.object({
      branch: z.string().default("main"),
      commit: z.string().optional(),
      summary: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const commit = input.commit || Math.random().toString(36).substring(2, 9)
      const summary = input.summary || `Deployment from ${input.branch}`

      const result = await pool.query(
        `INSERT INTO deployments (branch, commit, status, summary, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [input.branch, commit, "pending", summary]
      )

      const deployment = result.rows[0]
      ee.emit("deployment", { ...deployment, status: "started" })
      return deployment
    }),
  
    getDeployments: t.procedure.query(async () => {
  const result = await pool.query(
    `SELECT * FROM deployments ORDER BY created_at DESC LIMIT 50`
  )
  return result.rows
}),

  subscribe: t.procedure.subscription(() => {
    return observable<any>((emit) => {
      const handler = (data: any) => emit.next(data)
      ee.on("deployment", handler)
      return () => ee.off("deployment", handler)
    })
  }),
})
