#!/usr/bin/env bash
set -euo pipefail

: "${GHCR_USER:?GHCR_USER required}"
: "${GHCR_PAT_PARAM:?GHCR_PAT_PARAM required}"
: "${REPO:?REPO required}"
: "${SHA:?SHA required}"

export AWS_REGION=${AWS_REGION:-us-east-1}

# Fetch PAT from SSM
PAT=$(aws ssm get-parameter --with-decryption --name "$GHCR_PAT_PARAM" --query 'Parameter.Value' --output text)

# Docker login to GHCR
echo "$PAT" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

# TLS bootstrap (once) if cert missing
TLS_DIR="/opt/sarge/tls"
if [ ! -f "$TLS_DIR/fullchain.pem" ] || [ ! -f "$TLS_DIR/privkey.pem" ]; then
  # Load DOMAIN and EMAIL from tls.env or backend.env
  if [ -f /opt/sarge/env/tls.env ]; then
    set -a; source /opt/sarge/env/tls.env; set +a
  elif [ -f /opt/sarge/env/backend.env ]; then
    set -a; source /opt/sarge/env/backend.env; set +a
  fi
  if [ -n "${DOMAIN:-}" ] && [ -n "${EMAIL:-}" ]; then
    bash -c "/opt/sarge/ops/tls/acme-bootstrap.sh" || true
  else
    echo "TLS not bootstrapped: DOMAIN/EMAIL not set in env files" >&2
  fi
fi

# Render compose file
SRC_COMPOSE_TPL="/opt/sarge/deploy/compose.template.yaml"
DST_COMPOSE="/opt/sarge/deploy/compose.yaml"
[ -f "$SRC_COMPOSE_TPL" ] || SRC_COMPOSE_TPL="/opt/sarge/deploy/compose.prod.yaml"
[ -f "$SRC_COMPOSE_TPL" ] || SRC_COMPOSE_TPL="/opt/sarge/compose.prod.yaml"
if [ -f "$SRC_COMPOSE_TPL" ]; then
  sed -e "s#\${REPO}#${REPO}#g" -e "s#\${GIT_SHA}#${SHA}#g" -e "s#\${AWS_REGION}#${AWS_REGION}#g" "$SRC_COMPOSE_TPL" > "$DST_COMPOSE"
else
  echo "ERROR: compose template not found at $SRC_COMPOSE_TPL" >&2
  exit 1
fi

# Pull images
docker compose -f "$DST_COMPOSE" pull

# Run migrations before restart
if [ -f /opt/sarge/env/backend.env ]; then
  docker run --rm --env-file /opt/sarge/env/backend.env ghcr.io/${REPO}/sarge-backend:${SHA} node dist/scripts/migrate.js
else
  echo "WARN: /opt/sarge/env/backend.env missing; skipping migrations"
fi

# Up services
docker compose -f "$DST_COMPOSE" up -d

# Nginx reload if running
if docker ps --format '{{.Names}}' | grep -q '^nginx$'; then
  docker exec nginx nginx -t && docker exec nginx nginx -s reload || true
fi

# Cleanup
docker image prune -f || true

echo "Deploy complete for ${REPO}@${SHA}"
