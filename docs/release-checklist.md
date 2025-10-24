# Release Checklist

- [ ] DB migrations applied (`backend/scripts/migrate.js` or SQL scripts)
- [ ] PROM_METRICS_TOKEN set (prod only); metrics endpoint returns 200
- [ ] CORS/WS allowlists configured (`ALLOWED_ORIGINS`, `WS_ALLOWED_ORIGINS`)
- [ ] Rate limit thresholds sane (`RATE_LIMIT_*`)
- [ ] EC2 SSM target reachable; GHCR PAT/permissions present
- [ ] Preflight passed in CI
- [ ] Alerts wired (Alertmanager env present); no firing alerts on baseline
- [ ] Grafana dashboards load
- [ ] Rollback plan tested (previous SHA compose)
