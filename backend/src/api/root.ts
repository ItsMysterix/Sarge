import { t } from "./lib/trpc"
import { metricsRouter } from "./routers/metrics"
import { logsRouter } from "./routers/logs"
import { deployRouter } from "./routers/deploy"

export const appRouter = t.router({
  metrics: metricsRouter,
  logs: logsRouter,
  deploy: deployRouter,
})

export type AppRouter = typeof appRouter
