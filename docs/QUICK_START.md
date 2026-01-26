# Quick Start Guide - New Features

## 🚀 Using the New Features

### 1. Traffic Management (Blue/Green & Canary)

```typescript
// Create blue/green deployment
await trpc.traffic.createBlueGreen.mutate({
  deploymentId: 'deploy-123',
  blueVersion: 'v1.0',
  greenVersion: 'v2.0',
  blueWeight: 100,
  greenWeight: 0,
})

// Switch traffic instantly
await trpc.traffic.executeBlueGreenSwitch.mutate({
  configId: 'config-123',
  newBlueWeight: 0,
  newGreenWeight: 100,
})

// Create canary rollout
await trpc.traffic.createCanary.mutate({
  deploymentId: 'deploy-123',
  stableVersion: 'v1.0',
  canaryVersion: 'v2.0',
  incrementStep: 10, // Increase by 10% each step
})

// Gradually increase canary traffic
await trpc.traffic.incrementCanary.mutate({
  configId: 'config-123',
})

// Emergency rollback
await trpc.traffic.rollbackCanary.mutate({
  configId: 'config-123',
})
```

---

### 2. Health Checks

```typescript
// Configure HTTP health check
await trpc.healthChecks.create.mutate({
  deploymentId: 'deploy-123',
  checkType: 'http',
  endpoint: 'https://myapp.com/health',
  intervalSeconds: 60,
  timeoutSeconds: 10,
  retries: 3,
  expectedStatus: 200,
})

// Execute check manually
await trpc.healthChecks.execute.mutate({
  healthCheckId: 'check-123',
})

// View check history
const history = await trpc.healthChecks.history.query({
  healthCheckId: 'check-123',
  limit: 100,
})
```

---

### 3. Managed Databases

```typescript
// Provision PostgreSQL database
await trpc.databases.create.mutate({
  projectId: 'proj-123',
  name: 'production-db',
  engine: 'postgresql',
  version: '15',
  provider: 'aws',
  region: 'us-east-1',
  instanceType: 'db.t3.micro',
  storageGb: 20,
  enableBackups: true,
  backupRetentionDays: 7,
  enablePointInTimeRecovery: true,
})

// Create backup
await trpc.databases.createBackup.mutate({
  databaseId: 'db-123',
  description: 'Pre-deployment backup',
})

// Clone database
await trpc.databases.clone.mutate({
  sourceDatabaseId: 'db-123',
  cloneName: 'staging-db',
  snapshotTime: '2024-12-01T10:00:00Z', // Optional PITR
})

// Restore from backup
await trpc.databases.restore.mutate({
  backupId: 'backup-123',
  targetDatabaseId: 'db-456', // Optional, defaults to original
})
```

---

### 4. Alerting & Notifications

```typescript
// Create Slack notification channel
const channel = await trpc.alerts.createChannel.mutate({
  projectId: 'proj-123',
  name: 'Slack - #alerts',
  type: 'slack',
  config: {
    webhookUrl: 'https://hooks.slack.com/services/...',
  },
})

// Create alert rule
await trpc.alerts.createRule.mutate({
  projectId: 'proj-123',
  name: 'High CPU Usage',
  ruleType: 'metric',
  condition: {
    metric: 'cpu_usage',
    operator: 'gt',
    threshold: 80,
    duration: 300, // 5 minutes
  },
  severity: 'critical',
  notificationChannelIds: [channel.channelId],
})

// List active alerts
const alerts = await trpc.alerts.listActive.query({
  projectId: 'proj-123',
})

// Resolve alert
await trpc.alerts.resolve.mutate({
  alertId: 'alert-123',
})
```

---

### 5. Kubernetes

```typescript
// Connect existing cluster (BYOK)
await trpc.kubernetes.connectCluster.mutate({
  projectId: 'proj-123',
  name: 'Production Cluster',
  provider: 'byok',
  kubeconfig: btoa(kubeconfigYaml), // Base64 encoded
})

// Deploy application
await trpc.kubernetes.deploy.mutate({
  clusterId: 'cluster-123',
  deploymentName: 'my-app',
  namespace: 'production',
  image: 'myregistry/app:v1.0',
  replicas: 3,
  port: 8080,
  env: {
    DATABASE_URL: 'postgres://...',
    API_KEY: 'secret',
  },
  resources: {
    requests: { cpu: '100m', memory: '128Mi' },
    limits: { cpu: '500m', memory: '512Mi' },
  },
  enableHpa: true,
  hpaConfig: {
    minReplicas: 2,
    maxReplicas: 10,
    targetCpuPercent: 70,
  },
})

// Deploy Helm chart
await trpc.kubernetes.deployHelm.mutate({
  clusterId: 'cluster-123',
  releaseName: 'nginx-ingress',
  chartName: 'nginx-ingress',
  repository: 'stable',
  values: {
    controller: {
      replicaCount: 2,
    },
  },
})

// Scale deployment
await trpc.kubernetes.scale.mutate({
  deploymentId: 'deploy-123',
  replicas: 5,
})
```

---

### 6. Environment Cloning

