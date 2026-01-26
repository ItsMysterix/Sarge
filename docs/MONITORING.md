# Monitoring & Observability

Setup and configuration guide for Prometheus, Grafana, and Alertmanager in Sarge.

## Overview

Sarge includes a complete observability stack:

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Alertmanager**: Alert routing and notifications

```
Application Metrics
        │
        ├─► Prometheus (scrape every 15s)
        │       │
        │       ├─► TSDB (time-series storage)
        │       │
        │       ├─► Rules (aggregations, alerts)
        │       │
        │       └─► Alertmanager (if threshold exceeded)
        │               │
        │               └─► Slack, Email, PagerDuty, etc.
        │
        └─► Grafana (queries Prometheus)
                │
                └─► Dashboards (visualization)
```

## Prometheus

### Configuration

**File:** `prometheus/prometheus.yml`

```yaml
global:
  scrape_interval: 15s         # How often to scrape
  evaluation_interval: 15s      # How often to evaluate rules
  external_labels:
    monitor: sarge-prod

scrape_configs:
  - job_name: sarge
    scrape_interval: 15s
    scheme: https               # If using TLS
    params:
      token: ['<PROM_METRICS_TOKEN>']
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'

rule_files:
  - 'alerts.yml'               # Alert rules
  - 'recording_rules.yml'      # Recording rules (optional)
```

### Running Locally
```bash
docker run -d --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/prometheus:/etc/prometheus \
  prom/prometheus \
  --config.file=/etc/prometheus/prometheus.yml
```

Visit http://localhost:9090

### Running in Docker Compose
```yaml
# compose.prod.yaml
prometheus:
  image: prom/prometheus:latest
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus:/etc/prometheus
    - prometheus_data:/prometheus
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'
    - '--storage.tsdb.retention.time=15d'
```

### Metrics Endpoint

Sarge exposes metrics at `GET /api/metrics` (protected):

```bash
# Requires PROM_METRICS_TOKEN
curl -H "Authorization: Bearer $PROM_METRICS_TOKEN" \
  http://localhost:3000/api/metrics
```

**Output format:** Prometheus text format
```
# HELP sarge_deployment_total Total deployments created
# TYPE sarge_deployment_total counter
sarge_deployment_total{status="success"} 42

# HELP sarge_deployment_duration_seconds Deployment duration
# TYPE sarge_deployment_duration_seconds histogram
sarge_deployment_duration_seconds_bucket{le="1"} 5
sarge_deployment_duration_seconds_bucket{le="5"} 38
sarge_deployment_duration_seconds_bucket{le="+Inf"} 42
```

### Available Metrics

**Deployments:**
- `sarge_deployment_total` (counter) — Total deployments by status
- `sarge_deployment_duration_seconds` (histogram) — Deployment latency

**Services:**
- `sarge_service_cpu_percent` (gauge) — CPU usage %
- `sarge_service_memory_bytes` (gauge) — Memory usage bytes
- `sarge_service_latency_ms` (histogram) — Request latency

**WebSocket:**
- `sarge_ws_connections` (gauge) — Active WS connections
- `sarge_ws_messages_total` (counter) — Messages sent/received

## Grafana

### Configuration

**File:** `grafana/provisioning/datasources/prometheus.yml`

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

### Running Locally
```bash
docker run -d --name grafana \
  -p 3000:3000 \
  -v grafana_storage:/var/lib/grafana \
  grafana/grafana:latest
```

Default credentials: `admin` / `admin`

### Running in Docker Compose
```yaml
# compose.prod.yaml
grafana:
  image: grafana/grafana:latest
  ports:
    - "3000:3000"
  environment:
    GF_SECURITY_ADMIN_PASSWORD: admin
    GF_INSTALL_PLUGINS: grafana-piechart-panel
  volumes:
    - ./grafana/provisioning:/etc/grafana/provisioning
    - grafana_data:/var/lib/grafana
```

### Dashboards

Sarge includes pre-configured dashboards:

**Location:** `grafana/dashboards/`

1. **Deployment Overview**
   - Deployment history (status, duration)
   - Success rate
   - Average latency
   - Rollback events

2. **Service Health**
   - CPU usage per service
   - Memory usage per service
   - Request latency (P50, P95, P99)
   - Error rate

3. **System Resources**
   - Total CPU/memory across cluster
   - Network I/O
   - Disk usage (if monitored)

4. **Alerts**
   - Active alerts
   - Alert history
   - Alert distribution by severity

### Importing Dashboards

