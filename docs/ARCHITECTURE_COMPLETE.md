# Sarge Architecture

A DevOps command center for real-time deployments, logs, and metrics. Built with Next.js 14 + TypeScript tRPC WebSocket backend, Neon Postgres, and production-grade observability (Prometheus, Grafana, Alertmanager).

## System Overview

```
┌─────────────────────┐        WS (tRPC)       ┌──────────────────────┐
│  Next.js 14 (app/)  │ ◄───────────────────► │ Backend (tRPC WS)    │
│  • Auth.js (OIDC)   │    ctx.ee events      │ • Routers            │
│  • Tailwind UI      │   (deploys/logs/      │ • Executor           │
│  • tRPC Client      │    metrics)           │ • Event Emitter      │
└─────────┬───────────┘                       └──────────┬───────────┘
          │                                             │
          │ HTTP (serverless)                          │ Queries/DML
          │                                             │
          │     ┌──────────────────────────────────────┘
          │     │
          └─────┼──► Neon Postgres (pooled)
                │
          ┌─────┴──────────────────────────────┐
          │                                     │
     Prometheus ◄── metrics scrape             │
        │                                      │
     Grafana ◄── queries                  Alertmanager
        │                                      │
        └──────────────── alerts ─────────────┘

Optional:
  Nginx (TLS, reverse proxy) ◄── frontend/backend traffic
  k8s manifests (Kustomize) ◄── production deployments
```

## Core Components

### Frontend: Next.js 14 (app/)
- **Authentication**: Auth.js (NextAuth.js) with OIDC (GitHub, Google, etc.)
- **UI Framework**: React 19 + Tailwind CSS
- **Type Safety**: TypeScript + tRPC client
- **Real-time**: WebSocket subscriptions to backend
- **State Management**: Zustand (`lib/store.ts`, `lib/sidebar-store.ts`)
- **Styling**: Dark-first theme with Tailwind utilities

**Key pages:**
- `app/page.tsx`: Dashboard (deployments, services, metrics)
- `app/deployments/`: Deployment history and details
- `app/logs/`: Aggregated log viewer with filters
- `app/metrics/`: Prometheus metrics visualization
- `app/projects/`: Project management
- `app/settings/`: User configuration (theme, notifications, integrations)
- `app/sign-in/`: Authentication entry point

**Layout & Navigation:**
- `app/layout.tsx`: Root layout with providers (Auth, tRPC, Theme)
- `middleware.ts`: Route protection (requires session unless public)
- `components/layout/sidebar.tsx`: Navigation sidebar with project switcher

### Backend: TypeScript tRPC WS (backend/src/api)
- **Server**: `ws-server.ts` (Node.js http + ws on port 3200)
- **Framework**: tRPC (`@trpc/server`) with superjson serializer
- **Database**: Neon Postgres via `@neondatabase/serverless`
- **Events**: In-process EventEmitter for real-time broadcasting
- **Type Export**: Backend types imported by frontend from `backend/src/api/root.ts`

**Key routers:**
- `routers/deploy.ts`: Deployment CRUD + subscription
- `routers/logs.ts`: Aggregated logs with filtering
- `routers/metrics.ts`: Prometheus metrics queries
- `routers/projects.ts`: Project management
- `routers/oneclick.ts`: One-click deployment wizard
- `routers/services.ts`: Service discovery and status
- `routers/stacks.ts`: Stack/workspace management
- `routers/sarge.ts`: Workspace snapshots, health checks, alerts

**Middleware:**
- `trpc/middlewares/security.ts`: Role-based access control (RBAC), license checks
- `trpc/middlewares/rate-limit.ts`: Rate limiting per connection/IP
- Payload size caps (`MAX_JSON_BODY_KB`)

### Database: Neon Postgres
- **Connection**: `DATABASE_URL` env var → `@neondatabase/serverless` (no persistent connection pool)
- **Schema**: Migrations in `backend/src/db` (SQL DDL files)
- **Key tables:**
  - `projects`: Team projects with metadata
  - `deployments`: Deployment history, status, logs
  - `services`: Running services and health
  - `metrics`: Time-series metrics snapshots
  - `alert_rules`: Alert configurations
  - `user_settings`: Per-user preferences (theme, notifications)
  - `traffic_configs`: Blue/green, canary deployment rules
  - `health_checks`: Health probe configurations
  - `database_instances`: Managed databases (PostgreSQL, MySQL, MongoDB, Redis)
  - `k8s_clusters`: Kubernetes cluster registrations
  - `environment_templates`: Environment cloning templates

