import { router } from '../trpc';
import { metricsRouter } from './routers/metrics';
import { logsRouter } from './routers/logs';
import { deployRouter } from './routers/deploy';
import { servicesRouter } from './routers/services';
import { sargeRouter } from './routers/sarge';
import { tracesRouter } from './routers/traces';
import { authRouter } from './routers/auth';
import { githubRouter } from './routers/github';
import { stacksRouter } from './routers/stacks';
import { awsRouter } from './routers/aws';
import { projectRouter } from './routers/project';
import { terminalRouter } from './routers/terminal';

export const appRouter = router({
  metrics: metricsRouter,
  logs: logsRouter,
  deploy: deployRouter,
  services: servicesRouter,
  traces: tracesRouter,
  auth: authRouter,
  sarge: sargeRouter,
  github: githubRouter,
  stacks: stacksRouter,
  aws: awsRouter,
  project: projectRouter,
  terminal: terminalRouter,
});

export type AppRouter = typeof appRouter;
