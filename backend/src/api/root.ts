import { router } from '../trpc';
import { metricsRouter } from './routers/metrics';
import { logsRouter } from './routers/logs';
import { deployRouter } from './routers/deploy';
import { servicesRouter } from './routers/services';

export const appRouter = router({
  metrics: metricsRouter,
  logs: logsRouter,
  deploy: deployRouter,
  services: servicesRouter,
});

export type AppRouter = typeof appRouter;