### Observability Stack

#### Prometheus (prometheus.yml)
- **Scrape interval**: 15s
- **Metrics endpoint**: `http://localhost:3000/api/metrics` (protected)
- **Recording rules**: `prometheus.yml` for aggregations
- **Alert rules**: `alerts.yml` (CPU, memory, deployment failures)

**Exported metrics:**
- `sarge_deployment_duration_seconds`: Deployment latency histogram
- `sarge_deployment_total`: Total deployments counter
- `sarge_service_cpu_percent`: Service CPU usage gauge
- `sarge_service_memory_bytes`: Service memory gauge
- `sarge_service_latency_ms`: Service request latency histogram
- Custom Grafana annotations for deployments

#### Grafana
- **Dashboards**: `grafana/dashboards/*.json`
  - Service Overview (latency, error rate, P99)
  - Deployment Timeline (status, duration, rollback events)
  - Resource Usage (CPU, memory per service)
  - Alerts Active (current firing alerts)
- **Data source**: Prometheus
- **Port**: 3000 (shared with Next.js in dev; separate in prod)

#### Alertmanager
- **Config**: `alertmanager.yml`
- **Routes**: Alert rules → notification channels (Slack, Email, PagerDuty)
- **Grouping**: By alertname + labels
- **Repeat interval**: 1h

### Deployment Executor
- **Location**: `backend/src/api/routers/deploy.ts` + background worker
- **Event-driven**: Watches `deployments` table for `pending` status
- **Workflow**:
  1. User creates deployment via UI (POST → DB `INSERT`)
  2. Backend emits `deploys:enqueue` event
  3. Executor polls/subscribes to `pending` deployments
  4. For each: builds, pushes to GHCR, updates k8s manifests or Compose
  5. Emits `deploys:log` and `deploys:update` events (streamed to clients)
  6. Updates `status` → `running` → `success/failure`

**Supported targets:**
- Docker Compose (local dev)
- Kubernetes (k8s YAML + Kustomize overlays in `bridge/`)
- EC2 + Nginx + TLS
- Cloud platforms: Vercel, Railway, Fly.io, AWS, GCP, Azure (via provider abstraction)

### Serverless API Routes (app/api)
- **Purpose**: Ancillary operations not streaming over WS
- **Auth**: Session-based (Auth.js)
- **Examples**:
  - `app/api/auth/[...nextauth]/route.ts`: OAuth redirect handlers
  - `app/api/metrics`: Prometheus scrape endpoint (token-protected)
  - `app/api/deployments/route.ts`: GET deployments (with mock fallback if DB unavailable)
  - `app/api/deploy/route.ts`: POST deployment request
  - `app/api/integrations/*`: GitHub, Slack, webhook handlers

**Mock-first pattern**: All API routes include fallback mock data if DB is unavailable (improves dev UX).

---

## Data Flow

### Deploy Lifecycle

```
User clicks "Deploy"
    │
    ├─► Frontend: POST /api/deploy or tRPC deploy.create()
    │
    ├─► Backend: INSERT INTO deployments { status: 'pending' }
    │       └─► ctx.ee.emit('deploys:enqueue', { id })
    │
    ├─► Executor polls `deployments` WHERE status = 'pending'
    │       └─► For each: fetch blueprint, build, push, apply
    │
    ├─► UPDATE deployments { status: 'running', log: '...' }
    │       └─► ctx.ee.emit('deploys:log', { id, message })
    │
    ├─► Frontend subscription receives buffered events
    │       └─► display log stream, progress bar
    │
    ├─► On complete: UPDATE deployments { status: 'success' }
    │       └─► ctx.ee.emit('deploys:update', { id, status })
    │
    └─► Frontend shows completion, metrics updated to Prometheus
```

### Log Stream

