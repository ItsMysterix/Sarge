# Sprint 2 & 3 Blockers: Items Requiring Manual User Setup

## Critical Blockers (User Action Required)

### Provider OAuth Credentials

#### Vercel
- **Required**: OAuth App on Vercel Platform
  - Location: https://vercel.com/account/settings/tokens
  - Generate: Personal Access Token (needs deployments:read, deployments:write)
  - User must: [ ] Create token, [ ] Add to `.env.local` as `VERCEL_TOKEN`

#### Railway
- **Required**: Railway API Token
  - Location: https://railway.app/account/tokens
  - Type: API Token (requires project access)
  - User must: [ ] Generate token, [ ] Add to `.env.local` as `RAILWAY_TOKEN`

#### Render
- **Required**: Render API Key
  - Location: https://dashboard.render.com/api-keys
  - Scope: Full access
  - User must: [ ] Create key, [ ] Add to `.env.local` as `RENDER_TOKEN`

#### Cloudflare Pages
- **Required**: Cloudflare API Token
  - Location: https://dash.cloudflare.com/profile/api-tokens
  - Permission: Edit Cloudflare Pages
  - User must: [ ] Create token, [ ] Add to `.env.local` as `CLOUDFLARE_TOKEN`

#### AWS
- **Required**: AWS Access Keys
  - Location: AWS IAM > Users > Security Credentials
  - Permissions: CloudFormation, ECS, CloudWatch (create policy)
  - User must: [ ] Generate keys, [ ] Add to `.env.local` as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

#### Fly.io
- **Required**: Fly.io API Token
  - Location: https://fly.io/app/auth/cli/new
  - Scope: Full access
  - User must: [ ] Create token, [ ] Add to `.env.local` as `FLY_API_TOKEN`

### Database Setup

#### PostgreSQL Connection
- **Required**: `DATABASE_URL` environment variable
- Format: `postgresql://user:password@host:5432/sarge`
- User must: [ ] Set up Neon database, [ ] Configure connection string, [ ] Add to `.env.local`

#### Run Migrations
- **File**: `/scripts/migrations/002_add_provider_tables.sql`
- Command: `psql $DATABASE_URL < scripts/migrations/002_add_provider_tables.sql`
- User must: [ ] Execute migration, [ ] Verify tables created

### GitHub Integration (Optional but Recommended)

#### GitHub OAuth App
- **Required**: For real GitHub authentication
  - Location: GitHub Settings > Developer settings > OAuth Apps
  - Callback URL: `http://localhost:3000/api/auth/callback/github` (or production URL)
  - User must: [ ] Create OAuth app, [ ] Add `GITHUB_ID` and `GITHUB_SECRET` to `.env.local`

#### GitHub Personal Access Token
- **Required**: For API calls (repo detection, webhook setup)
  - Location: GitHub Settings > Developer settings > Personal access tokens
  - Scopes: repo, workflow
  - User must: [ ] Create token, [ ] Add to `.env.local` as `GITHUB_TOKEN`

---

## Sprint 2 Incomplete Items (Ready to Add Once Blocked Items Are Resolved)

### Database-Dependent Items

#### 1. Provider Credentials Persistence
- **Status**: 🟡 Code ready, blocked by DATABASE_URL setup
- **File**: `/backend/src/api/routers/providers.ts`
- **What's needed**: 
  - User sets DATABASE_URL
  - Migration runs successfully
  - Then: Update `toggle()` to store credentials in DB instead of in-memory

#### 2. OAuth Callback Handlers
- **Status**: 🟡 Framework ready, blocked by OAuth app setup
- **Files to create**: 
  - `/backend/src/api/lib/oauth/vercel-oauth.ts`
  - `/backend/src/api/lib/oauth/railway-oauth.ts`
  - `/backend/src/api/lib/oauth/render-oauth.ts`
  - Similar for other providers
- **What's needed**: 
  - User creates OAuth apps
  - Provides CLIENT_ID + CLIENT_SECRET
  - Then: Add callback handlers that exchange code for token

#### 3. Retrieve Credentials from Database
- **Status**: 🟡 Query ready, blocked by credentials being stored
- **File**: `/backend/src/api/routers/deploy.ts`
- **What's needed**: 
  - Replace `(ctx as any).providerCredentials?.[providerId]` 
  - With: `await ctx.db.query("SELECT credentials FROM provider_connections WHERE provider_id = $1")`
  - Then: Decrypt credentials before use

---

## Sprint 3 Incomplete Items (Ready to Add Once Blocked Items Are Resolved)

### Real Provider API Integration

#### 1. Vercel SDK Integration
- **Status**: 🔴 Not started, blocked by VERCEL_TOKEN
- **File**: `/backend/src/api/lib/providers/index.ts` - VercelProvider class
- **Replace**: Mock implementation with real `@vercel/sdk` calls
- **What's needed**:
  - `npm install @vercel/sdk`
  - User provides VERCEL_TOKEN
  - Implement: `deploy()`, `getStatus()` using real API

