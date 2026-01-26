# Multi-Provider Deployment Architecture

## Overview
Sarge now supports deploying to 9+ cloud platforms (Vercel, Railway, Render, Cloudflare Pages, AWS, GCP, Azure, Fly.io, GitHub Pages) through a unified provider abstraction layer.

## Architecture

### 1. Provider Interface (`backend/src/api/lib/providers/index.ts`)

All providers implement a common interface:

```typescript
interface IProvider {
  id: string                                    // 'vercel', 'railway', etc
  name: string                                  // Display name
  kind: 'containers' | 'functions' | 'static'  // Deployment type
  
  deploy(opts: DeployOptions): Promise<DeployResult>
  getStatus(opts: StatusOptions): Promise<DeploymentStatus>
  generatePreviewUrl(opts: PreviewOptions): Promise<string>
  estimateCost(opts: CostOptions): Promise<CostEstimate>
  listEnvironments(opts: ListEnvOptions): Promise<Environment[]>
}
```

### 2. Providers Implemented

#### Static Site Hosts
- **Vercel** (`vercel`)
  - Type: Static site deployments
  - Preview: Auto-generated PR preview URLs
  - Cost: $20/mo pro tier
  - Integration: Uses Vercel API for GitHub-connected projects

- **Cloudflare Pages** (`cloudflare`)
  - Type: Static site deployments
  - Preview: Branch deployment URLs
  - Cost: Free tier (5M requests/month)
  - Integration: Workers + Pages API

#### Container Platforms
- **Railway** (`railway`)
  - Type: Container deployments
  - Preview: Ephemeral per-branch environments
  - Cost: Free tier + $7/mo starter
  - Integration: GraphQL API with GitHub sync

- **Render** (`render`)
  - Type: Container deployments
  - Preview: Ephemeral environments per branch
  - Cost: $7/mo starter tier
  - Integration: REST API with service creation

- **Fly.io** (`fly`)
  - Type: Container deployments (global Anycast)
  - Preview: Regional preview environments
  - Cost: Free tier + pay-go compute
  - Integration: Fly API with machine management

- **AWS** (`aws`)
  - Type: Container (ECS/Fargate) or Serverless (Lambda)
  - Preview: CloudFormation stacks with ALB
  - Cost: Highly variable (compute + storage + data transfer)
  - Integration: AWS SDK (CloudFormation/ECS APIs)

#### Planned
- **GitHub Pages** (`github`): Static site host integrated with GitHub
- **GCP Cloud Run** (`gcp`): Serverless container platform
- **Azure Container Apps** (`azure`): Managed container platform

### 3. tRPC Endpoints

#### Deploy Router (`/backend/src/api/routers/deploy.ts`)

**`deploy.create`** - Standard deployment
```typescript
await t.deploy.create.mutate({
  branch: 'main',
  summary: 'Deploy from main',
  provider: 'vercel',        // NEW: Multi-provider support
  environment: 'preview',    // NEW: Environment selection
})
```

**`deploy.deployToProvider`** - Direct provider deployment
```typescript
await t.deploy.deployToProvider.mutate({
  providerId: 'railway',
  repoUrl: 'https://github.com/owner/repo',
  branch: 'main',
  buildCommand: 'pnpm build',
  environmentName: 'production',
  resourceConfig: {
    cpu: 0.5,
    memory: 512,
    replicas: 2,
  }
})
```

**`deploy.estimateCost`** - Cost estimation
```typescript
const cost = await t.deploy.estimateCost.query({
  providerId: 'railway',
  environmentName: 'production',
  resourceConfig: { cpu: 1, memory: 1024 }
})
// Returns: { hourlyRate: 0.15, monthlyEstimate: 110, breakdown: { compute: 110 } }
```

**`deploy.getProviderStatus`** - Real-time deployment status
```typescript
const status = await t.deploy.getProviderStatus.query({
  providerId: 'railway',
  deploymentId: 'dep_xyz123'
})
```

#### Environments Router (`/backend/src/api/routers/environments.ts`)

**`environments.list`** - List all environments
```typescript
const envs = await t.environments.list.query({
  projectSlug: 'my-project',
  providerId: 'railway'  // Optional: filter by provider
})
```

**`environments.create`** - Create new environment
```typescript
await t.environments.create.mutate({
  projectSlug: 'my-project',
  providerId: 'railway',
  name: 'staging',
  type: 'staging',
  resourceConfig: {
    cpu: 0.5,
    memory: 512,
  }
})
```

**`environments.update`** - Update environment config
```typescript
await t.environments.update.mutate({
  environmentId: 'env_xyz',
  resourceConfig: {
    replicas: 3,
    memory: 1024,
  }
})
```

**`environments.delete`** - Delete environment
```typescript
await t.environments.delete.mutate({
  environmentId: 'env_xyz',
  providerId: 'railway'
})
```

**`environments.getDetails`** - Full environment with cost
```typescript
const details = await t.environments.getDetails.query({
  environmentId: 'env_xyz',
  providerId: 'railway'
})
// Returns environment + estimatedCost breakdown
```

#### Providers Router (`/backend/src/api/routers/providers.ts`)

**`providers.list`** - List all providers and their connection status
```typescript
const providers = await t.providers.list.query({
  projectSlug: 'my-project'
})
// Returns: [
//   { id: 'vercel', name: 'Vercel', status: 'connected', cost_hint: '20/mo' },
//   { id: 'railway', name: 'Railway', status: 'disconnected', cost_hint: '7/mo' }
// ]
```

**`providers.toggle`** - Connect/disconnect provider
```typescript
await t.providers.toggle.mutate({
  projectSlug: 'my-project',
  providerId: 'railway',
  connect: true  // Connect (store credentials)
})
```

