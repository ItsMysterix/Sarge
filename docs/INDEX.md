# Documentation Index

Welcome to the Sarge documentation! Here's a guide to find what you're looking for.

## 🚀 Getting Started

**New to Sarge?**
- Start with [README.md](../README.md) — Project overview & quick start (5 minutes)
- Then: [DEVELOPMENT.md](DEVELOPMENT.md) — Local setup for developers

## 📚 Core Documentation

### For Everyone
- **[README.md](../README.md)** — What Sarge is, quick start, features overview
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** — How to contribute, code style, PR process

### For Developers
- **[DEVELOPMENT.md](DEVELOPMENT.md)** — Local setup, running code, debugging, testing
- **[ARCHITECTURE_COMPLETE.md](ARCHITECTURE_COMPLETE.md)** — Deep dive into system design, data flow, components
  - WebSocket subscriptions
  - Event topics
  - tRPC routers
  - Database schema
  - Authentication & authorization

### For DevOps / Operations
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Deploying to production
  - Local (Docker Compose)
  - Vercel (frontend)
  - Railway (backend)
  - Kubernetes
  - AWS ECS, Fly.io, Azure, GCP
  - SSL/TLS setup
  - Rollback procedures

- **[MONITORING.md](MONITORING.md)** — Observability setup
  - Prometheus configuration
  - Grafana dashboards
  - Alertmanager rules
  - Notification channels (Slack, Email, PagerDuty)
  - Alert creation & testing

## 📋 Common Tasks

### I want to...

**...understand how Sarge works**
→ [ARCHITECTURE_COMPLETE.md](ARCHITECTURE_COMPLETE.md) (system design, data flow)

**...set up a local development environment**
→ [DEVELOPMENT.md](DEVELOPMENT.md) (prerequisites, environment config, running locally)

**...add a new feature**
→ [CONTRIBUTING.md](../CONTRIBUTING.md) (code style, testing) + [DEVELOPMENT.md](DEVELOPMENT.md) (architecture)

**...deploy to production**
→ [DEPLOYMENT.md](DEPLOYMENT.md) (choose your platform: Vercel, Railway, K8s, etc.)

**...set up monitoring & alerts**
→ [MONITORING.md](MONITORING.md) (Prometheus, Grafana, Alertmanager)

**...fix a bug**
→ [DEVELOPMENT.md](DEVELOPMENT.md) (debugging, testing) + check GitHub Issues

**...contribute code**
→ [CONTRIBUTING.md](../CONTRIBUTING.md) (PR process, commit conventions, code style)

## 🏗️ Project Structure

```
Sarge/
├── README.md                          # Project overview
├── CONTRIBUTING.md                    # Contributor guide
├── package.json                       # Root dependencies
├── tsconfig.json                      # TypeScript config
├── pnpm-workspace.yaml                # Monorepo config
│
├── app/                               # Next.js 14 frontend
│   ├── api/                          # Serverless API routes
│   ├── deployments/                  # Deployment pages
│   ├── logs/                         # Log viewer
│   ├── metrics/                      # Metrics dashboard
│   ├── settings/                     # User settings
│   └── ...
│
├── backend/                           # tRPC WebSocket server
│   ├── src/api/
│   │   ├── root.ts                  # Main router
│   │   ├── ws-server.ts             # WS server entry
│   │   ├── routers/                 # Feature routers
│   │   └── lib/                     # Utilities
│   └── src/db/                      # Database schema
│
├── components/                        # Reusable React components
├── lib/                              # Shared utilities
├── public/                           # Static assets
│
├── docs/                             # Documentation (you are here)
│   ├── ARCHITECTURE_COMPLETE.md      # System design
│   ├── DEVELOPMENT.md                # Dev setup guide
│   ├── DEPLOYMENT.md                 # Production deployment
│   ├── MONITORING.md                 # Observability
│   ├── SETTINGS_IMPLEMENTATION.md    # Settings feature docs
│   ├── oneclick-wizard.md            # One-click deploy docs
│   └── archive/                      # Old sprint/gap analysis docs
│
├── bridge/                           # Kubernetes manifests (Kustomize)
├── prometheus/                       # Prometheus config & rules
├── grafana/                          # Grafana provisioning
├── docker-compose.yml                # Docker Compose for local dev
└── compose.prod.yaml                 # Docker Compose for production
```

## 🔗 Quick Links

- **GitHub Issues**: Report bugs or request features
- **GitHub Discussions**: Ask questions, share ideas
- **API Reference**: Generated via `npm run docs:trpc`

## 📖 Feature Documentation

**Specific features** have dedicated docs:
- `docs/SETTINGS_IMPLEMENTATION.md` — Settings page
- `docs/oneclick-wizard.md` — One-click deployment
- `docs/DEPLOYMENT_GUIDE.md` — (if exists) Advanced deployment scenarios

## 🔍 Searching Documentation

Looking for something specific?

**Search by keyword:**
```bash
grep -r "keyword" docs/
```

**Search by filename:**
```bash
find docs/ -name "*keyword*"
```

## 📝 Documentation Standards

All docs follow these conventions:
- **Markdown** format
- **Code blocks** for commands/examples
- **Links** to related docs
- **Table of contents** for long docs
- **Examples** for complex concepts

---

## 🗂️ Archived Documentation

Old sprint plans, gap analyses, and implementation reports are in `docs/archive/`:
- `VISION_GAP_ANALYSIS.md` — Pre-implementation planning
- `SPRINT*_*.md` — Sprint completion summaries
- `*_IMPLEMENTATION_*.md` — Feature implementation details

These are kept for reference but are **not** part of active development.

---

## 📧 Questions?

If you can't find what you're looking for:
1. **Search** the docs (Ctrl+F or `grep`)
2. **Check** [DEVELOPMENT.md](DEVELOPMENT.md) troubleshooting section
3. **Open** a GitHub Issue with your question
4. **Start** a GitHub Discussion for broader topics

Happy hacking! 🎉
