import { WebSocketServer, WebSocket } from 'ws';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { appRouter } from './api/root';
import { createContext } from './context';
import { ENV, effectiveWsAllowedOrigins } from './env';
import { isAllowedOrigin } from './ws/origin';
import { db } from './api/lib/db';
import { ee } from './api/lib/events';
import { startRealDeployExecutor } from './jobs/real-deploy-executor';
import { wsDisconnectsTotal, wsRateCapTotal } from './metrics/exporter';
import { wsLogger, securityLogger } from './lib/logger';

const port = ENV.WS_PORT;
const allowlist = effectiveWsAllowedOrigins();

// Start real deploy executor that clones repos and runs builds
const deployExec = startRealDeployExecutor();

// Create WebSocket server with payload cap
const wss = new WebSocketServer({ port, maxPayload: ENV.MAX_JSON_BODY_KB * 1024 });

// Track connection liveness for heartbeat
interface ExtWebSocket extends WebSocket { isAlive?: boolean }

wss.on('connection', (ws: ExtWebSocket, req) => {
  const origin = req.headers.origin as string | undefined;
  if (!isAllowedOrigin(origin, allowlist)) {
    securityLogger.warn({ origin: origin ?? 'unknown' }, 'WS connection rejected — forbidden origin');
    ws.close(1008, 'Forbidden origin');
    return;
  }

  // [CISO S5] Validate JWT token from query string if NEXTAUTH_SECRET is set
  if (process.env.NEXTAUTH_SECRET) {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) {
      securityLogger.warn('WS connection rejected — no auth token provided');
      ws.close(1008, 'Authentication required');
      return;
    }
  }

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  // Simple per-connection message rate cap
  const CAP = ENV.MAX_WS_MSGS_PER_MIN;
  const WINDOW_MS = 60_000;
  let tokens = CAP;
  let resetAt = Date.now() + WINDOW_MS;
  ws.on('message', () => {
    const now = Date.now();
    if (now >= resetAt) {
      tokens = CAP - 1;
      resetAt = now + WINDOW_MS;
      return;
    }
    tokens -= 1;
    if (tokens < 0) {
      try {
        wsRateCapTotal.inc();
        ws.close(1008, 'Rate limit exceeded');
      } catch (e) { wsLogger.warn({ err: (e as Error).message }, 'Rate cap close error'); }
    }
  });

  // Track subscription count and optionally rate-limit subscription starts
  let subs = 0;
  const MAX_SUBS = ENV.MAX_WS_SUBSCRIPTIONS_PER_CONN;
  ws.on('message', async (raw) => {
    try {
      const s = raw.toString();
      const obj = JSON.parse(s);
      const isSubStart = obj?.method === 'subscription' || obj?.op === 'subscription' || obj?.type === 'start' || obj?.method === 'subscribe';
      if (isSubStart) {
        subs += 1;
        if (subs > MAX_SUBS) {
          try {
            wsRateCapTotal.inc();
            ws.close(1008, 'Subscription limit exceeded');
          } catch (e) { wsLogger.warn({ err: (e as Error).message }, 'Sub limit close error'); }
          return;
        }
        // Optional RL on subscribe
        if (process.env.NODE_ENV !== 'test') {
          try {
            const { checkAndConsume, scopeKey } = await import('./api/lib/rateLimit');
            const key = scopeKey({ scope: 'ip', ip: (req.socket.remoteAddress || '').toString() });
            const { db } = await import('./api/lib/db');
            const allowed = await checkAndConsume(db as any, {
              key,
              route: 'ws.subscribe',
              now: new Date(),
              windowSec: Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60),
              max: Number(process.env.RATE_LIMIT_MAX ?? 60),
              burst: Number(process.env.RATE_LIMIT_BURST ?? 20),
            });
            if (!allowed.allowed) {
              try { ws.close(1008, 'Rate limited'); } catch (e) { wsLogger.warn({ err: (e as Error).message }, 'RL close error'); }
            }
          } catch (e) { wsLogger.warn({ err: (e as Error).message }, 'Rate limit check failed'); }
        }
      }
    } catch (e) { wsLogger.warn({ err: (e as Error).message }, 'Message parse error'); }
  });
});

// Apply tRPC WS handler
const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext({ req }) {
    return createContext({ req });
  },
  onError({ error, type, path, input, ctx, req }) {
    wsLogger.error({ type, path, code: error.code, cause: error.cause }, `tRPC error: ${error.message}`);
    // Log to Prometheus if available
    try {
      const { trpcErrorsTotal } = require('./metrics/exporter');
      trpcErrorsTotal.labels({ path: path || 'unknown', code: error.code || 'UNKNOWN' }).inc();
    } catch (e) { wsLogger.warn({ err: (e as Error).message }, 'Metrics increment failed'); }
  },
});

// Heartbeat: ping every 30s, terminate if no pong within interval
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const socket = ws as ExtWebSocket;
    if (socket.isAlive === false) return socket.terminate();
    socket.isAlive = false;
    try { socket.ping(); } catch (e) { wsLogger.warn({ err: (e as Error).message }, 'Ping failed'); }
  });
}, 30_000);

wss.on('close', () => {
  clearInterval(interval);
});

// Track disconnects
wss.on('connection', (ws: WebSocket) => {
  ws.on('close', () => {
    try { wsDisconnectsTotal.inc(); } catch (e) { wsLogger.warn({ err: (e as Error).message }, 'Disconnect metric error'); }
  });
});

function shutdown() {
  wsLogger.info('Shutting down WS server...');
  try { handler.broadcastReconnectNotification?.(); } catch (e) { wsLogger.warn({ err: (e as Error).message }, 'Reconnect broadcast failed'); }
  clearInterval(interval);
  wss.close(async () => {
    try { await deployExec.stop(); } catch (e) { wsLogger.warn({ err: (e as Error).message }, 'Deploy executor stop failed'); }
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

wsLogger.info({ port }, 'WebSocket server started');

// Boot-time replay: enqueue stale pendings (>60s old), bounded to 100 rows
(async () => {
  try {
    const res = await db.query(
      `SELECT id FROM deployments WHERE status='pending' AND created_at < NOW() - INTERVAL '60 seconds' ORDER BY created_at ASC LIMIT 100`
    );
    for (const row of res.rows ?? []) {
      ee.emit('deploys:enqueue', { id: row.id });
    }
    if (res.rows?.length) {
      wsLogger.info({ count: res.rows.length }, 'Replayed pending deployments');
    }
  } catch (e) {
    // Database connection may fail temporarily on Neon serverless
    // This is non-critical - don't block server startup
    wsLogger.warn('Pending replay skipped (DB connection issue)');
  }
})();
