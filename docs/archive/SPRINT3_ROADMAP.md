# Sprint 3 Roadmap: Delivery & Observability Cohesion

## Overview
Sprint 3 focuses on making the provider system production-ready and completing the observability integration.

## Epic 1: Database Persistence & Credentials (Critical Path)

### 1.1 Run Migrations
**File**: `scripts/migrations/002_add_provider_tables.sql`

```bash
psql $DATABASE_URL < scripts/migrations/002_add_provider_tables.sql
```

Creates:
- `provider_connections` (project_id, provider_id, credentials JSONB, status, connected_at)
- `environments` (project_id, provider_id, name, type, region, resource_config, status)
- `deployments_extended` (deployment_id, provider_id, environment_id, preview_url, production_url)
- `cost_estimates` (project_id, provider_id, service_type, hourly_cost, monthly_cost)

### 1.2 Implement Credential Storage
Update `backend/src/api/routers/providers.ts`:
```typescript
toggle: secureProcedure('providers.toggle')
  .input(...)
  .mutation(async ({ ctx, input }) => {
    if (input.connect) {
      // Insert into provider_connections table
      // Encrypt credentials before storage
      // Return success
    } else {
      // Mark as disconnected
    }
  })
```

### 1.3 Add OAuth Flows per Provider
Create `backend/src/api/lib/oauth/`:
- `vercel-oauth.ts` — OAuth flow for Vercel
- `railway-oauth.ts` — Railway API token setup
- `render-oauth.ts` — Render.com OAuth
- Similar for other providers

Frontend OAuth button in `/app/targets/page.tsx`:
```tsx
<button onClick={() => initiateOAuth('vercel')} >
  Connect Vercel via OAuth
</button>
```

## Epic 2: Real Provider API Integration

### 2.1 Vercel Deploy
**File**: `backend/src/api/lib/providers/index.ts` - Update VercelProvider.deploy()

Use `@vercel/sdk`:
```typescript
import { Vercel } from '@vercel/sdk'

const vercel = new Vercel({ auth: token })
const deployment = await vercel.deployments.create({
  name: projectName,
  gitRepository: { type: 'github', repo: repoUrl },
  target: environmentName === 'production' ? 'production' : 'preview'
})
```

### 2.2 Railway Deploy
**File**: `backend/src/api/lib/providers/index.ts` - Update RailwayProvider.deploy()

Use Railway GraphQL API:
```typescript
const query = `
  mutation CreateDeployment($input: DeploymentInput!) {
    deploymentCreate(input: $input) {
      deployment { id status url }
    }
  }
`
```

### 2.3 AWS ECS/CloudFormation Deploy
**File**: Similar pattern for AWSProvider

Use AWS SDK:
```typescript
import { CloudFormationClient } from '@aws-sdk/client-cloudformation'
const cf = new CloudFormationClient()
await cf.createStack({
  StackName: stackName,
  TemplateBody: cfTemplate,
  Parameters: [...]
})
```

## Epic 3: Preview Environment Auto-Generation

### 3.1 GitHub PR Detection
Update `backend/src/api/routers/oneclick.ts`:

```typescript
// On each push to a branch (webhook or manual trigger)
detectRepo: secureProcedure(...).mutation(async ({ input }) => {
  // If branch is a PR branch (e.g., feature/* or pr/*)
  const isPR = input.branch.startsWith('feature/') || input.branch === 'pr/*'
  
  if (isPR && provider.kind === 'containers') {
    // Trigger ephemeral environment creation
    await provider.deploy({
      environmentName: 'preview',
      // Will auto-generate: preview-<branch>-project.railway.app
    })
  }
})
```

### 3.2 Provider-Specific Preview URLs
Render preview URLs based on provider pattern:

```typescript
// Vercel: https://project-<pr#>-owner.vercel.app
// Railway: https://project-<branch>-env.railway.app  
// Render: https://project-preview-<id>.onrender.com
// AWS: https://preview-<id>.elb.amazonaws.com
```

### 3.3 Store Preview URLs in Database
After deploy, save URL:
```typescript
await ctx.db.query(
  `INSERT INTO deployments_extended 
   (deployment_id, provider_id, preview_url, production_url)
   VALUES ($1, $2, $3, $4)`,
  [deploymentId, providerId, previewUrl, productionUrl]
)
```

## Epic 4: Deployment Lifecycle Management

### 4.1 Add Rollback Actions
New endpoint in `deploy.ts`:
```typescript
rollback: secureProcedure('deploy.rollback')
  .input(z.object({
    deploymentId: z.string(),
    providerId: z.string(),
    targetVersion: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    const provider = getProvider(input.providerId)
    // Call provider-specific rollback API
    // Vercel: revert to previous deployment
    // Railway: switch traffic to previous version
  })
```

### 4.2 Zero-Downtime Deployments
Add blue-green deployment support:
```typescript
// For each provider, implement canary/blue-green strategy
deploy: async (opts: DeployOptions) => {
  // Step 1: Deploy new version (green) alongside current (blue)
  // Step 2: Run health checks on green
  // Step 3: Route traffic to green
  // Step 4: Keep blue as rollback target
}
```

