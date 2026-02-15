# Sarge

[![CI](https://github.com/ItsMysterix/Sarge/actions/workflows/ci.yml/badge.svg)](https://github.com/ItsMysterix/Sarge/actions/workflows/ci.yml)
[![Security Scan](https://github.com/ItsMysterix/Sarge/actions/workflows/security-scan.yml/badge.svg)](https://github.com/ItsMysterix/Sarge/actions/workflows/security-scan.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Sarge is a DevOps command center that consolidates deployment management, real-time log aggregation, infrastructure metrics, and multi-cloud orchestration into a single unified interface. It provides engineering teams with a centralized platform to monitor, deploy, and manage services across cloud providers without switching between vendor-specific consoles.

---

## What It Does

Sarge acts as a control plane for modern infrastructure. It connects to your cloud providers, ingests deployment and observability data, and presents it through a real-time dashboard backed by WebSocket subscriptions. The platform covers five core operational domains:

**Deployment Orchestration** -- Track, trigger, and roll back deployments across environments. Sarge maintains a complete deployment history with status tracking, build logs, and one-click rollback capability. Deployments are scoped to projects and environments, with support for preview environments tied to pull requests.

**Observability** -- Aggregate logs across services with structured filtering. Prometheus-compatible metrics are scraped and visualized through integrated Grafana dashboards. Alertmanager handles notification routing to Slack, email, or PagerDuty based on configurable thresholds and severity rules.

**Environment Management** -- Create, clone, and manage isolated environments (development, staging, production, preview) per project. Each environment maintains its own service configuration, secrets, and resource allocation. Environment cloning duplicates infrastructure state for rapid staging or feature branch testing.

**Multi-Cloud Governance** -- Connect multiple cloud provider credentials and manage infrastructure across AWS, GCP, Azure, Kubernetes, Vercel, and Render from a single interface. Role-based access control restricts operations by user, project, and environment. An audit log captures every mutation for compliance.

**Cost and Resource Intelligence** -- Track resource consumption and estimated monthly costs per project and provider. Budget alerts notify stakeholders when spending thresholds are reached. Idle environments can be configured to auto-stop after a defined period to reduce waste.

---

## Architecture

Sarge is split into two runtime processes that communicate over WebSockets using tRPC subscriptions.

```
Frontend (Next.js 14)                      Backend (Node.js)
---------------------                      -----------------
React 19 + TypeScript                      tRPC WebSocket Server
Auth.js (OAuth/OIDC)                       Event Emitter (pub/sub)
App Router                                 Neon Postgres (serverless)
Tailwind CSS                               Prometheus Metrics Endpoint

        <--- WebSocket (tRPC subscriptions) --->

Observability Stack
-------------------
Prometheus  -->  Grafana  -->  Alertmanager
```

The frontend handles authentication, routing, and rendering. The backend owns all data access, business logic, and real-time event distribution. Both layers are fully typed end-to-end through tRPC, eliminating runtime type mismatches between client and server.

The database layer uses Neon Postgres with connection pooling, row-level security on all user-facing tables, and automatic retention policies for high-volume operational data.

---

## Core Technical Characteristics

- **Real-time data flow** -- WebSocket subscriptions push deployment status, log entries, and metric updates to the browser without polling. The backend uses an event emitter pattern with buffered fan-out to handle concurrent connections efficiently.

- **End-to-end type safety** -- tRPC generates typed client bindings from server router definitions. Schema validation uses Zod on both input and output boundaries. There are no untyped API calls anywhere in the system.

- **Security hardened** -- Auth.js handles session management with encrypted JWTs. The middleware layer injects security headers (CSP, HSTS, X-Frame-Options) on every response. Authentication fails closed on errors. WebSocket connections require token validation. The database enforces row-level security policies for tenant isolation.

- **Production observability** -- Prometheus scrapes application metrics (request latency, error rates, WebSocket connection counts). Grafana provides pre-configured dashboards. Alertmanager routes notifications based on severity. Structured logging is used throughout the backend with context tags for traceability.

- **Multi-tenant by default** -- All data is scoped to authenticated users. Database queries filter by `user_id` at the application layer, and row-level security policies provide a second enforcement boundary at the database layer. RBAC policies restrict operations based on assigned roles per project and environment.

---

## Technology

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 14, React 19, TypeScript, Tailwind CSS, Auth.js |
| Backend | Node.js, TypeScript, tRPC, WebSocket, EventEmitter |
| Database | Neon Postgres (serverless, connection pooled) |
| Observability | Prometheus, Grafana, Alertmanager |
| Infrastructure | Docker, Kubernetes (Kustomize), Vercel, Render |
| Testing | Vitest, Playwright |
| CI/CD | GitHub Actions (lint, typecheck, build, test, coverage) |

---

## License

[MIT](LICENSE)
