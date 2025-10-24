# Security Hardening

This document summarizes security-related toggles and guards implemented in the backend and edge.

## Environment variables

Name | Type | Default | Purpose
---- | ---- | ------- | -------
ALLOWED_ORIGINS | string | "" | Comma-separated list of allowed HTTP origins for CORS on `/api/*`.
WS_ALLOWED_ORIGINS | string? | — | Comma-separated override for WebSocket allowed origins. Falls back to `ALLOWED_ORIGINS` when unset/empty.
PROM_METRICS_TOKEN | string? | — | If set (and not in `NODE_ENV=test`), `/metrics` requires `Authorization: Bearer <token>`.
RATE_LIMIT_WINDOW_SEC | number | 60 | Sliding window size (seconds) for rate limiter.
RATE_LIMIT_MAX | number | 120 | Max allowed requests per key/route in window.
RATE_LIMIT_BURST | number | 60 | Extra burst tokens allowed beyond `max` (window-local).
RATE_LIMIT_SCOPE | enum(ip|user|ip_user) | ip | How to build the rate limit key (by ip, user, or both).
MAX_WS_SUBSCRIPTIONS_PER_CONN | number | 16 | Max concurrent WS subscriptions per connection.
MAX_WS_MSGS_PER_MIN | number | 240 | Max messages per WS connection per minute.
MAX_JSON_BODY_KB | number | 512 | Max JSON body size (KB) for `/api/*` requests (enforced via `Content-Length`).
## Environment matrix

- API CORS: `ALLOWED_ORIGINS` (comma-separated)
- WS CORS: `WS_ALLOWED_ORIGINS` (falls back to `ALLOWED_ORIGINS`)
- Rate limits: `RATE_LIMIT_WINDOW_SEC`, `RATE_LIMIT_MAX`, `RATE_LIMIT_BURST`, `RATE_LIMIT_SCOPE`
- Payload caps: `MAX_JSON_BODY_KB`, `MAX_WS_MSGS_PER_MIN`, `MAX_WS_SUBSCRIPTIONS_PER_CONN`
- Metrics: `PROM_METRICS_TOKEN` required in production; `METRICS_ENABLE`, `METRICS_PORT`

Examples:

```env
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
WS_ALLOWED_ORIGINS=https://app.example.com
RATE_LIMIT_WINDOW_SEC=60
RATE_LIMIT_MAX=120
RATE_LIMIT_BURST=60
MAX_JSON_BODY_KB=512
MAX_WS_MSGS_PER_MIN=240
MAX_WS_SUBSCRIPTIONS_PER_CONN=16
PROM_METRICS_TOKEN=change-me-in-prod
```

In production, `PROM_METRICS_TOKEN` is REQUIRED at process start.

## CORS (HTTP)
- Otherwise, the `Origin` header must exactly match one of the configured origins.
- On allowed requests:
  - `Access-Control-Allow-Origin` set to the request origin
- Preflight (`OPTIONS`) responds with 204 and appropriate Allow-* headers.
- When `Content-Length` exceeds `MAX_JSON_BODY_KB` for non-GET/HEAD/OPTIONS, middleware returns `413`.

## WebSocket origin & caps

- Origins are checked against `WS_ALLOWED_ORIGINS` or fallback to `ALLOWED_ORIGINS`.
- Frames larger than `MAX_JSON_BODY_KB` are rejected at the WS layer (`maxPayload`).
- Per-connection guards:
  - Messages/minute hard cap (`MAX_WS_MSGS_PER_MIN`) with policy close `1008`.
  - Subscription starts are counted; exceeding `MAX_WS_SUBSCRIPTIONS_PER_CONN` closes the connection with code `1008`.

## Rate limiting (tRPC)

- Implemented as a middleware `secureProcedure(route, override?)` applied to routers.
- Persists hits into `rate_limit_hits` with index on `(key, route, ts DESC)`.
- Sliding window counter with small in-memory assist to reduce DB churn.
- Scope (`ip`, `user`, `ip_user`) defines the key shape.
- In tests, RL is off by default; set `RATE_LIMIT_ENABLE_IN_TEST=true` to enable.

Per-route overrides can be passed to `secureProcedure(route, { windowSec, max, burst, scope })`.

## Prometheus /metrics protection

- When `PROM_METRICS_TOKEN` is set and `NODE_ENV !== test`, GET `/metrics` requires `Authorization: Bearer <token>`.
- Example:

```
# Wrong or missing token
curl -i http://localhost:9464/metrics
curl -i -H 'Authorization: Bearer wrong' http://localhost:9464/metrics

# Correct token
curl -i -H 'Authorization: Bearer $PROM_METRICS_TOKEN' http://localhost:9464/metrics
```

## Helpers

- `parseAllowedOrigins(str): string[]` – trims and filters blanks.
- `effectiveWsAllowedOrigins(): string[]` – returns the effective WS allowlist.
