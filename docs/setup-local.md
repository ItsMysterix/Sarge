# Local Setup

## Prerequisites
- Node.js 20+
- pnpm or npm
- Neon/Postgres URL (DATABASE_URL)
- Clerk keys (optional; app runs without, thanks to safe wrapper)
- Docker (optional: Prometheus/Grafana/Alertmanager locally)

## Steps

1) Copy envs

```bash
cp .env.example .env
```

Minimum to run:
- NEXT_PUBLIC_WS_URL (if WS runs on a separate port, e.g. ws://localhost:3200)
- DATABASE_URL (for real data; otherwise mock-first API routes return sample data)
- Clerk keys are optional; without them, the app runs in unauthenticated mode.

2) Install deps

```bash
pnpm i # or: npm i
```

3) Run dev servers

```bash
npm run dev
# runs Next.js (frontend) and the tRPC WS server concurrently
```

If you prefer separate terminals:

```bash
npm run dev:backend   # starts WS server
npm run dev:frontend  # starts Next.js app
```

4) (Optional) Run migrations

```bash
node backend/scripts/migrate.js # or provided scripts in scripts/*.sql
```

5) (Optional) Observability locally
- Prometheus/Alertmanager/Grafana are in the compose prod stack; for local, use the prod compose or run them separately.

## Troubleshooting
- WS URL mismatch: ensure `NEXT_PUBLIC_WS_URL` matches your WS server (port/host). If omitted, client defaults to ws(s)://<host>/ws.
- Metrics token: `PROM_METRICS_TOKEN` is required in production only.
- CORS: set `ALLOWED_ORIGINS` and `WS_ALLOWED_ORIGINS` for cross-origin WebSocket/API calls.
- Clerk: without real keys, auth UI is disabled; to test sign-in, provide `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
