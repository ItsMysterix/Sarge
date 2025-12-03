import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

// Configurable prefix with default
const METRICS_PREFIX = process.env.METRICS_PREFIX ?? 'sarge_';

// Single registry instance for the app
const registry = new Registry();
collectDefaultMetrics({ register: registry, prefix: METRICS_PREFIX });

// Domain metrics
export const requestsTotal = new Counter({
  name: `${METRICS_PREFIX}requests_total`,
  help: 'HTTP/tRPC requests',
  labelNames: ['route', 'method', 'status_class'],
  registers: [registry],
});

export const queryDurationSeconds = new Histogram({
  name: `${METRICS_PREFIX}query_duration_seconds`,
  help: 'DB/tRPC query duration',
  labelNames: ['query_name'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registry],
});

export const serviceCpuPercent = new Gauge({
  name: `${METRICS_PREFIX}service_cpu_percent`,
  help: 'Service CPU usage (percent 0-100)',
  labelNames: ['service_id'],
  registers: [registry],
});

export const serviceMemoryBytes = new Gauge({
  name: `${METRICS_PREFIX}service_memory_bytes`,
  help: 'Service memory bytes',
  labelNames: ['service_id'],
  registers: [registry],
});

export const serviceLatencyMs = new Histogram({
  name: `${METRICS_PREFIX}service_latency_ms`,
  help: 'Service latency ms',
  labelNames: ['service_id'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000],
  registers: [registry],
});

export const deploysTotal = new Counter({
  name: `${METRICS_PREFIX}deploys_total`,
  help: 'Deploy count by outcome',
  labelNames: ['status'],
  registers: [registry],
});

export const deploysRunning = new Gauge({
  name: `${METRICS_PREFIX}deploys_running`,
  help: 'Current number of running deployments',
  registers: [registry],
});

// Security/WS related counters for alerting
export const rateDeniedTotal = new Counter({
  name: `${METRICS_PREFIX}rate_denied_total`,
  help: 'Total number of rate limit denials',
  labelNames: ['route'],
  registers: [registry],
});

export const wsDisconnectsTotal = new Counter({
  name: `${METRICS_PREFIX}ws_disconnects_total`,
  help: 'Total number of WebSocket disconnects',
  registers: [registry],
});

export const wsRateCapTotal = new Counter({
  name: `${METRICS_PREFIX}ws_rate_cap_total`,
  help: 'Total number of times WS message/subscription rate cap was triggered',
  registers: [registry],
});

export const trpcErrorsTotal = new Counter({
  name: `${METRICS_PREFIX}trpc_errors_total`,
  help: 'Total number of tRPC errors',
  labelNames: ['path', 'code'],
  registers: [registry],
});

// Helper APIs
export function incRequest(route: string, method: string, statusClass: string) {
  requestsTotal.labels({ route, method, status_class: statusClass }).inc();
}

export function startQueryTimer(queryName: string) {
  const end = queryDurationSeconds.labels({ query_name: queryName }).startTimer();
  return () => end();
}

export function setServiceCpu(serviceId: string, percent: number) {
  serviceCpuPercent.labels({ service_id: serviceId }).set(percent);
}

export function setServiceMemoryBytes(serviceId: string, bytes: number) {
  serviceMemoryBytes.labels({ service_id: serviceId }).set(bytes);
}

export function observeServiceLatencyMs(serviceId: string, ms: number) {
  serviceLatencyMs.labels({ service_id: serviceId }).observe(ms);
}

export function incDeploy(status: string) {
  deploysTotal.labels({ status }).inc();
}

export async function getMetricsText() {
  return registry.metrics();
}

// Keep exported name 'register' for existing imports
export const register = registry;
export { registry };