**Via UI:**
1. Grafana → Dashboards → New → Import
2. Paste dashboard JSON or upload file
3. Select Prometheus data source
4. Click "Import"

**Via API:**
```bash
curl -X POST http://admin:admin@localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @grafana/dashboards/deployment-overview.json
```

### Creating Custom Dashboards

1. **Create new dashboard**
   - Grafana → Dashboards → New
   - Add panels

2. **Add metrics**
   - Panel → Edit
   - Query: Select `Prometheus` data source
   - Metric: `sarge_service_cpu_percent`
   - Legend: `{{ service }}`

3. **Configure visualization**
   - Graph, gauge, stat, table, etc.
   - Set thresholds, colors, legends

4. **Save**
   - Give dashboard a name
   - Save as JSON for version control

**Example Prometheus query:**
```
sum(rate(sarge_deployment_duration_seconds_sum[5m])) 
/ 
sum(rate(sarge_deployment_duration_seconds_count[5m]))
```

## Alertmanager

### Configuration

**File:** `alertmanager/alertmanager.yml`

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  
  receiver: 'default'
  
  routes:
    - match:
        severity: critical
      receiver: 'critical'
    
    - match:
        service: backend
      receiver: 'backend-team'

receivers:
  - name: 'default'
    slack_configs:
      - api_url: '<SLACK_WEBHOOK_URL>'
        channel: '#alerts'
        title: 'Sarge Alert'
        text: '{{ .GroupLabels.alertname }}'

  - name: 'critical'
    slack_configs:
      - api_url: '<SLACK_WEBHOOK_URL>'
        channel: '#critical-alerts'
    pagerduty_configs:
      - service_key: '<PAGERDUTY_KEY>'

  - name: 'backend-team'
    email_configs:
      - to: 'backend-team@company.com'
        from: 'alerts@company.com'
        smarthost: 'smtp.company.com:587'
        auth_username: 'alerts@company.com'
        auth_password: '<SMTP_PASSWORD>'
```

### Running Locally
```bash
docker run -d --name alertmanager \
  -p 9093:9093 \
  -v $(pwd)/alertmanager:/etc/alertmanager \
  prom/alertmanager \
  --config.file=/etc/alertmanager/alertmanager.yml
```

Visit http://localhost:9093

### Alert Rules

**File:** `prometheus/alerts.yml`

```yaml
groups:
  - name: sarge_deployment
    interval: 30s
    rules:
      - alert: DeploymentFailureRate
        expr: |
          sum(rate(sarge_deployment_total{status="failure"}[5m]))
          /
          sum(rate(sarge_deployment_total[5m]))
          > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High deployment failure rate (> 10%)"
          description: "{{ $value | humanizePercentage }} of deployments failed in last 5m"

      - alert: HighServiceLatency
        expr: |
          histogram_quantile(0.95, 
            rate(sarge_service_latency_ms_bucket[5m])
          ) > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Service latency high (P95 > 1s)"
          description: "{{ $labels.service }} latency: {{ $value }}ms"

      - alert: HighCpuUsage
        expr: sarge_service_cpu_percent > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "{{ $labels.service }} CPU: {{ $value }}%"

      - alert: HighMemoryUsage
        expr: |
          sarge_service_memory_bytes / 1073741824 > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "{{ $labels.service }} memory: {{ $value }}GB"

      - alert: DeploymentDurationAnomaly
        expr: |
          sarge_deployment_duration_seconds > 1800  # 30min
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Deployment taking unusually long"
          description: "Deployment {{ $labels.deployment_id }} duration: {{ $value }}s"
```

### Creating Custom Alerts

1. Add rule to `prometheus/alerts.yml`
2. Restart Prometheus
3. Configure receiver in `alertmanager/alertmanager.yml`
4. Restart Alertmanager

**PromQL cheat sheet:**
```promql
# Rate of change over 5 minutes
rate(metric[5m])

# Sum across all series
sum(metric)

# Quantile (95th percentile)
histogram_quantile(0.95, metric)

# Threshold
metric > 100

# Combine
sum(rate(metric[5m])) > threshold
```

## Notification Channels

### Slack

1. **Create Slack Webhook:**
   - Slack workspace → Settings → Apps
   - Search "Incoming Webhooks"
   - Create new webhook
   - Copy webhook URL

2. **Configure Alertmanager:**
```yaml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/T00000000/B00000000/...'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

### Email

