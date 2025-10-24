import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import http from 'http';
import { startMetricsServer, type MetricsServerControls } from '../src/http/metrics-server';

let serverCtl: MetricsServerControls;

describe('metrics server', () => {
  beforeAll(() => {
    serverCtl = startMetricsServer(0); // use ephemeral port
  });

  afterAll(async () => {
    await serverCtl.close();
  });

  test('GET /metrics returns text format', async () => {
    const address = serverCtl.server.address();
    const port = typeof address === 'object' && address && 'port' in address ? (address as any).port : serverCtl.port;
    const body = await new Promise<string>((resolve, reject) => {
      http.get({ hostname: '127.0.0.1', port, path: '/metrics' }, (res) => {
        try {
          expect(res.statusCode).toBe(200);
          expect(res.headers['content-type']).toContain('text/plain');
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        } catch (e) {
          reject(e);
        }
      }).on('error', reject);
    });

    expect(body).toContain('# HELP');
    expect(body).toContain('sarge_');
  });
});
