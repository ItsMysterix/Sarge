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
import { repositoryRouter } from './routers/repository';
import { terminalRouter } from './routers/terminal';
import { providersRouter } from './routers/providers';
import { environmentsRouter } from './routers/environments';
import { secretsRouter } from './routers/secrets';
import { prPreviewsRouter } from './routers/pr-previews';
import { trafficRouter } from './routers/traffic';
import { healthChecksRouter } from './routers/health-checks';
import { databasesRouter } from './routers/databases';
import { alertsRouter } from './routers/alerts';
import { kubernetesRouter } from './routers/kubernetes';
import { costOptimizationRouter } from './routers/cost-optimization';
import { oneclickRouter } from './routers/oneclick';
import { auditLogsRouter } from './routers/audit-logs';
import { rustBridgeRouter } from './routers/rust-bridge';
import { domainsRouter } from './routers/domains';
import { membersRouter } from './routers/members';
import { tokensRouter } from './routers/tokens';
import { notificationRouter } from './routers/notification';
import { supportRouter } from './routers/support';
import { systemRouter } from './routers/system';
import { settingsRouter } from './routers/settings';
import { jobsRouter } from './routers/jobs';

export const appRouter = router({
  metrics: metricsRouter,
  logs: logsRouter,
  deploy: deployRouter,
  services: servicesRouter,
  settings: settingsRouter,
  traces: tracesRouter,
  auth: authRouter,
  sarge: sargeRouter,
  github: githubRouter,
  stacks: stacksRouter,
  aws: awsRouter,
  project: projectRouter,
  repository: repositoryRouter,
  terminal: terminalRouter,
  providers: providersRouter,
  environments: environmentsRouter,
  secrets: secretsRouter,
  prPreviews: prPreviewsRouter,
  traffic: trafficRouter,
  healthChecks: healthChecksRouter,
  databases: databasesRouter,
  alerts: alertsRouter,
  kubernetes: kubernetesRouter,
  costOptimization: costOptimizationRouter,
  oneclick: oneclickRouter,
  auditLogs: auditLogsRouter,
  rustBridge: rustBridgeRouter,
  domains: domainsRouter,
  members: membersRouter,
  tokens: tokensRouter,
  notification: notificationRouter,
  support: supportRouter,
  system: systemRouter,
  jobs: jobsRouter,
});

export type AppRouter = typeof appRouter;