#### 2. Railway GraphQL Integration
- **Status**: 🔴 Not started, blocked by RAILWAY_TOKEN
- **File**: `/backend/src/api/lib/providers/index.ts` - RailwayProvider class
- **Replace**: GraphQL query stubs with real mutations
- **What's needed**:
  - User provides RAILWAY_TOKEN
  - Implement mutation queries for create/read/delete deployments

#### 3. AWS CloudFormation Integration
- **Status**: 🔴 Not started, blocked by AWS credentials
- **File**: `/backend/src/api/lib/providers/index.ts` - AWSProvider class
- **Replace**: Mock ECS deployment with real CloudFormation stack creation
- **What's needed**:
  - `npm install @aws-sdk/client-cloudformation`
  - User provides AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY
  - Implement: Stack creation, parameter passing, status polling

#### 4. Preview Environment Auto-Generation
- **Status**: 🟡 Framework ready, blocked by real provider APIs
- **File**: `/backend/src/api/routers/oneclick.ts`
- **What's needed**:
  - Real provider deploy() returning actual preview URLs
  - Webhook listener for GitHub PR events
  - Auto-trigger deploy on PR creation

#### 5. Real-Time Cost Calculation
- **Status**: 🟡 Endpoints ready, blocked by provider pricing APIs
- **File**: `/backend/src/api/lib/providers/index.ts` - All estimateCost() methods
- **What's needed**:
  - Fetch real pricing data from each provider API
  - Replace hardcoded estimates with actual calculations
  - User provides provider API access

#### 6. Cost Tracking & Storage
- **Status**: 🟡 Database schema ready, blocked by real deployments
- **Files**: `/backend/src/api/routers/deploy.ts`
- **What's needed**:
  - After real deployments, calculate actual costs
  - Store in `cost_estimates` table
  - Aggregate monthly costs per project

#### 7. Observability Hub Integration
- **Status**: 🟡 Links ready, blocked by real provider dashboards
- **File**: `/app/observability/page.tsx`
- **What's needed**:
  - Provider dashboard URLs from stored provider_connections
  - User OAuth token retrieval
  - Deep links to provider-specific resources

---

## Recommended Execution Order

### Phase 1: Setup (User Action)
1. [ ] Create `.env.local` file
2. [ ] Set DATABASE_URL to Neon PostgreSQL (sign up at neon.tech)
3. [ ] Create Vercel, Railway, Render OAuth apps
4. [ ] Generate API tokens for each provider
5. [ ] Add all tokens to `.env.local`

### Phase 2: Database (AI + User)
1. [ ] Run SQL migration: `psql $DATABASE_URL < scripts/migrations/002_add_provider_tables.sql`
2. [ ] Update `providers.ts` toggle() to use DB instead of in-memory
3. [ ] Test: Connect provider in /targets, check database

### Phase 3: OAuth (AI + User)
1. [ ] Create OAuth callback handlers for each provider
2. [ ] Update /targets UI with OAuth buttons
3. [ ] Test: Click OAuth button, redirects to provider, stores token

### Phase 4: Real APIs (AI + User)
1. [ ] Install provider SDKs: `npm install @vercel/sdk @aws-sdk/client-cloudformation`
2. [ ] Replace mock implementations with real API calls
3. [ ] Test: Deploy via each provider, verify deployment

### Phase 5: Advanced (AI + User)
1. [ ] Add GitHub webhook listener for PR events
2. [ ] Implement preview environment auto-generation
3. [ ] Add cost tracking
4. [ ] Link observability dashboards

---

## Environment File Template

Create `.env.local` with these variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/sarge

# Provider Tokens (add as created)
VERCEL_TOKEN=
RAILWAY_TOKEN=
RENDER_TOKEN=
CLOUDFLARE_TOKEN=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
FLY_API_TOKEN=

# GitHub
GITHUB_TOKEN=
GITHUB_ID=
GITHUB_SECRET=

# Optional: Encryption key for credentials
CREDENTIAL_ENCRYPTION_KEY=your-32-char-random-string
```

---

## Files Ready for User to Fill In

These files have TODOs and placeholders waiting for user credentials:

1. `/backend/src/api/lib/providers/index.ts` - Lines with "TODO: Use real API"
2. `/backend/src/api/routers/providers.ts` - Credential storage logic
3. `/backend/src/api/lib/oauth/` - OAuth callback handlers (need to be created)
4. `/app/targets/page.tsx` - OAuth button event handlers

---

## Quick Checklist for User

Before Sprint 3 can proceed fully:

- [ ] **Database**: Create PostgreSQL database, get connection string
- [ ] **Vercel**: Create personal access token at vercel.com
- [ ] **Railway**: Create API token at railway.app
- [ ] **Render**: Create API key at render.com
- [ ] **Cloudflare**: Create API token at cloudflare.com
- [ ] **AWS**: Create access keys in IAM
- [ ] **Fly.io**: Create API token at fly.io
- [ ] **GitHub** (optional): Create OAuth app and personal token

Once these are completed, AI can fill in all the remaining code automatically.

---

**Status**: Sprint 3 code structure is ready. 95% blocked by user setup requiring external service credentials.
