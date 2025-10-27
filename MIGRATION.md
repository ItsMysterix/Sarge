# Migration Guide: Accessing One-Click Deploy

## For Existing Sarge Users

If you've been using the previous dashboard (`/deployments`, `/services`, `/metrics`, `/logs`), **nothing breaks**. All existing routes, APIs, and tRPC endpoints remain functional. One-Click Deploy is an *additive* feature, not a replacement.

## How to Access One-Click

- Navigate to `/oneclick` in the Sarge UI, or click **One-Click** in the main navigation menu.
- The wizard walks you through three steps:
  1. **Detect**: Point to a local repository; Sarge scans for services, AWS resources, ports, and env keys.
  2. **Plan**: Review assigned ports, env validation, and resource operations before any process starts.
  3. **Observe**: See live health, service URLs, structured logs, and Prometheus metrics.

## Coexistence with Previous Dashboard

- **Deployments page** (`/deployments`): Still available for manual stack creation and management. Use this if you prefer granular control over individual stacks, or if you're integrating with CI/CD pipelines.
- **Services page** (`/services`): Still lists all running services across all stacks. One-Click stacks appear here automatically after apply.
- **Metrics & Logs** (`/metrics`, `/logs`): Still functional. One-Click stacks write to the same telemetry infrastructure (Prometheus metrics in `data/sarge/metrics/`, structured logs in `data/sarge/logs/`). You can query them from either UI.

## Feature Flag / Opt-In

One-Click is **enabled by default** in this release. If you prefer to disable it:

1. Set `FEATURE_ONECLICK=false` in your environment or `.env` file.
2. The `/oneclick` route will return a 404, and the navigation link will be hidden.

No other functionality is affected.

## Why One-Click?

One-Click embodies Sarge's offline-first, reproducible, observable philosophy:

- **Offline-first**: No cloud credentials required. Everything runs on localhost.
- **Reproducibility**: Same blueprint + plan = same stack state. Snapshots let you freeze and replay any moment.
- **Observability by default**: Structured logs, Prometheus metrics, and Grafana dashboards seeded automatically—no extra config.

It's the fastest path from "I have a repo" to "I have a running, observable stack." Existing users who prefer the manual dashboard can continue using it; new users get a guided, best-practice workflow out of the box.

## Upgrading

1. Pull the latest release: `git pull origin main` (or `release/rc-1` if you're tracking the RC branch).
2. Install dependencies: `pnpm install` (or `npm install`).
3. Run migrations (if any): `npm run migrate` (currently no schema changes required for One-Click).
4. Start Sarge: `npm run dev`.
5. Visit `/oneclick` to try it out.

## Rollback

If you encounter issues, you can:

- Revert to the previous commit: `git checkout <prior-commit>`.
- Or disable One-Click via the feature flag (see above) and continue using the existing dashboard.

All data (stacks, logs, metrics, snapshots) remains intact regardless of which UI you use.

## Questions?

Check the docs at `docs/oneclick-wizard.md` or open an issue on GitHub. We're here to help.