```
Service writes logs
    │
    ├─► Docker: stdout/stderr → local JSON logfile
    │   Kubernetes: container logs → pod events
    │
    ├─► Backend polls logs (via `docker logs` or `kubectl logs`)
    │   → INSERT INTO logs { service_id, timestamp, message }
    │
    ├─► ctx.ee.emit('logs:new', { service, line })
    │
    ├─► Frontend tRPC.logs.tail() subscription receives events
    │   → Buffered (500 events/tick, cap 100/tick)
    │
    └─► UI virtual scroller displays latest 10k lines
```

### Metrics Flow

```
Service metric produced (e.g., request latency)
    │
    ├─► Service exports to Prometheus text format
    │   (via prom-client or HTTP handler)
    │
    ├─► Prometheus scrapes every 15s
    │   → Stores time-series in TSDB
    │
    ├─► Backend tRPC.metrics.live() queries latest snapshot
    │   → SELECT * FROM metrics WHERE project_id = ? LIMIT 100
    │
    ├─► Backend returns gauge + histogram for UI
    │
    ├─► Frontend charts update via subscription
    │   (line chart, gauge, sparklines)
    │
    └─► Alertmanager evaluates rules against TSDB
        → Fires alerts if threshold exceeded
```

---

## Event Topics & Subscriptions

All real-time updates flow via in-process EventEmitter (`ctx.ee`) to WebSocket clients.

### Deployment Events
- **Topic**: `deploys:*`
- **Events**:
  - `deploys:enqueue` → { id, projectId }
  - `deploys:update` → { id, status, summary }
  - `deploys:log` → { id, message, timestamp }
  - `deploys:rollback` → { id, reason }
- **Buffer**: 50 events, 100 per tick (per-subscription predicate by ID)

### Log Events
- **Topic**: `logs:*`
- **Events**:
  - `logs:new` → { service, level, message, timestamp }
- **Buffer**: 500 events, 100 per tick

### Metric Events
- **Topic**: `metrics:*`
- **Events**:
  - `metrics:new` → { service, cpu, memory, latency }
- **Buffer**: 100 events, 50 per tick

---

## Security Model

### Authentication (Auth.js)
- **Providers**: OAuth (GitHub, Google) + email/password
- **Sessions**: Database-backed (secure, httpOnly cookies)
- **Protected routes**: Enforced in `middleware.ts`
- **Public routes**: `/sign-in`, `/sign-up`, `/landing`

### Authorization (RBAC)
- **Roles**: admin, operator, viewer
- **Permissions**:
  - `admin`: all CRUD + user management
  - `operator`: deploy, restart, scale
  - `viewer`: read-only access
- **Enforced via**: `secureProcedure('scope', { requiresRole: 'operator' })` middleware

### Rate Limiting
- **Per-connection**: `MAX_WS_SUBSCRIPTIONS_PER_CONN` (10 default)
- **Per-minute**: `MAX_WS_MSGS_PER_MIN` (100 default)
- **Payload caps**: `MAX_JSON_BODY_KB` (10 MB default)
- **Env overrides**: `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SEC`

