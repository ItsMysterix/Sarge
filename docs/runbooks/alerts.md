# Alerts Runbook

This runbook explains each alert, common causes, and how to respond.

## BackendDown (critical)
- Meaning: Prometheus cannot scrape the backend metrics endpoint.
- Causes: Backend container down, port not exposed, metrics auth token misconfigured.
- Actions:
  1) Check `docker ps` on EC2 and backend healthchecks.
  2) Inspect logs: `/sarge/backend` CloudWatch group.
  3) Hit backend metrics: `curl -H "Authorization: Bearer $PROM_METRICS_TOKEN" http://backend:3000/metrics` inside the network.
- Escalation: Restart backend service via compose; investigate recurring failures.
- Dashboards: Sarge Overview (Uptime), Sarge Alerts.

## AppDown (warning)
- Meaning: Prometheus cannot scrape the app metrics endpoint.
- Causes: App may not export metrics; add exporter or silence.
- Actions: Consider silencing until metrics are added; verify app health via Nginx access logs.

## NginxDown (warning)
- Meaning: Nginx metrics endpoint unreachable.
- Causes: No exporter; port blocked.
- Actions: Add nginx exporter or silence until implemented.

## DeployFailuresSpike (warning)
- Meaning: One or more deploys failed in the last 15m.
- Causes: Migration failure, image pull failure, misconfig.
- Actions:
  1) Open Alertmanager to view firing alerts and details.
  2) Check deploy logs: `/sarge/backend` and `/sarge/app` groups.
  3) If needed, rollback via SSM deploy script with previous SHA.
- Dashboards: Sarge Overview (Deploys).
- See: deploy-failures runbook.

## RateLimitDenialsHigh (warning)
- Meaning: >50 rate-limited requests in last 5m.
- Causes: Bad actor / crawler, misconfigured client, high traffic.
- Actions:
  1) Inspect logs around 4xx/429 and rate-limit messages.
  2) Tune thresholds temporarily if necessary (env vars RATE_LIMIT_*).
  3) Consider blocking offending IPs at Nginx/security layer.
- See: rate-limit runbook.

## WSDisconnectSurge (warning)
- Meaning: >20 WS disconnects in last 5m.
- Causes: Client reconnect storms, network issues, server restarts.
- Actions: Check WS server logs; ensure heartbeat/ping settings are healthy.

## WSMsgRateCapTriggered (info)
- Meaning: WS message/subscription rate cap triggered >10 in last 5m.
- Causes: Misbehaving client; bursts beyond caps.
- Actions: Identify client IPs; adjust caps cautiously if needed.

## ContainerRestarts (info)
- Meaning: Detected process restarts.
- Causes: OOM kills, crashes, manual restarts.
- Actions: Investigate logs and resource usage; consider increasing limits.
