#!/usr/bin/env bash
set -euo pipefail

# Generate or reuse a metrics token for the backend
export PROM_METRICS_TOKEN=${PROM_METRICS_TOKEN:-$(openssl rand -hex 16)}

echo "[local] Using PROM_METRICS_TOKEN=$PROM_METRICS_TOKEN"

# Build images and start services
docker compose -f compose.local.yaml build
docker compose -f compose.local.yaml up -d

echo
echo "Sarge local stack is up:"
echo "- App:            http://localhost:3003"
echo "- Backend WS:     ws://localhost:3005"
echo "- Backend metrics: http://localhost:3006/metrics"
echo
echo "Try metrics curl (requires Authorization header):"
echo "curl -H 'Authorization: Bearer $PROM_METRICS_TOKEN' http://localhost:3006/metrics | head"
