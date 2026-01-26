# Sarge

[![CI](https://github.com/ItsMysterix/Sarge/actions/workflows/ci.yml/badge.svg)](https://github.com/ItsMysterix/Sarge/actions/workflows/ci.yml)
[![Release](https://github.com/ItsMysterix/Sarge/actions/workflows/release.yml/badge.svg)](https://github.com/ItsMysterix/Sarge/actions/workflows/release.yml)
[![Security Scan](https://github.com/ItsMysterix/Sarge/actions/workflows/security-scan.yml/badge.svg)](https://github.com/ItsMysterix/Sarge/actions/workflows/security-scan.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A **DevOps command center** for real-time deployments, logs, and metrics in a single UI. Built with **Next.js 14** + **TypeScript tRPC**, powered by **Neon Postgres**, and includes production-grade observability with **Prometheus**, **Grafana**, and **Alertmanager**.

## Features

- 🚀 **Deployment Management**: Track, trigger, and rollback deployments with real-time status
- 📊 **Live Metrics**: CPU, memory, latency, and custom Prometheus metrics
- 📝 **Aggregated Logs**: Filter and search logs across all services
- 🔔 **Alerting**: Prometheus rules + Slack/Email/PagerDuty notifications
- 🔐 **Secure**: Auth.js (OAuth/OIDC), RBAC, rate limiting, encrypted sessions
- 🎨 **Dark-first UI**: Tailwind CSS with modern design patterns
- 📦 **Multi-platform Deployments**: Local Docker, Kubernetes, Vercel, Railway, AWS, GCP, Azure
- 🏥 **Health Checks**: HTTP/TCP/Script probes with auto-retry
- 🌍 **Multi-cloud**: Traffic management, environment cloning, cost optimization
- 📈 **Scalable**: Handles 1000s of metrics/logs per second via buffered subscriptions

## Quick Start

### 1. Prerequisites
- **Node.js** 18+ (npm or pnpm)
- **PostgreSQL** database (Neon, local, or cloud)
- **GitHub OAuth app** (optional, for authentication)

### 2. Clone & Setup
```bash
git clone https://github.com/ItsMysterix/Sarge.git
cd Sarge

# Install dependencies
pnpm install  # or npm install

# Create environment file
cp .env.example .env.local
```

### 3. Configure `.env.local`
```env
# Database (required for data persistence)
DATABASE_URL=postgresql://user:password@localhost:5432/sarge

# Authentication (required to access the app)
NEXTAUTH_SECRET=generate-with: openssl rand -hex 32
NEXTAUTH_URL=http://localhost:3000

# WebSocket server (if backend runs on separate port)
NEXT_PUBLIC_WS_URL=ws://localhost:3200

# Optional: Observability
PROM_METRICS_TOKEN=your-prometheus-token

# Optional: AI features
ANTHROPIC_API_KEY=sk-...
ENABLE_AI_ANALYSIS=true
```

### 4. Run Locally
```bash
# Runs both frontend (port 3000) and backend (port 3200)
npm run dev

# Or run separately:
npm run dev:frontend  # Next.js on :3000
npm run dev:backend   # tRPC WS on :3200
```

Visit **http://localhost:3000** and sign in.

## Architecture

```
┌─────────────────────┐        WS (tRPC)       ┌──────────────────────┐
│  Next.js 14         │ ◄───────────────────► │ Backend (tRPC WS)    │
│  • React 19         │    ctx.ee events      │ • Node.js + ts-node  │
│  • Auth.js          │   (deploys/logs/      │ • Neon Postgres      │
│  • Tailwind CSS     │    metrics)           │ • Event emitter      │
└─────────┬───────────┘                       └──────────┬───────────┘
          │                                             │
          │ HTTP                                        │ Queries/Mutations
          │                                             │
          └────────────────────────────────────────────┘

Observability:
  Prometheus (metrics scrape)
  Grafana (dashboards)
  Alertmanager (notifications)
```

**Key characteristics:**
- **Real-time**: WebSocket subscriptions (deploys, logs, metrics)
- **Typed**: Full TypeScript on frontend & backend
- **Secure**: Auth.js with OAuth, RBAC, rate limiting
- **Observable**: Prometheus metrics + Grafana visualizations
- **Scalable**: Buffered subscriptions, database pooling

For detailed architecture, see [docs/ARCHITECTURE_COMPLETE.md](docs/ARCHITECTURE_COMPLETE.md).

## Deployment

### Local Development
```bash
npm run dev
```

### Docker Compose (Staging)
```bash
docker-compose -f compose.prod.yaml up
```

### Kubernetes (Production)
```bash
kustomize build bridge/overlays/prod | kubectl apply -f -
```

### Cloud Platforms
- **Vercel**: Frontend (built-in CI/CD)
- **Railway**: Backend + Database
- **Fly.io**: WebSocket server
- **AWS ECS**: Long-running services
- **GCP Cloud Run**: Serverless
- **Azure Container Apps**: Managed containers

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed guides.

## Development

### Project Structure
```
├── app/                 # Next.js 14 (App Router)
│   ├── api/            # Serverless routes
│   ├── deployments/    # Deployment history
│   ├── logs/           # Log viewer
│   ├── metrics/        # Metrics dashboard
│   ├── projects/       # Project management
│   ├── settings/       # User settings
│   └── ...
├── backend/            # tRPC WebSocket server
│   └── src/api/
│       ├── root.ts     # Router export
│       ├── routers/    # Feature routers
│       ├── lib/        # Utilities (DB, auth, etc.)
│       └── trpc/       # tRPC config & middleware
├── components/         # React components
├── lib/               # Shared utilities
├── docs/              # Documentation
└── bridge/            # Kubernetes manifests (Kustomize)
```

### Running Tests
```bash
# Backend
cd backend && npm test

# Frontend
npm run test

# E2E
npm run test:e2e
```

### Building for Production
```bash
npm run build   # Builds both frontend & backend
npm run start   # Runs production server
```

## Documentation

- **[Architecture](docs/ARCHITECTURE_COMPLETE.md)** — System design, data flow, components
- **[Development](docs/DEVELOPMENT.md)** — Local setup, testing, debugging
- **[Deployment](docs/DEPLOYMENT.md)** — Production deployment guides
- **[Monitoring](docs/MONITORING.md)** — Prometheus, Grafana, alerts
- **[Contributing](CONTRIBUTING.md)** — Code style, PR process, conventions

## Configuration

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Recommended | PostgreSQL connection string (Neon recommended) |
| `NEXTAUTH_SECRET` | Yes | Auth.js session encryption (generate: `openssl rand -hex 32`) |
| `NEXTAUTH_URL` | Yes | Public site URL (https://your-domain.com) |
| `NEXT_PUBLIC_WS_URL` | Optional | WS endpoint if backend separate (e.g., `wss://api.your-domain.com/ws`) |
| `PROM_METRICS_TOKEN` | Optional | Token for Prometheus scrape endpoint |
| `ANTHROPIC_API_KEY` | Optional | Enables AI Co-Pilot features |
| `ENABLE_AI_ANALYSIS` | Optional | Feature flag for AI components (set `true` to enable) |
| `RATE_LIMIT_MAX` | Optional | Rate limit bucket size (default: 100) |
| `RATE_LIMIT_WINDOW_SEC` | Optional | Rate limit window (default: 60) |
| `WS_PORT` | Optional | Backend WebSocket port (default: 3200, local only) |

**Tips:**
- Without `DATABASE_URL`, API routes gracefully degrade to mock data
- Keep secrets out of client—only `NEXT_PUBLIC_*` vars exposed to browser
- Rotate `NEXTAUTH_SECRET` if compromised (invalidates all sessions)

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS, Auth.js, tRPC
- **Backend**: Node.js, TypeScript, tRPC, EventEmitter
- **Database**: Neon Postgres (serverless)
- **Observability**: Prometheus, Grafana, Alertmanager
- **Deployment**: Docker, Kubernetes (Kustomize), Vercel, Railway, AWS, GCP, Azure
- **Testing**: Vitest, Playwright (E2E)
- **CI/CD**: GitHub Actions

## License

[MIT](LICENSE) — Internal project, contributions welcome.

## Support

- **Issues**: [GitHub Issues](https://github.com/ItsMysterix/Sarge/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ItsMysterix/Sarge/discussions)
