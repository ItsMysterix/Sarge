import { describe, test, expect } from 'vitest';
import { register, requestsTotal, queryDurationSeconds, serviceCpuPercent, serviceMemoryBytes, serviceLatencyMs, deploysTotal, startQueryTimer, incDeploy, incRequest, setServiceCpu, setServiceMemoryBytes, observeServiceLatencyMs } from '../src/metrics/exporter';

describe('metrics exporter', () => {
  test('registers expected metrics', async () => {
    const json = await (register as any).getMetricsAsJSON();
    const names = json.map((m: any) => m.name).sort();
    expect(names).toEqual(expect.arrayContaining([
      'sarge_requests_total',
      'sarge_query_duration_seconds',
      'sarge_service_cpu_percent',
      'sarge_service_memory_bytes',
      'sarge_service_latency_ms',
      'sarge_deploys_total',
    ]));
  });

  test('basic inc/observe/set work', async () => {
    incRequest('logs.recent', 'trpc', '2xx');
    const end = startQueryTimer('unit.test'); end();
    setServiceCpu('svc-1', 50);
    setServiceMemoryBytes('svc-1', 1024);
    observeServiceLatencyMs('svc-1', 25);
    incDeploy('pending');

    // Ensure metrics can be rendered
    const text = await register.metrics();
    expect(text).toContain('# HELP');
  });
});
