import { router } from '../trpc';
import { metricsRouter } from './routers/metrics';
import { logsRouter } from './routers/logs';
import { deployRouter } from './routers/deploy';
import { servicesRouter } from './routers/services';
import { sargeRouter } from './routers/sarge';
import { tracesRouter } from './routers/traces';
import { authRouter } from './routers/auth';

export const appRouter = router({
  metrics: metricsRouter,
  logs: logsRouter,
  deploy: deployRouter,
  services: servicesRouter,
  traces: tracesRouter,
  auth: authRouter,
  sarge: sargeRouter,
});

export type AppRouter = typeof appRouter;
