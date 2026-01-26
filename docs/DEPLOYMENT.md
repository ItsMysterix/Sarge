# Deployment Guide

Instructions for deploying Sarge to production across multiple platforms.

## Overview

Sarge supports multiple deployment targets:
- **Local**: Docker Compose (staging/development)
- **Vercel**: Frontend (Next.js)
- **Railway**: Backend + Database
- **Fly.io**: WebSocket server
- **AWS ECS**: Docker containers on Fargate
- **Kubernetes**: Multi-service orchestration (any K8s cluster)
- **Azure Container Apps**: Managed containers
- **GCP Cloud Run**: Serverless functions

## Deployment Checklist

Before deploying to production:
- [ ] All tests passing (`npm test`)
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] HTTPS/TLS enabled (except local)
- [ ] Auth configured (OAuth or email)
- [ ] Monitoring set up (Prometheus, Grafana)
- [ ] Alerts configured
- [ ] Rollback plan documented

---

## Local Deployment (Docker Compose)

### For Development & Staging

1. **Build images:**
```bash
docker-compose -f compose.prod.yaml build
```

2. **Start stack:**
```bash
docker-compose -f compose.prod.yaml up -d
```

3. **Verify services:**
```bash
docker-compose -f compose.prod.yaml ps
```

**Services:**
- Frontend (Next.js): http://localhost:3000
- Backend (tRPC WS): ws://localhost:3200
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000/grafana
- PostgreSQL: localhost:5432

4. **Stop:**
```bash
docker-compose -f compose.prod.yaml down
```

### Configuration

Edit `compose.prod.yaml` to adjust:
- Port mappings
- Environment variables
- Resource limits
- Volume mounts

---

## Vercel (Frontend Only)

Vercel is the recommended platform for the Next.js frontend.

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Create Vercel Project

1. Go to https://vercel.com/new
2. Connect GitHub repository
3. Select repository
4. Click "Import"

### 3. Configure Environment

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<generate: openssl rand -hex 32>
NEXTAUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com/ws
PROM_METRICS_TOKEN=<token>
ANTHROPIC_API_KEY=<optional>
ENABLE_AI_ANALYSIS=true
```

**For Preview deployments** (optional):
- Use separate `DATABASE_URL` to avoid mixing data
- Set `NEXTAUTH_URL_INTERNAL` if behind private network

### 4. Deploy

Vercel auto-deploys on push to main. Alternatively, manually trigger:

```bash
vercel deploy --prod
```

### 5. Custom Domain

In Vercel Project Settings:
1. Domains → Add domain
2. Follow DNS instructions
3. Update `NEXTAUTH_URL` to custom domain

### Scaling

Vercel auto-scales on demand. No configuration needed.

---

## Railway (Backend + Database)

Railway is recommended for containerized backends.

### 1. Create Railway Project

1. Go to https://railway.app
2. Create new project
3. Add service → Docker

### 2. Configure Backend Service

1. Connect GitHub repository
2. Select `backend/` directory
3. Set environment variables:

```
DATABASE_URL=<Neon connection>
NEXTAUTH_SECRET=<same as Vercel>
PROM_METRICS_TOKEN=<token>
LOG_LEVEL=info
WS_PORT=3200
```

4. Deploy

### 3. Add PostgreSQL (Optional)

If not using Neon:
1. Add service → PostgreSQL
2. Railway creates `DATABASE_URL` automatically
3. Link to backend service

### 4. Custom Domain

In Railway project:
1. Settings → Custom Domains
2. Point to your domain
3. Update frontend `NEXT_PUBLIC_WS_URL` to `wss://your-api-domain.com/ws`

### Monitoring

Railroad provides built-in logs:
- Railway Dashboard → Logs tab
- Real-time streaming
- Searchable history

---

## Kubernetes (Recommended for Production)

Sarge includes Kustomize manifests for Kubernetes deployments.

### Prerequisites
- Kubernetes cluster (EKS, GKE, AKS, or local)
- `kubectl` configured
- `kustomize` installed

### Directory Structure
```
bridge/
├── base/                    # Common configuration
│   └── kustomization.yaml
├── overlays/
│   ├── dev/                 # Development
│   ├── staging/             # Staging
│   └── prod/                # Production
```

### 1. Customize for Your Environment

Edit `bridge/overlays/prod/kustomization.yaml`:

