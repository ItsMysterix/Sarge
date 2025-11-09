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
    console.warn(`WS connection rejected due to origin: ${origin ?? 'unknown'}`);
    ws.close(1008, 'Forbidden origin');
    return;
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
      } catch {}
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
          } catch {}
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
              try { ws.close(1008, 'Rate limited'); } catch {}
            }
          } catch {}
        }
      }
    } catch {}
  });
});

// Apply tRPC WS handler
const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext({ req }) {
    return createContext({ req });
  },
});

// Heartbeat: ping every 30s, terminate if no pong within interval
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const socket = ws as ExtWebSocket;
    if (socket.isAlive === false) return socket.terminate();
    socket.isAlive = false;
    try { socket.ping(); } catch {}
  });
}, 30_000);

wss.on('close', () => {
  clearInterval(interval);
});

// Track disconnects
wss.on('connection', (ws: WebSocket) => {
  ws.on('close', () => {
    try { wsDisconnectsTotal.inc(); } catch {}
  });
});

function shutdown() {
  console.log('Shutting down WS server...');
  try { handler.broadcastReconnectNotification?.(); } catch {}
  clearInterval(interval);
  wss.close(async () => {
    try { await deployExec.stop(); } catch {}
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log(`WS listening on :${port}`);

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
      console.log(`Replayed ${res.rows.length} pending deployments`);
    }
  } catch (e) {
    console.warn('Pending replay failed:', e);
  }
})();