### Secrets Management
- **Environment variables**: `.env.local` (dev), platform secrets (prod)
- **Encrypted in transit**: WS over TLS (wss://)
- **DB credentials**: Pooled via `@neondatabase/serverless`
- **GitHub token**: For CI/CD (if GitHub integration enabled)

---

## Deployment Modes

### Local Development
```bash
npm run dev  # Runs frontend + backend concurrently
# Frontend: http://localhost:3000
# Backend WS: ws://localhost:3200
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000/grafana (reverse-proxied)
```

### Docker Compose (Staging/Prod)
```yaml
# compose.prod.yaml
services:
  frontend:    # Next.js container
  backend:     # tRPC WS container
  postgres:    # Neon local replica or managed DB
  prometheus:  # Metrics collection
  grafana:     # Visualization
  alertmanager: # Alert routing
  nginx:       # TLS + reverse proxy (optional)
```

### Kubernetes (Production)
```
bridge/
  base/kustomization.yaml
  overlays/
    dev/        # dev environment
    staging/    # staging environment
    prod/       # production environment
```

Apply with: `kustomize build bridge/overlays/prod | kubectl apply -f -`

### Cloud Platforms (via Provider Abstraction)
- **Vercel**: Frontend deployment (build → CDN)
- **Railway**: Backend + database (Dockerfile → container)
- **Fly.io**: WebSocket server (Docker image)
- **AWS ECS**: Long-running services (Fargate/EC2)
- **GCP Cloud Run**: Serverless functions
- **Azure Container Apps**: Managed containers

---

## Type Safety & Code Generation

### Frontend Type Imports
```typescript
// lib/trpc.ts
import type { AppRouter } from '../backend/src/api/root'

// React components
import { trpc } from '@/lib/trpc'

// Fully typed:
const { data, isLoading } = trpc.metrics.latest.useQuery()
```

**Important**: Frontend types are imported directly from backend source (not published package). Moving `backend/src/api/root.ts` will break frontend.

### Serialization (superjson)
- **Frontend**: `lib/trpc-provider.tsx` transformer
- **Backend**: `backend/src/api/lib/trpc.ts` transformer
- **Handles**: Dates, Maps, Sets, BigInt, undefined (no custom classes)

---

## Development Workflow

### Running Locally
```bash
# 1. Install dependencies
pnpm install  # or npm install

# 2. Create .env.local
cp .env.example .env.local
# Set DATABASE_URL (optional; if missing, API routes use mock data)
# Set NEXTAUTH_SECRET, NEXTAUTH_URL
# Set NEXT_PUBLIC_WS_URL=ws://localhost:3200 (if backend on separate port)

# 3. Run both
npm run dev

# Or run separately:
npm run dev:frontend  # Next.js on :3000
npm run dev:backend   # tRPC WS on :3200
```

### Adding a New Backend Router
```typescript
// backend/src/api/routers/myfeature.ts
import { router, secureProcedure } from '../trpc'

export const myFeatureRouter = router({
  list: secureProcedure('myfeature.list')
    .query(async () => {
      // Database query
      return []
    }),
  
  create: secureProcedure('myfeature.create', { requiresRole: 'operator' })
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      // Insert to DB, emit event
      return { id: '123' }
    }),

  subscribe: secureProcedure('myfeature.subscribe')
    .subscription(async () => {
      // Return observable of events
    }),
})

// Register in backend/src/api/root.ts
export const appRouter = router({
  myfeature: myFeatureRouter,
  // ... other routers
})
```

### Testing
```bash
# Backend
cd backend && npm test

# Frontend
npm run test

# End-to-end
npm run test:e2e
```

---

## Performance & Scaling

### WebSocket Optimization
- **Subscription buffers**: Ring buffers (50-500 events) to prevent client overload
- **Per-tick caps**: 50-100 events per message to limit WS frame size
- **Predicates**: Filter events by ID before buffering (e.g., only my deployment logs)

### Database
- **Pooling**: Neon serverless auto-scales
- **Indexes**: On `project_id`, `created_at`, `status` for query performance
- **Partitioning**: Logs/metrics can be partitioned by `created_at` if >10M rows

### Frontend
- **Code splitting**: Route-based lazy loading via Next.js App Router
- **Virtual scrolling**: Log viewer renders only visible lines (10k+ rows efficient)
- **Memoization**: React.memo + useMemo for expensive renders

### Backend
- **Executor concurrency**: Single event loop (Node.js) handles all deployments
- **Graceful shutdown**: Drains in-flight deployments on SIGTERM
- **Health probes**: Kubernetes liveness/readiness checks via `/health` endpoint

---

## Troubleshooting

### WS Connection Fails
- **Check**: Backend running on port 3200?
- **Check**: `NEXT_PUBLIC_WS_URL` env var correct?
- **Fix**: `npm run dev:backend` in separate terminal

### No Database Data
- **Check**: `DATABASE_URL` set in `.env.local`?
- **Check**: Neon connection string valid?
- **Expected**: API routes return mock data if DB unavailable (graceful degradation)

### Deployments Not Running
- **Check**: Backend executor running? (`npm run dev:backend`)
- **Check**: DB table `deployments` exists?
- **Logs**: `backend/logs/*.json` for executor errors

### Missing Frontend Types
- **Issue**: TypeScript error about tRPC types
- **Fix**: Ensure `backend/src/api/root.ts` is at expected path (not moved/renamed)
- **Rebuild**: `npm run build` to regenerate types

---

## Related Documentation
- [Development Setup](DEVELOPMENT.md)
- [Deployment Guide](DEPLOYMENT.md)
- [API Reference](api/trpc.md)
- [Monitoring & Observability](MONITORING.md)
- [Contributing](../CONTRIBUTING.md)
