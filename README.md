# Sarge

[![CI](https://github.com/ItsMysterix/Sarge/actions/workflows/ci.yml/badge.svg)](https://github.com/ItsMysterix/Sarge/actions/workflows/ci.yml)
[![Release](https://github.com/ItsMysterix/Sarge/actions/workflows/release.yml/badge.svg)](https://github.com/ItsMysterix/Sarge/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Sarge is a DevOps command center: real-time deployments, logs, and metrics in one UI. It’s a Next.js 14 app talking to a TypeScript tRPC WebSocket backend on Neon Postgres, with production-grade observability (Prometheus, Alertmanager, Grafana) and optional Nginx + TLS.

## Quick Start (5 minutes)

1) Env

```bash
cp .env.example .env
```

Minimum values:
- DATABASE_URL (Neon) if you want real data (without it, API routes return mock data in dev)
- NEXT_PUBLIC_WS_URL (e.g. ws://localhost:3200) if your WS server runs on a separate port; otherwise it defaults to ws(s)://<host>/ws
- PROM_METRICS_TOKEN required only in production (not for local dev)
- NEXTAUTH_SECRET and NEXTAUTH_URL for Auth.js authentication

2) Install + run

```bash
pnpm i # or npm i
npm run dev
```

## Features by Epic
- 1) Core WS + tRPC: subscriptions for logs, metrics, deploys
- 2) Persistence: Neon-backed storage and migrations
- 3) Security: CORS, rate limits, payload caps, Auth.js authentication
- 4) CI/CD: preflight validation, GHCR build/push foundation
- 5) Observability: Prometheus metrics, Grafana dashboards, Alertmanager
- 6) Deploy executor: background worker and event topics
- 7) Logs UX: virtualized viewer, filters, streaming
- 8) Metrics UX: gauges, live updates
- 9) Alerts & runbooks: rules tested in CI, actionable guides
- 10) Production stack: Nginx/TLS/Compose for EC2

See docs for details:
- Architecture: `docs/architecture.md`
- Setup local: `docs/setup-local.md`
- CI/CD: `docs/ci-cd.md`
- Frontend UX: `docs/frontend-ux.md`
- Security: `docs/security.md`
- Alerts & Runbooks: `docs/runbooks/alerts.md`

## Architecture (ASCII)

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

*Most data uses tRPC WS; some serverless API routes exist for ancillary functionality.*

## Deploy to AWS EC2 (Free Tier)
See `docs/aws-ec2-free-tier.md` for a full guide.

## Production Stack (TLS + Nginx + Compose)
See `docs/prod-stack.md` and runbooks in `docs/runbooks/*`.

## API Reference (tRPC)
Auto-generated snapshot: `docs/api/trpc.md` (run `npm run docs:trpc`).

## Release Checklist
See `docs/release-checklist.md`.

## Contributing / License
- Internal project; contributions welcome via PRs.
- License: MIT.