### 4. Frontend Integration

#### Components

**Targets Page** (`/app/targets/page.tsx`)
- Displays all 9 providers with icons and cost hints
- Connect/Disconnect buttons
- Real-time status updates via tRPC

**Launch Wizard** (`/components/oneclick/auto-deploy.tsx`)
- Provider selector (cards with badges)
- Environment picker (preview/staging/production)
- Cost hints before deploy
- Deploy blocked until provider connected

**Deployments List** (`/app/deployments/page.tsx`)
- Metadata badges showing `[provider:railway]` and `[env:production]`
- "Obs" shortcut button to observability hub
- Provider-specific icons

#### Flow Diagram
```
User connects provider in /targets
        ↓
User selects repo in /oneclick
        ↓
System detects blueprint (services, ports, dependencies)
        ↓
User picks provider (dropdown) and environment (toggle)
        ↓
Cost estimate shown (from provider.estimateCost)
        ↓
Deploy button triggers provider-specific flow:
    - Vercel: GitHub commit → auto PR preview + production
    - Railway: GraphQL mutation → container deployed
    - AWS: CloudFormation stack → ECS task running
    - etc.
        ↓
Deployment record created with metadata [provider:x] [env:y]
        ↓
/deployments shows provider badge and links to provider-generated URLs
```

### 5. Data Persistence

#### Database Schema (`scripts/migrations/002_add_provider_tables.sql`)

```sql
-- Provider connections per project
CREATE TABLE provider_connections (
  id UUID PRIMARY KEY,
  project_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,           -- 'vercel', 'railway', etc
  credentials JSONB,                   -- Encrypted API tokens/secrets
  status TEXT DEFAULT 'disconnected',  -- 'connected' | 'disconnected'
  connected_at TIMESTAMP,
  last_error TEXT
)

-- Environments per provider
CREATE TABLE environments (
  id UUID PRIMARY KEY,
  project_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  name TEXT NOT NULL,                  -- 'preview', 'production', etc
  type TEXT,                           -- 'preview' | 'staging' | 'production'
  region TEXT,                         -- AWS region, etc
  resource_config JSONB,               -- { cpu, memory, replicas, storage }
  status TEXT DEFAULT 'active'
)

-- Extended deployment records
CREATE TABLE deployments_extended (
  deployment_id UUID,
  provider_id TEXT,
  environment_id UUID,
  git_ref TEXT,
  preview_url TEXT,
  production_url TEXT,
  metadata JSONB
)

-- Cost estimates
CREATE TABLE cost_estimates (
  id UUID PRIMARY KEY,
  project_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  service_type TEXT,                   -- 'compute', 'storage', 'traffic'
  hourly_cost DECIMAL,
  monthly_cost DECIMAL
)
```

### 6. How to Add a New Provider

1. **Create Provider Class** in `backend/src/api/lib/providers/index.ts`:
```typescript
class NewProviderImpl implements IProvider {
  id = 'newprovider'
  name = 'New Provider'
  kind: 'containers' = 'containers'
  
  async deploy(opts: DeployOptions): Promise<DeployResult> {
    // Call provider API
    // Return { success, deploymentId, previewUrl, productionUrl, metadata }
  }
  
  async getStatus(opts: StatusOptions): Promise<DeploymentStatus> { }
  async generatePreviewUrl(opts: PreviewOptions): Promise<string> { }
  async estimateCost(opts: CostOptions): Promise<CostEstimate> { }
  async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> { }
}
```

2. **Register in Factory**:
```typescript
export function getProvider(providerId: string): IProvider | null {
  switch (providerId) {
    case 'newprovider':
      return new NewProviderImpl()
    // ...
  }
}
```

3. **Add to Targets UI** (`/components/layout/sidebar.tsx`):
```typescript
const PROVIDERS = [
  // ... existing
  { id: 'newprovider', name: 'New Provider', kind: 'containers' }
]
```

4. **Test**:
   - Connect provider in `/targets`
   - Deploy via `/oneclick`
   - Check deployment record in `/deployments`

### 7. Environment Variables

Required for provider integration:

```bash
# Provider-specific tokens (set in environment or via UI)
VERCEL_TOKEN=xxx
RAILWAY_TOKEN=xxx
RENDER_TOKEN=xxx
CLOUDFLARE_TOKEN=xxx
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
FLY_API_TOKEN=xxx

# Database for persistence (when migrations are run)
DATABASE_URL=postgresql://user:pass@host:5432/sarge
```

### 8. Cost Model

Each provider reports hourly and monthly costs for resource configurations:

```typescript
interface CostEstimate {
  hourlyRate: number,                // e.g., 0.05 (cents/hour?)
  monthlyEstimate: number,           // e.g., 36.50
  breakdown: {
    compute: 30,
    storage: 5,
    traffic: 1.5
  }
}
```

Formula varies per provider:
- **Vercel**: Fixed $20/mo
- **Railway**: Free tier + `(cpu * 10) + (memory_mb * 0.01) / 1024`
- **AWS**: `(cpu * 0.0255 * 730) + (memory_mb * 0.028 * 730) / 1024`
- **Cloudflare**: Free tier (0 for Pages)
- **Fly.io**: `(cpu * 15) + (memory_mb * 1) / 256`

### 9. Future Enhancements

- [ ] OAuth2 credential flows per provider (no hardcoded tokens)
- [ ] Preview URL auto-generation on PR
- [ ] Automatic rollback on failed deployment
- [ ] Multi-region deployments (same app on Vercel + Railway simultaneously)
- [ ] Usage tracking and cost alerts
- [ ] Zero-downtime deployments (blue-green per provider)
- [ ] Provider-specific custom domains and SSL
- [ ] Native environment variable management per provider
