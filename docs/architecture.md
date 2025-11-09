# Architecture

Sarge is a DevOps command center: a Next.js App Router frontend with a tRPC WebSocket backend, streaming live deployments, logs, and metrics. Prometheus, Grafana, and Alertmanager provide observability. Optional Nginx terminates TLS and reverse-proxies services.

## Components

- Frontend: Next.js 14 (app/), Tailwind UI, tRPC React client over WebSocket
- Backend: TypeScript tRPC server (`backend/src/api/root.ts`) over WS; Neon Postgres for persistence
- Realtime: EventEmitter (`ctx.ee`) broadcasts topics for deploys/logs/metrics
- Observability: prom-client exporter, Prometheus rules, Grafana dashboards, Alertmanager routes
- Edge: Nginx for TLS and routing in production

## Data flow (high level)

1. Frontend subscribes to tRPC procedures over WebSocket (e.g., `metrics.live`, `logs.stream`, `deploy.subscribe`).
2. Backend routers query Neon and emit events via an in-process emitter.
3. Subscriptions buffer and rate-cap via `createBufferedSubscription` to protect clients.
4. Prometheus scrapes metrics; Alertmanager triggers alerts; Grafana visualizes.

## Event topics

- deploys: `deploys:*`, `deploys:update`, `deploys:log`, and `deploys:enqueue`
- logs: `logs:new`
- metrics: `metrics:new`

Buffers apply a per-tick cap and ring buffer size:
- Deploys: perTickCap=100, bufferSize=50 (single deploy subscription uses `predicate` by id)
- Logs: bufferSize=500, perTickCap=100
- Metrics: bufferSize=100

## Rate limits and guards

- WS message cap: `MAX_WS_MSGS_PER_MIN`
- Max per-connection subscriptions: `MAX_WS_SUBSCRIPTIONS_PER_CONN`
- API body cap: `MAX_JSON_BODY_KB`
- Optional RL on subscribe using `RATE_LIMIT_*` config

## Sequence: deploy lifecycle (ASCII)

```
Client        Backend WS           Executor          DB
  | create()    |                    |               |
  |-----------> | INSERT pending     |               |
  |             | emit enqueue ----> |               |
  |             |                    |  do work      |
  |             | <---- emit log/update (ee)         |
  |  subscribe  |-- buffered stream -+-------------->|
  |<=========== events (ready, log, update)          |
  |             |                    | UPDATE status |
  |             |                    |               |
```

## ASCII architecture diagram

```
+-------------------+           WS (tRPC)           +-------------------+
| Next.js (app/)    |  <------------------------>   | Backend (tRPC WS) |
|  - UI + TRPC      |                               |  - Routers        |
|  - Auth.js        |       ctx.ee events           |  - Executor       |
+---------+---------+        (deploys/logs/metrics) +----+--------------+
          ^                                           ^  |
          |                                           |  v
          | HTTP (API)*                               | Neon Postgres
          |                                           |
          |     Prometheus <-- scrape --+             |
          +---- Grafana ----- visualize |  +-- Alertmanager -- alerts
                Nginx (TLS) optional --> reverse proxy
```

*Note: Most data uses tRPC WS; some serverless API routes exist for ancillary functionality.
