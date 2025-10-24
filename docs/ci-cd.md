# CI/CD

Sarge uses GitHub Actions for CI and Release pipelines.

## CI (ci.yml)
- Node 20 environment
- Jobs:
  - setup: checkout + install
  - backend-test: runs backend test suite
  - lint-typecheck: runs TypeScript noEmit typecheck
  - frontend-build: builds Next.js app (works without secrets due to safe auth wrapper)
  - ops-tests: runs ops + Prometheus rule checks
  - docs-check: (added) generate tRPC docs, lint markdown, and check links

## Release
- Pushes images to GHCR (tags per commit/branch)
- Preflight validation ensures compose configs and alerts are sane

## Required GitHub secrets/vars
- GHCR_PAT or GITHUB_TOKEN for pushing containers (if release workflow needs it)
- AWS_REGION, EC2_SSM_TARGET (for EC2 deploy via SSM)
- PROM_METRICS_TOKEN (only in production deploy targets)
- Alertmanager routing: SLACK_WEBHOOK_URL or SNS webhook as configured

## SSM Parameter Store items
- GHCR credentials (if not using GITHUB_TOKEN)
- Any env bundles for production compose (`/opt/sarge/env/*.env` rendered by ops tooling)
