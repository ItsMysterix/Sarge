# Qovery-Style Multi-Provider Plan

Status legend: Planned / In Progress / Complete

## Sprint 1 — Information Architecture & Nav (Complete ✓)
- **Problem**: Navigation and IA are AWS-centric; new goal needs multi-provider launch paths without breaking existing flows.
- **Solution**: Reframe sidebar/nav around provider-agnostic flows (Launch, Templates, Targets, Observability, Pipelines, Sandbox). Add route stubs/aliases so links stay functional.
- **Result**: Users see a multi-provider-first nav; no 404s; legacy pages reachable via new labels.
- **Tests**:
  - ✓ Sidebar renders new items and highlights active routes.
  - ✓ Visiting /oneclick, /stacks, /targets, /observability, /deployments, /aws loads without errors.
  - ✓ Removed duplicate alias pages (launch→oneclick, templates→stacks, pipelines→deployments, sandbox→aws).
  - ✓ Cleaned up legacy pages: /test-deploy, /workspaces, /aws/detection.

## Sprint 2 — Provider Targets & Launch Wizard (In Progress → Near Complete 🔄)
- **Problem**: No way to connect/select deployment platforms (Vercel, Railway, Cloudflare Pages, GitHub Pages, AWS/GCP/Azure/Fly/Render, etc.).
- **Solution**: Add Targets page with provider cards, credential inputs, and status. Update Launch flow to start with platform selection and route to provider-specific deploy steps. Wire to tRPC endpoints for connections and deploy triggers. Implement provider abstraction layer with SDK-specific deploy logic.
- **Result**: 
  - Users can register and connect providers (Targets page fully functional, in-memory state)
  - Launch wizard allows platform selection with cost hints and environment picker
  - Multi-provider deploy router with provider-specific SDK abstractions
  - Environment CRUD router for managing dev/staging/production per provider
  - Deploy endpoints now accept provider+environment metadata (flows into deployment records)
  - Cost estimation endpoints per provider with resource-based pricing models

- **Code Files Implemented**:
  - ✅ [backend/src/api/lib/providers/index.ts](backend/src/api/lib/providers/index.ts) — Provider interface + 6 implementations (Vercel, Railway, Render, Cloudflare, AWS, Fly.io)
  - ✅ [backend/src/api/routers/deploy.ts](backend/src/api/routers/deploy.ts) — Enhanced with provider-aware deploy, cost estimation, status checking
  - ✅ [backend/src/api/routers/environments.ts](backend/src/api/routers/environments.ts) — NEW: Environment CRUD with provider abstraction
  - ✅ [backend/src/api/routers/oneclick.ts](backend/src/api/routers/oneclick.ts) — Multi-provider deploy integration in deployConnected endpoint
  - ✅ [backend/src/api/root.ts](backend/src/api/root.ts) — Registered environments router
  - ✅ [docs/MULTI_PROVIDER_ARCHITECTURE.md](docs/MULTI_PROVIDER_ARCHITECTURE.md) — Comprehensive architecture guide

- **Tests**:
  - ✓ Targets page renders with 9 provider cards and cost hints.
  - ✓ Connect/disconnect flow updates status (in-memory store).
  - ✓ Launch flow requires a connected provider before deploying.
  - ✓ Provider/env metadata flows into deployments (embedded in summary tags).
  - ✓ Provider abstraction layer created with full interface implementations.
  - ✓ Multi-provider deploy endpoints added to deploy and oneclick routers.
  - ✓ Environment router with list/create/update/delete/getDetails operations.
  - ✓ Cost estimation endpoints per provider with resource config support.
  - ✓ OneClick wizard now attempts provider-specific deploy before fallback to local.
  - ⚠️ Provider connections not yet persisted to database (in-memory only).
  - ⚠️ Provider SDK credentials not yet stored securely (placeholder in context).
  - ⚠️ Preview URL generation mocked; requires real provider API calls for production.
  - ⚠️ Provider APIs not yet called with real credentials (would need tokens/keys).

## Sprint 3 — Delivery & Observability Cohesion (Planned)
- **Problem**: Deployments page is legacy; metrics/logs are separate; no environment/preview awareness or cost guardrails for beginners.
- **Solution**: Rebrand Deployments to Pipelines with environment lanes (preview/prod), add links to generated URLs per provider, and surface rollback actions. Add Observability hub linking metrics/logs with provider-aware context. Introduce lightweight cost hints per deploy target.
- **Result**: Pipelines show provider/env info and actions; Observability hub provides one-click jump to metrics/logs; users see cost hints during deploy.
- **Tests**:
  - ✓ Deployments list shows provider/env badges.
  - ✓ Observability hub links to metrics/logs.
  - ⚠️ Provider-specific preview URLs not yet generated.
  - ⚠️ Rollback actions not yet wired to providers.

## Cleanup & Deduplication (Complete ✓)
Removed the following redundant/legacy pages:
- `/launch` (alias to `/oneclick`)
- `/templates` (alias to `/stacks`)
- `/pipelines` (alias to `/deployments`)
- `/sandbox` (alias to `/aws`)
- `/test-deploy` (development utility page)
- `/workspaces` (legacy workspace management)
- `/aws/detection` (unused subdirectory)

Canonical pages now in use:
- `/oneclick` — One-click deploy (renamed from launch internally)
- `/stacks` — Template stacks and composition (renamed from templates internally)
- `/deployments` — Pipeline/deployment history (renamed from pipelines internally)
- `/aws` — Sandbox / local AWS emulation (renamed from sandbox internally)
- `/targets` — Provider connections and management
- `/observability` — Metrics/logs hub
- `/metrics`, `/logs` — Individual observability views
