# Deploy Runbook

## Common failures

- GHCR auth failed:
  - Check that SSM parameter (PAT) exists and has `read:packages`.
  - Ensure `GHCR_PAT_PARAM` secret points to the right parameter name.
- Migrations failed:
  - Check DB connectivity (`DATABASE_URL`) in `/opt/sarge/env/backend.env`.
  - Run migrations manually:
```
docker run --rm --env-file /opt/sarge/env/backend.env ghcr.io/${REPO}/sarge-backend:${SHA} node dist/scripts/migrate.js
```
- Nginx reload failed:
  - `docker exec nginx nginx -t` for config errors; fix `ops/nginx/nginx.conf`.

## Rollback to previous SHA

- Re-run the Release workflow with an older commit SHA.
- Or on instance:
```
export REPO="<owner>/<repo>"
export SHA="<previous_sha>"
export GHCR_USER="<gh-username>"
export GHCR_PAT_PARAM="/sarge/ghcr_pat"
/bin/bash /opt/sarge/ssm-deploy.sh
```