```yaml
receivers:
  - name: 'email'
    email_configs:
      - to: 'oncall@company.com'
        from: 'alerts@company.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@company.com'
        auth_password: '<APP_PASSWORD>'  # Google App Password
        headers:
          Subject: 'Sarge Alert: {{ .GroupLabels.alertname }}'
```

### PagerDuty

```yaml
receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '<YOUR_SERVICE_KEY>'
        description: '{{ .GroupLabels.alertname }}'
        details:
          firing: '{{ template "pagerduty.default.instances" .Alerts.Firing }}'
```

Get service key from:
1. PagerDuty account → Integrations
2. Create or select escalation policy
3. Copy integration key

### Custom Webhook

```yaml
receivers:
  - name: 'custom'
    webhook_configs:
      - url: 'https://your-app.com/api/alerts'
        send_resolved: true
        headers:
          Authorization: 'Bearer <TOKEN>'
```

Your endpoint receives:
```json
{
  "status": "firing",
  "alerts": [
    {
      "status": "firing",
      "labels": {
        "alertname": "DeploymentFailureRate",
        "severity": "critical"
      },
      "annotations": {
        "summary": "High deployment failure rate",
        "description": "10% of deployments failed"
      }
    }
  ]
}
```

## Dashboard Templates

### Deployment Overview
```
Row 1: Key Metrics
  - Total Deployments (stat)
  - Success Rate (gauge)
  - Avg Duration (stat)
  - Last 24h Failures (stat)

Row 2: Time Series
  - Deployment Status (stacked area)
  - Duration Trend (line)
  - Success Rate Trend (line)

Row 3: Details
  - Recent Deployments (table)
  - Deployment Distribution (pie)
```

### Service Health
```
Row 1: Per-Service Stats (grid)
  - Service CPU (gauge)
  - Service Memory (gauge)
  - Service Latency P95 (stat)
  - Service Error Rate (stat)

Row 2: Trends
  - CPU Usage (multi-line)
  - Memory Usage (multi-line)
  - Latency by Percentile (line)

Row 3: Heatmap
  - Request Latency Distribution (heatmap)
```

## Testing Alerts

### Manual Alert Trigger

1. **Force condition to exceed threshold:**
```bash
# Query Prometheus directly
curl 'http://localhost:9090/api/v1/query?query=sarge_service_cpu_percent'
```

2. **Simulate alert:**
```bash
# Send test alert to Alertmanager
curl -X POST http://localhost:9093/api/v1/alerts \
  -H 'Content-Type: application/json' \
  -d '{
    "alerts": [
      {
        "status": "firing",
        "labels": {
          "alertname": "TestAlert",
          "severity": "critical"
        },
        "annotations": {
          "summary": "Test alert from Prometheus"
        }
      }
    ]
  }'
```

3. **Check notifications:**
   - Slack: Check channel for message
   - Email: Check inbox
   - PagerDuty: Check incident creation

## Troubleshooting

### Prometheus not scraping
- **Check URL:** Visit `http://localhost:9090/targets`
- **Check auth:** Ensure `PROM_METRICS_TOKEN` is set in app
- **Check network:** Verify app is reachable

### Alerts not firing
- **Check rules:** http://localhost:9090/alerts
- **Check evaluation:** Increase `evaluation_interval` for debugging
- **Check expression:** Test PromQL query directly in UI

### Grafana data missing
- **Check datasource:** Grafana → Configuration → Data Sources
- **Check query:** Edit dashboard panel, run query
- **Check Prometheus:** Verify data exists in Prometheus

### Notifications not arriving
- **Check routing:** Alertmanager → Status tab
- **Check webhook:** Test with `curl` command
- **Check credentials:** Verify API keys/tokens
- **Check logs:** `docker logs alertmanager`

## Best Practices

1. **Set Meaningful Thresholds**
   - Don't alert on minor spikes
   - Use percentiles (P95, P99) not averages

2. **Group Related Alerts**
   - Avoid alert fatigue
   - Use `group_by` in routes

3. **Clear Descriptions**
   - Include metric value in alert
   - Provide runbook link if complex

4. **Regular Review**
   - Archive old dashboards
   - Review alert history monthly
   - Remove noisy alerts

5. **Gradual Rollout**
   - Test alerts in staging first
   - Monitor for false positives
   - Adjust thresholds based on baseline

## Related Documentation
- [Architecture](ARCHITECTURE_COMPLETE.md) — System metrics
- [Deployment](DEPLOYMENT.md) — Observability in production
- [Development](DEVELOPMENT.md) — Local monitoring setup