```typescript
// Clone production to staging
await trpc.environments.clone.mutate({
  sourceEnvironmentId: 'env-prod',
  cloneName: 'staging-clone',
  cloneType: 'staging',
  autoStop: true,
  autoStopAfterMinutes: 60,
  copySecrets: true,
  copyDatabases: false,
})

// Create reusable template
await trpc.environments.createTemplate.mutate({
  projectId: 'proj-123',
  name: 'Standard Preview Environment',
  environmentType: 'preview',
  providerId: 'aws',
  resourceConfig: {
    cpu: 500,
    memory: 512,
    replicas: 1,
  },
  defaultSecrets: {
    NODE_ENV: 'preview',
    LOG_LEVEL: 'debug',
  },
})

// Create environment from template
await trpc.environments.createFromTemplate.mutate({
  templateId: 'tmpl-123',
  environmentName: 'pr-456-preview',
  overrideResourceConfig: {
    memory: 1024, // Override template default
  },
})
```

---

### 7. Cost Optimization

```typescript
// Get cost overview
const costs = await trpc.costOptimization.getCostOverview.query({
  projectId: 'proj-123',
  timeRange: '30d',
})

// Get optimization recommendations
const recs = await trpc.costOptimization.getRecommendations.query({
  projectId: 'proj-123',
})

// Apply recommendation
await trpc.costOptimization.applyRecommendation.mutate({
  recommendationId: recs.recommendations[0].id,
  resourceId: recs.recommendations[0].resourceId,
  actionType: 'resize',
  newConfig: { cpu: 1000, memory: 1024 },
})

// Set monthly budget
await trpc.costOptimization.setBudgetAlert.mutate({
  projectId: 'proj-123',
  monthlyBudget: 500,
  alertThresholds: [50, 80, 100], // Alert at 50%, 80%, 100%
  notificationChannelId: 'channel-123',
})

// Get cost forecast
const forecast = await trpc.costOptimization.forecastCosts.query({
  projectId: 'proj-123',
  forecastDays: 30,
})
```

---

## 🔧 Environment Variables

Add to your `.env.local`:

```bash
# GCP (for Cloud Run deployments)
GCP_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
GCP_PROJECT_ID=my-project-123
GCP_REGION=us-central1

# Azure (for Container Apps)
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-secret-here
AZURE_SUBSCRIPTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_RESOURCE_GROUP=my-resource-group
AZURE_REGION=eastus

# Notification Webhooks (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
PAGERDUTY_INTEGRATION_KEY=your-key-here
```

---

## 📊 Database Setup

Run migrations for new tables:

```sql
-- Kubernetes tables
CREATE TABLE k8s_clusters (
  id VARCHAR PRIMARY KEY,
  project_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  provider VARCHAR NOT NULL,
  kubeconfig_encrypted TEXT NOT NULL,
  context VARCHAR,
  status VARCHAR DEFAULT 'connecting',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alerting tables
CREATE TABLE alert_rules (
  id VARCHAR PRIMARY KEY,
  project_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  rule_type VARCHAR NOT NULL,
  condition JSONB NOT NULL,
  severity VARCHAR NOT NULL,
  notification_channels JSONB,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- See SARGE_100_COMPLETE.md for full schema
```

---

## 🎯 Frontend Integration Examples

### React Component Example

```typescript
import { trpc } from '@/lib/trpc'

export function HealthChecksDashboard({ deploymentId }: { deploymentId: string }) {
  const { data: checks } = trpc.healthChecks.list.useQuery({ deploymentId })
  const createCheck = trpc.healthChecks.create.useMutation()

  return (
    <div>
      <h2>Health Checks</h2>
      {checks?.map(check => (
        <div key={check.id}>
          <p>{check.endpoint}</p>
          <p>Status: {check.last_check_success ? '✅' : '❌'}</p>
        </div>
      ))}
      <button onClick={() => createCheck.mutate({
        deploymentId,
        checkType: 'http',
        endpoint: 'https://myapp.com/health',
        intervalSeconds: 60,
      })}>
        Add Health Check
      </button>
    </div>
  )
}
```

---

## 🚨 Troubleshooting

### Health Check Not Running
```typescript
// Manually execute health check
await trpc.healthChecks.execute.mutate({ healthCheckId: 'check-123' })
```

### Alert Not Firing
```typescript
// Test notification channel
await trpc.alerts.testChannel.mutate({ channelId: 'channel-123' })
```

### Database Clone Failed
```typescript
// Check backup status
const backups = await trpc.databases.listBackups.query({ databaseId: 'db-123' })
console.log('Latest backup:', backups[0])
```

### Kubernetes Deployment Stuck
```typescript
// Check pod logs
const logs = await trpc.kubernetes.getLogs.query({
  deploymentId: 'deploy-123',
  tailLines: 100,
})
console.log(logs)
```

---

## 📚 Additional Resources

- **Full Documentation:** `/docs/SARGE_100_COMPLETE.md`
- **Implementation Details:** `/docs/IMPLEMENTATION_SUMMARY.md`
- **Feature Gap Analysis:** `/docs/QOVERY_FEATURE_GAP.md`
- **Provider Setup:** `/docs/GCP_AZURE_ADDED.md`

---

*Last Updated: December 2024*  
*Version: 1.0*
