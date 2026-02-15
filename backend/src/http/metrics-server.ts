import http from 'http';
import { register } from '../metrics/exporter';
import { metricsLogger } from '../lib/logger';

export type MetricsServerControls = { server: http.Server, port: number, close: () => Promise<void> };

export function startMetricsServer(port = Number(process.env.METRICS_PORT ?? 9464)): MetricsServerControls {
  // Very small per-IP rate guard: max 5 req / 10s per IP
  const buckets = new Map<string, { tokens: number; resetAt: number }>();
  const CAP = 5;
  const WINDOW_MS = 10_000;
  const now = () => Date.now();

  const server = http.createServer(async (req, res) => {
    if (req.method !== 'GET' || req.url !== '/metrics') { res.statusCode = 404; return res.end('Not found'); }

    const metricsEnable = process.env.METRICS_ENABLE ?? 'true';
    if (metricsEnable === 'false' || metricsEnable === '0' || metricsEnable === 'off') {
      res.statusCode = 503; return res.end('Metrics disabled');
    }

    // Optional bearer token auth when configured (recommended in prod)
    const token = process.env.PROM_METRICS_TOKEN;
    if (process.env.NODE_ENV !== 'test' && token && token.length > 0) {
      const auth = req.headers['authorization'] || '';
      const expected = `Bearer ${token}`;
      if (auth !== expected) {
        res.statusCode = 401; return res.end('Unauthorized');
      }
    }

    // Per-IP bucket
    const ip = (req.socket.remoteAddress || 'unknown').toString();
    const nowMs = now();
    const entry = buckets.get(ip);
    if (!entry || nowMs >= entry.resetAt) {
      buckets.set(ip, { tokens: CAP - 1, resetAt: nowMs + WINDOW_MS });
    } else {
      if (entry.tokens <= 0) { res.statusCode = 429; return res.end('Too Many Requests'); }
      entry.tokens -= 1;
    }

    try {
      res.setHeader('Content-Type', register.contentType);
      const body = await register.metrics();
      res.statusCode = 200;
      res.end(body);
    } catch (err) {
      res.statusCode = 500;
      res.end('Error generating metrics');
    }
  });

  server.listen(port, () => {
    metricsLogger.info({ port }, 'Metrics server started');
  });

  async function close() {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  return { server, port, close };
}

if (require.main === module) {
  const enabled = (process.env.METRICS_ENABLE ?? 'true');
  if (!(enabled === 'false' || enabled === '0' || enabled === 'off')) {
    startMetricsServer();
  }
}