## Epic 5: Cost Tracking & Alerts

### 5.1 Real-Time Cost Calculation
Update `deploy.estimateCost`:
```typescript
estimateCost: secureProcedure(...)
  .query(async ({ input }) => {
    // Fetch actual provider pricing
    const rates = await fetchProviderRates(input.providerId)
    const estimate = rates.compute(input.resourceConfig)
    return estimate
  })
```

### 5.2 Monthly Cost Alerts
New endpoint:
```typescript
checkCostAlert: secureProcedure('deploy.checkCostAlert')
  .query(async ({ ctx }) => {
    const costs = await ctx.db.query(
      `SELECT COALESCE(SUM(monthly_cost), 0) FROM cost_estimates 
       WHERE project_id = $1 AND month = CURRENT_MONTH`,
      [ctx.projectId]
    )
    if (costs.rows[0].sum > ALERT_THRESHOLD) {
      // Emit alert to UI
      return { alert: true, amount: costs.rows[0].sum }
    }
  })
```

### 5.3 Cost UI Component
Update `/app/targets/page.tsx`:
```tsx
<div className="glass-card">
  <h3>Monthly Cost Estimate</h3>
  <div className="cost-breakdown">
    {costEstimate.breakdown.map(item => (
      <div key={item.provider}>
        {item.provider}: ${item.monthly} / month
      </div>
    ))}
  </div>
  {alert && <div className="alert">Approaching budget limit!</div>}
</div>
```

## Epic 6: Observability Integration

### 6.1 Provider-Aware Logs
Update `app/logs/page.tsx`:
```tsx
// Add filter for provider + environment
<select onChange={(e) => setProviderFilter(e.target.value)}>
  <option>All Providers</option>
  {providers.map(p => (
    <option key={p.id}>{p.name}</option>
  ))}
</select>

// Filter logs by deployment metadata
logs.filter(log => 
  log.metadata.provider === providerFilter
)
```

### 6.2 Provider Metrics
Update `app/metrics/page.tsx`:
```tsx
// Link to provider-specific dashboards
const dashboardUrl = {
  vercel: `https://vercel.com/dashboard/project/${projectId}`,
  railway: `https://railway.app/project/${projectId}`,
  // etc.
}

<a href={dashboardUrl[provider]}>
  View {provider} Dashboard →
</a>
```

### 6.3 Observability Hub Links
Update `app/observability/page.tsx`:
```tsx
// Quick access to provider-specific tools
<div className="provider-shortcuts">
  {providers.map(p => (
    <a href={p.dashboardUrl} key={p.id}>
      {p.name} Dashboard
    </a>
  ))}
</div>
```

## Implementation Priority

**Phase 1 (Week 1)**: Database + Credentials
1. Run migrations
2. Update providers router to use DB storage
3. Add OAuth setup for 1 provider (Vercel)

**Phase 2 (Week 2)**: Real API Integration
1. Integrate Vercel SDK
2. Integrate Railway API
3. Test E2E: connect → deploy → track

**Phase 3 (Week 3)**: Advanced Features
1. Preview environment auto-generation
2. Rollback actions
3. Cost tracking

**Phase 4 (Week 4)**: Polish
1. Observability integration
2. UI refinement
3. Testing & documentation

## Testing Strategy

### Unit Tests
```typescript
// test/providers.test.ts
describe('Vercel Provider', () => {
  it('should deploy to Vercel with correct params', async () => {
    // Mock Vercel SDK
    // Call provider.deploy()
    // Verify SDK was called correctly
  })
})
```

### Integration Tests
```typescript
// test/deploy.test.ts
describe('Multi-provider deploy flow', () => {
  it('should create deployment via Vercel', async () => {
    // Use real Vercel API (staging credentials)
    // Trigger deploy
    // Verify deployment record created
    // Cleanup
  })
})
```

### E2E Tests
```bash
# Cypress/Playwright tests
1. User connects Vercel via OAuth
2. User selects repo
3. User deploys
4. Verify /deployments shows provider badge
5. Verify preview URL accessible
```

## Deliverables

**Code**:
- ✅ Provider system wired into DB
- ✅ Real API integrations (all 6 providers)
- ✅ Preview environment creation
- ✅ Cost tracking
- ✅ Observability integration

**Documentation**:
- ✅ Provider setup guides (OAuth flows per provider)
- ✅ Cost model documentation
- ✅ Troubleshooting guide

**User-Facing**:
- ✅ Targets page fully functional
- ✅ Launch wizard multi-provider flow working
- ✅ Deployments list shows provider + cost
- ✅ Observability hub linked to provider dashboards

---

**Estimated Effort**: 4 weeks (80 engineering hours)

**Blocking Issues**: None (all Sprint 2 dependencies met)

**Success Criteria**: 
- [ ] All 6 providers deployable from Launch wizard
- [ ] Database persistence fully functional
- [ ] Preview URLs auto-generated on PR
- [ ] Cost estimates accurate within 10%
- [ ] Zero provider integration regressions
