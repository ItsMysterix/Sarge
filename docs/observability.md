# Observability: Prometheus + Grafana

This doc describes the metrics we expose, how to scrape them with Prometheus, and the Grafana dashboard included in this repo.

## Metrics Endpoint
- Server: backend Node HTTP server
- Path: `/metrics`
- Port: `METRICS_PORT` (default 9464)
- Enable/disable: `METRICS_ENABLE` (stringy boolean; defaults to "true")
- Prefix: `METRICS_PREFIX` (default `sarge_`)

Start locally:
```bash
# Optional env (defaults shown)
export METRICS_PORT=9464
export METRICS_ENABLE=true
# Optional: change metric prefix (default sarge_)
# export METRICS_PREFIX=myapp_

# Build once, then start the metrics server
npm --prefix backend run build
npm --prefix backend run start:metrics
```

## Metric Names, Units, Labels
- sarge_requests_total (counter)
  - labels: route, method, status_class
  - unit: requests
- sarge_query_duration_seconds (histogram)
  - labels: query_name
  - unit: seconds
- sarge_service_cpu_percent (gauge)
  - labels: service_id
  - unit: percent
- sarge_service_memory_bytes (gauge)
  - labels: service_id
  - unit: bytes
- sarge_service_latency_ms (histogram)
  - labels: service_id
  - unit: milliseconds
- sarge_deploys_total (counter)
  - labels: status
  - unit: deployments

Cardinality: labels are kept low (service_id, route, status_class) and do not include user-sensitive or high-cardinality fields.

## Scrape Config (Prometheus)
Add this job to your `prometheus/prometheus.yml` (example):
```yaml
scrape_configs:
  - job_name: "sarge"
    metrics_path: /metrics
    # If Prometheus runs in Docker, use host.docker.internal to reach the host
    static_configs:
      - targets: ["host.docker.internal:9464", "localhost:9464"]
```

## Grafana Dashboard
- Path: `grafana/dashboards/sarge-core.json`
- Panels include:
  - Request rate
  - Error ratio
  - Query duration p95
  - CPU % per service
  - Memory bytes per service
  - Deploys by status

Import steps:
1. Open Grafana → Dashboards → New → Import
2. Upload `sarge-core.json`
3. Select your Prometheus data source

Note on metric prefix: if you override METRICS_PREFIX, the dashboard's metric names will need to match the new prefix. Either keep the default `sarge_` prefix or update the panel queries accordingly.

## Source of Truth
- UI (tRPC) and Prometheus both reflect the same underlying Neon/Postgres data.
- Router procedures instrument query timing via `sarge_query_duration_seconds`.
- Gauges are updated using the returned data only—no duplicate queries.
