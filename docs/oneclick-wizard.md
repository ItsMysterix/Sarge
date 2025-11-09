# One-Click Deploy Wizard

A minimal 3-step wizard for detecting, planning, and deploying local stacks with full observability. Embodies Sarge's offline-first, reproducible, observable philosophy.

## Features

### Step 1: Detect
- User provides a repository path
- Scans for services, resources (S3/DynamoDB/Lambda), ports, and environment variables—**no cloud credentials required**
- Shows detected stack blueprint with service details
- Editable fields for service names, types, ports

### Step 2: Plan
- Generates an apply plan with port assignment and resource/service diffs
- Validates environment variables and port conflicts **before any process starts**
- Shows create/update/delete operations
- Clear CTA to apply the plan—**plan-first, no surprises**

### Step 3: Observe
- Auto-applies the plan on mount
- Shows live health status with polling (3s interval)
- Displays service URLs for quick access
- Structured logs (JSON lines) in `data/sarge/logs/`
- Prometheus metrics in `data/sarge/metrics/metrics.prom`—**offline-friendly, no SaaS dependencies**
- Snapshot button (wired to workspace.snapshots.create) for **reproducible rollback**
- Docker mode toggle (switches between Node and Docker Compose runtime)

## Why One-Click?

One-Click Deploy is the **primary entrypoint** for new Sarge users and the fastest path from "repo on disk" to "running, observable stack." It enforces best practices:

- **Offline-first**: Everything runs on localhost. No cloud accounts, no external APIs.
- **Reproducibility**: Same blueprint + plan = same stack state. Snapshots freeze any moment in time.
- **Observability by default**: Structured logs, Prometheus metrics, Grafana dashboards—seeded automatically, no extra config.
- **Plan before apply**: Review port assignments, env validation, and resource operations before starting processes. No hidden state mutations.

By centering One-Click in the UX, Sarge makes local-first cloud development feel as simple as `npm start`—but with production-grade telemetry and infra-as-code rigor baked in.

## Usage

1. Navigate to `/oneclick` in the app
2. Enter your repository path (or use default workspace)
3. Click "Detect" to scan the stack—**offline, on your machine**
4. Review detected services and resources
5. Click "Next: Plan" to generate the apply plan
6. Review port assignments, validation issues, and operations—**before any process starts**
7. Click "Apply & Observe" to start the stack
8. View live health, service URLs, and logs—**all localhost, all observable**
9. Toggle Docker mode to switch runtimes (requires DOCKER_MODE=true)
10. Click "Snapshot" to save the current state—**reproducible rollback anytime**

## Technical Details

- **No mock data**: All data flows through tRPC endpoints (sarge.oneclick.*) backed by sarge-core detector, planner, and apply engine
- **Dark mode**: Renders correctly with Tailwind dark mode classes
- **Keyboard accessible**: All buttons and inputs support focus-visible rings and keyboard navigation
- **Minimal UI**: Uses existing Tailwind utilities and card patterns, no visual overhaul
- **Helper text**: Crisp, actionable messages on errors—emphasizing offline-first, reproducibility, and observability

## tRPC Endpoints

- `detectRepo({ path })`: Scans repo and returns StackBlueprint
- `plan({ blueprint })`: Generates ApplyPlan with validation
- `run({ plan })`: Applies plan and returns status/ports/urls
- `status({ stackId })`: Polls health summary
- `logs.tail({ stackId, service })`: Streams logs (subscription)
- `toggleDocker({ enabled })`: Switches Docker mode on/off

## Development

```bash
# Start backend WS server
cd backend && npm run dev

# Start Next.js frontend
npm run dev

# Navigate to http://localhost:3000/oneclick
```

## Notes

- The apply step auto-runs and immediately stops services for deterministic API behavior
- For persistent local runtime, wire to the sarge-core apply engine with long-lived processes
- **Offline-first telemetry**: Metrics written to `data/sarge/metrics/metrics.prom`; dashboards seeded in `data/sarge/dashboards/`; logs in `data/sarge/logs/<service>.log` (structured JSON)
- **Reproducible snapshots**: Use `sarge snapshot create <name>` (CLI) or the Snapshot button (UI) to freeze state; replay with `sarge snapshot replay <name>`
- **Coexists with existing dashboard**: One-Click is additive; all previous routes (`/deployments`, `/services`, `/metrics`, `/logs`) remain functional
