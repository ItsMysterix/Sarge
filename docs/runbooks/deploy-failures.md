# Deploy Failures Runbook

If `DeployFailuresSpike` fires, follow these steps.

1) Identify scope
- Check Alertmanager for labels and timing.
- Review recent releases (GitHub Actions "Release" runs) and the SHA deployed.

2) Inspect logs
- Backend and app logs in CloudWatch groups `/sarge/backend` and `/sarge/app`.
- Look for migration errors or container healthcheck failures.

3) Retry / Rollback
- Re-run Release with the same SHA after addressing issues, or rollback to a previous SHA via SSM:

```bash
export REPO="<owner>/<repo>"
export SHA="<previous-sha>"
export GHCR_USER="<your-gh-username>"
export GHCR_PAT_PARAM="/sarge/ghcr_pat"
/ bin/bash /opt/sarge/ssm-deploy.sh
```

4) Prevent recurrence
- Add tests for failing scenario.
- Improve healthchecks; validate migrations with `--dry-run` in CI.
