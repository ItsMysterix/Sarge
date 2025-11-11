# Sarge

<!-- chore: trigger vercel build (2025-11-11) -->
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
 - ANTHROPIC_API_KEY (optional) to enable AI Co-Pilot analysis features
 - ENABLE_AI_ANALYSIS=true (optional flag to gate AI features)

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

## Vercel Environment Variables
Set these in your Vercel project (Production + Preview). If a variable is optional, the platform will fall back to mock data or hide that feature.

| Name | Required | Purpose |
|------|----------|---------|
| DATABASE_URL | Recommended (required for persistence) | Neon Postgres connection string (use psql or Dashboard to copy). |
| NEXTAUTH_SECRET | Yes (if auth enabled) | Auth.js session encryption secret. Generate with `openssl rand -hex 32`. |
| NEXTAUTH_URL | Yes (auth) | Public site URL (https://your-domain). |
| NEXT_PUBLIC_WS_URL | Optional | Override WS endpoint if running backend separately (e.g. wss://api.your-domain/ws). |
| PROM_METRICS_TOKEN | Optional (prod) | Token required for scraping protected metrics endpoint. |
| ANTHROPIC_API_KEY | Optional | Enables AI Co-Pilot suggestions & analysis. |
| ENABLE_AI_ANALYSIS | Optional | Feature flag to toggle AI components (set to `true`). |
| RATE_LIMIT_MAX | Optional | Override default rate limit bucket size. |
| RATE_LIMIT_WINDOW_SEC | Optional | Override rate limit window length. |
| WS_PORT | Optional (local only) | WebSocket server port (defaults to 3200 locally). |

Tips:
1. Keep secrets out of the client: only NEXT_PUBLIC_* vars are exposed.
2. If DATABASE_URL is absent, serverless routes will serve mock data for a smoother dev UX.
3. Rotate NEXTAUTH_SECRET if compromised; sessions become invalid immediately.
4. Use separate DATABASE_URL for Preview vs Production to avoid mixing data.

## Contributing / License
- Internal project; contributions welcome via PRs.
- License: MIT.


