#!/usr/bin/env bash
set -euo pipefail

: "${DOMAIN:?DOMAIN required}"
: "${EMAIL:?EMAIL required}"

TLS_DIR="/opt/sarge/tls"
mkdir -p "$TLS_DIR"

# Install acme.sh if not present
if ! command -v acme.sh >/dev/null 2>&1; then
  curl https://get.acme.sh | sh -s email=$EMAIL
  export PATH="$HOME/.acme.sh:$PATH"
fi

export PATH="$HOME/.acme.sh:$PATH"

# Issue cert if not exists
if [ ! -f "$TLS_DIR/fullchain.pem" ] || [ ! -f "$TLS_DIR/privkey.pem" ]; then
  acme.sh --set-default-ca --server letsencrypt
  acme.sh --issue --standalone -d "$DOMAIN" --listen-v6 --keylength ec-256 --force
  acme.sh --install-cert -d "$DOMAIN" --ecc \
    --key-file       "$TLS_DIR/privkey.pem" \
    --fullchain-file "$TLS_DIR/fullchain.pem"
fi

# Print expiry
acme.sh --info -d "$DOMAIN" --ecc || true

# Cron for renew + nginx reload
CRON_FILE="/etc/crontabs/root"
if [ -w "$CRON_FILE" ]; then
  if ! grep -q 'acme.sh --cron' "$CRON_FILE"; then
    echo "0 3 1 * * $HOME/.acme.sh/acme.sh --cron --home $HOME/.acme.sh > /dev/null 2>&1 && docker exec nginx nginx -s reload" | tee -a "$CRON_FILE" >/dev/null
  fi
fi

echo "ACME bootstrap complete for $DOMAIN"
