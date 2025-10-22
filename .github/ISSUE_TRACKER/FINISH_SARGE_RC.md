# Finish Sarge v1.0 — RC

This tracking issue collects the epics required to finish the v1.0 release candidate.

- [ ] Backend: unify event emitter, zod env validation, strict no-mock policy
- [ ] Backend: add Vitest unit tests and minimal integration smoke tests
- [ ] Backend: implement DI-friendly router wiring and ensure all tRPC subscriptions over WebSockets
- [ ] Frontend: ensure client imports `AppRouter` from `backend/src/api/root` and document any type assumptions
- [ ] Dev infra: document required env vars and dev run steps in `/docs`
- [ ] CI: add GitHub Actions workflows to run lint, build, and tests on PRs
- [ ] Docs: update `.github/copilot-instructions.md` and `/docs` with final workflows
- [ ] QA: run manual smoke e2e and verify Prometheus/Grafana manifests in `bridge/` are current

Please update sub-tasks with PR links and assignees.