```yaml
namespace: sarge-prod

configMapGenerator:
  - name: sarge-config
    literals:
      - LOG_LEVEL=info
      - WS_PORT=3200

secretGenerator:
  - name: sarge-secrets
    literals:
      - DATABASE_URL=postgresql://...
      - NEXTAUTH_SECRET=...
      - PROM_METRICS_TOKEN=...

replicas:
  - name: backend
    count: 3
  - name: frontend
    count: 2
```

### 2. Deploy

```bash
# Dry-run to verify
kustomize build bridge/overlays/prod | kubectl apply --dry-run=client -f -

# Apply to cluster
kustomize build bridge/overlays/prod | kubectl apply -f -

# Check rollout
kubectl rollout status deployment/frontend -n sarge-prod
kubectl rollout status deployment/backend -n sarge-prod
```

### 3. Verify Deployment

```bash
# Check pods
kubectl get pods -n sarge-prod

# Check logs
kubectl logs -n sarge-prod -l app=backend -f

# Check services
kubectl get svc -n sarge-prod
```

### 4. Expose via Ingress

Create `bridge/overlays/prod/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sarge-ingress
  namespace: sarge-prod
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - sarge.your-domain.com
      secretName: sarge-tls
  rules:
    - host: sarge.your-domain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 3200
```

Add to kustomization.yaml:
```yaml
resources:
  - ingress.yaml
```

### 5. Rollback

```bash
# View rollout history
kubectl rollout history deployment/backend -n sarge-prod

# Rollback to previous version
kubectl rollout undo deployment/backend -n sarge-prod

# Verify
kubectl rollout status deployment/backend -n sarge-prod
```

### Scaling

Adjust replicas in kustomization.yaml:

```yaml
replicas:
  - name: backend
    count: 5        # Scale up
  - name: frontend
    count: 3
```

Apply:
```bash
kustomize build bridge/overlays/prod | kubectl apply -f -
```

Or manually:
```bash
kubectl scale deployment backend --replicas=5 -n sarge-prod
```

---

## AWS ECS (Fargate)

For EC2-less container deployments.

### Prerequisites
- AWS account
- ECR repository
- ECS cluster
- VPC + security groups

### 1. Build & Push to ECR

```bash
# Build backend
docker build -t sarge-backend ./backend

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# Tag & push
docker tag sarge-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/sarge-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/sarge-backend:latest

# Repeat for frontend (use `next build` + Dockerfile)
```

### 2. Create ECS Task Definition

Via AWS Console or CLI:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

`task-definition.json`:
```json
{
  "family": "sarge-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account>.dkr.ecr.us-east-1.amazonaws.com/sarge-backend:latest",
      "portMappings": [
        {
          "containerPort": 3200,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://..."
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/sarge",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

### 3. Create ECS Service

```bash
aws ecs create-service \
  --cluster sarge-prod \
  --service-name sarge-backend \
  --task-definition sarge-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### 4. Expose via ALB (Load Balancer)

1. Create ALB in EC2 console
2. Add target group → ECS service
3. Configure listener (80 → 443 with SSL)
4. Point domain to ALB DNS

### 5. Auto-scaling

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/sarge-prod/sarge-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --policy-name sarge-backend-scaling \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/sarge-prod/sarge-backend \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration "TargetValue=70,PredefinedMetricSpecification={PredefinedMetricType=ECSServiceAverageCPUUtilization}"
```

---

## Fly.io (WebSocket Server)

For dedicated WebSocket endpoint.

### 1. Create Fly App

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
fly launch --name sarge-ws --dockerfile ./backend/Dockerfile
```

### 2. Configure fly.toml

```toml
app = "sarge-ws"
kill_signal = "SIGTERM"
kill_timeout = 5

[env]
  DATABASE_URL = "postgresql://..."
  LOG_LEVEL = "info"
  WS_PORT = "3200"

[[services]]
  internal_port = 3200
  protocol = "tcp"
  
  [services.concurrency]
    type = "connections"
    hard_limit = 1000
    soft_limit = 100
```

### 3. Deploy

```bash
fly deploy
```

### 4. Custom Domain

```bash
fly certs add ws.your-domain.com
```

Update frontend `NEXT_PUBLIC_WS_URL`:
```env
NEXT_PUBLIC_WS_URL=wss://ws.your-domain.com/ws
```

---

## Environment Variables (Production)

### Required
| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/sarge` | Use Neon or managed PostgreSQL |
| `NEXTAUTH_SECRET` | (generate: `openssl rand -hex 32`) | Keep secret; rotate if compromised |
| `NEXTAUTH_URL` | `https://sarge.your-domain.com` | Must match actual domain |

### Recommended
| Variable | Example | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_WS_URL` | `wss://api.your-domain.com/ws` | If backend on separate domain |
| `PROM_METRICS_TOKEN` | (secret token) | Protect Prometheus endpoint |
| `LOG_LEVEL` | `info` or `debug` | Set to `error` in production |

### Optional
| Variable | Example | Notes |
|----------|---------|-------|
| `ANTHROPIC_API_KEY` | `sk-...` | For AI Co-Pilot features |
| `ENABLE_AI_ANALYSIS` | `true` | Feature flag for AI |
| `RATE_LIMIT_MAX` | `100` | Requests per window |
| `RATE_LIMIT_WINDOW_SEC` | `60` | Rate limit window |

### Secrets Management

**Best practices:**
1. Use platform-managed secrets (Vercel, Railway, AWS Secrets Manager)
2. Rotate `NEXTAUTH_SECRET` regularly
3. Keep `DATABASE_URL` separate for staging/prod
4. Never commit `.env.local` to Git

---

## Database Migrations

When schema changes:

1. **Create migration:**
```sql
-- backend/src/db/migrations/001_initial.sql
CREATE TABLE IF NOT EXISTS my_table (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. **Run in dev:**
```bash
psql "$DATABASE_URL" -f backend/src/db/migrations/001_initial.sql
```

3. **Before prod deploy:**
```bash
# Test migration against prod DB copy
psql "$PROD_DATABASE_URL" -f backend/src/db/migrations/001_initial.sql
```

4. **In CI/CD:**
Add to deployment pipeline to auto-run migrations.

---

## Monitoring in Production

### Prometheus
Set `PROM_METRICS_TOKEN` environment variable:

```env
PROM_METRICS_TOKEN=secret-token-123
```

Configure Prometheus to scrape (add to `prometheus.yml`):

```yaml
scrape_configs:
  - job_name: 'sarge'
    static_configs:
      - targets: ['sarge.your-domain.com:443']
    scheme: https
    params:
      token: ['secret-token-123']
    metrics_path: '/api/metrics'
```

### Grafana
1. Add Prometheus data source
2. Import dashboards from `grafana/dashboards/*.json`
3. Set up alerts

### Alertmanager
1. Configure notification channels in `alertmanager.yml`
2. Set up alert routing (Slack, PagerDuty, etc.)

See [MONITORING.md](MONITORING.md) for detailed setup.

---

## SSL/TLS

### Vercel
Auto-managed (included with domain).

### Kubernetes + Cert-Manager
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@your-domain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

### Manual (Nginx)
```bash
# Generate self-signed cert
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/sarge.key \
  -out /etc/nginx/ssl/sarge.crt

# Or use Let's Encrypt
certbot certonly --standalone -d sarge.your-domain.com
```

Configure Nginx:
```nginx
server {
  listen 443 ssl http2;
  server_name sarge.your-domain.com;

  ssl_certificate /etc/nginx/ssl/sarge.crt;
  ssl_certificate_key /etc/nginx/ssl/sarge.key;

  location / {
    proxy_pass http://frontend:3000;
  }

  location /ws {
    proxy_pass http://backend:3200;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

---

## Rollback Procedure

### Kubernetes
```bash
# View history
kubectl rollout history deployment/backend -n sarge-prod

# Rollback
kubectl rollout undo deployment/backend -n sarge-prod --to-revision=3
```

### Vercel
1. Vercel Dashboard → Deployments
2. Click deployment to rollback to
3. Click "Promote to Production"

### Railway/Docker
```bash
# Restart previous service version
docker service update --image previous-image-tag sarge-backend
```

---

## Troubleshooting

### Services won't start
- Check environment variables are set
- Verify database connection: `psql "$DATABASE_URL"`
- Check logs: `kubectl logs -f deployment/backend`

### High latency
- Check database query performance
- Monitor CPU/memory usage
- Scale up replicas if needed
- Check network connectivity

### Deployments failing
- Verify image is built correctly
- Check registry credentials
- Review deployment logs
- Ensure resource limits aren't exceeded

### SSL certificate issues
- Check certificate expiration: `openssl x509 -in cert.pem -text -noout`
- Renew: `certbot renew` or platform auto-renewal

---

## Next Steps
- [Architecture](ARCHITECTURE_COMPLETE.md) for system design
- [Development](DEVELOPMENT.md) for local setup
- [Monitoring](MONITORING.md) for observability setup
- [Contributing](../CONTRIBUTING.md) for code guidelines
