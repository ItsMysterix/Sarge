# Production Readiness Audit: Sarge vs Qovery

**Analysis Date:** January 26, 2026  
**Status:** Partially Ready for Production  
**Critical Issues:** 15+ routers returning empty arrays, mock data patterns throughout

---

## Current State Summary

### ✅ What's Actually Implemented

**Database Schema (exists):**
- `deployments` — Full deployment lifecycle
- `metrics` — CPU, memory, latency, cost tracking
- `logs` — Service logs with severity
- `services` — Service definitions & status
- `users`, `accounts`, `sessions` — Auth infrastructure
- `projects` — Project/workspace management
- `repositories` — GitHub integration
- `settings` — User preferences
- `secrets` — Environment secrets (encrypted)
- `audit_logs` — Action tracking
- `alert_rules` — Alert definitions
- `health_checks` — Health probe configs
- `traffic_configs` — Blue/green, canary deployments
- `database_instances` — Managed database support
- `database_backups` — Backup tracking
- `provider_credentials` — Multi-cloud credentials
- Plus 15+ more tables created in migrations

**Routers (partially functional):**
- `deploy.create()` — Inserts to DB ✅
- `deploy.list()` — Queries DB ✅
- `metrics.latest` — Queries DB ✅
- `projects.*` — DB backed ✅
- `auth.*` — Session management ✅

---

### ❌ What's Still Mocked (CRITICAL)

**Returning `[]` instead of real data:**

1. **logs.ts** (2 endpoints)
   ```typescript
   tail() → returns []
   search() → returns []
   ```

2. **metrics.ts** (2 endpoints)
   ```typescript
   live() → returns []
   history() → returns []
   ```

3. **alerts.ts** (3 endpoints)
   ```typescript
   listRules() → returns []
   getActive() → returns []
   getHistory() → returns []
   ```

4. **databases.ts** (2 endpoints)
   ```typescript
   list() → returns []
   getBackups() → returns []
   ```

5. **health-checks.ts** (2 endpoints)
   ```typescript
   list() → returns []
   getResults() → returns []
   ```

6. **kubernetes.ts** (2 endpoints)
   ```typescript
   listClusters() → returns []
   getDeployments() → returns []
   ```

7. **traffic.ts** (1 endpoint)
   ```typescript
   list() → returns []
   ```

8. **stacks.ts** (2 endpoints)
   ```typescript
   list() → returns []
   getStatus() → returns []
   ```

9. **oneclick.ts** (1 endpoint)
   ```typescript
   detectRepo() → uses sarge-core mock
   ```

10. **deploy.ts** (4 endpoints)
    ```typescript
    status() → returns []
    getLogs() → returns []
    rollback() → returns []
    listServices() → returns []
    ```

**Total: 22+ endpoints returning empty arrays instead of querying DB**

---

## Database Status

### Tables Created (Via Migrations)
✅ 40+ tables exist in migrations/  
✅ Schemas are well-designed (Qovery-like)  
✅ Proper indexes for performance  
✅ JSONB fields for flexible data  

### Issue: Tables Not Queried
❌ Tables created but many routers don't use them  
❌ `return []` patterns instead of SQL queries  
❌ Mock data fallbacks in production code  

**Example Problem:**
```typescript
// health-checks.ts - Table EXISTS but not queried
export const healthChecksRouter = router({
  list: secureProcedure('health-checks.list')
    .query(async ({ ctx }) => {
      try {
        const result = await ctx.db.query(
          `SELECT * FROM health_checks WHERE project_id = $1`,
          [projectId]
        ).catch(/* ... */)
        
        // If DB query fails, falls back to:
        return []  // ❌ Should not happen in prod
      }
    })
})
```

---

## What Needs to Be Done

### Phase 1: Connect Mocked Routers to Database (CRITICAL)

For each router returning `[]`, replace with actual SQL:

| Router | Endpoint | Current | Needed |
|--------|----------|---------|--------|
| logs | tail() | [] | `SELECT * FROM logs WHERE service_id = $1 ORDER BY timestamp DESC LIMIT 100` |
| logs | search() | [] | `SELECT * FROM logs WHERE message ILIKE $1 AND created_at > NOW() - INTERVAL '7 days'` |
| metrics | live() | [] | `SELECT * FROM metrics WHERE service_id = $1 ORDER BY timestamp DESC LIMIT 1` |
| metrics | history() | [] | `SELECT * FROM metrics WHERE service_id = $1 AND timestamp > NOW() - INTERVAL $2 ORDER BY timestamp ASC` |
| alerts | listRules() | [] | `SELECT * FROM alert_rules WHERE project_id = $1` |
| alerts | getActive() | [] | `SELECT * FROM alert_instances WHERE status = 'firing'` |
| alerts | getHistory() | [] | `SELECT * FROM alert_instances WHERE project_id = $1 ORDER BY created_at DESC LIMIT 100` |
| databases | list() | [] | `SELECT * FROM database_instances WHERE project_id = $1` |
| databases | getBackups() | [] | `SELECT * FROM database_backups WHERE instance_id = $1` |
| health-checks | list() | [] | `SELECT * FROM health_checks WHERE project_id = $1` |
| health-checks | getResults() | [] | `SELECT * FROM health_check_results WHERE check_id = $1 ORDER BY timestamp DESC LIMIT 100` |
| kubernetes | listClusters() | [] | `SELECT * FROM k8s_clusters WHERE project_id = $1` |
| kubernetes | getDeployments() | [] | `SELECT * FROM k8s_deployments WHERE cluster_id = $1` |
| traffic | list() | [] | `SELECT * FROM traffic_configs WHERE project_id = $1` |
| stacks | list() | [] | `SELECT * FROM stacks WHERE project_id = $1` |
| deploy | status() | [] | `SELECT * FROM deployments WHERE id = $1` |
| deploy | getLogs() | [] | `SELECT * FROM deployment_logs WHERE deployment_id = $1 ORDER BY timestamp ASC` |
| deploy | listServices() | [] | `SELECT * FROM services WHERE project_id = $1` |

**Effort:** 18 SQL queries to write & test

### Phase 2: Ensure Subscription Updates Work

These routers have subscriptions that should emit real data:

```typescript
// ❌ Currently returns [] from mock
metrics.live() -> subscription
logs.tail() -> subscription  
deploy.subscribe() -> subscription
alerts.subscribe() -> subscription

// ✅ Should emit real data from DB via ctx.ee
ctx.ee.emit('metrics:new', realMetricData)
ctx.ee.emit('logs:new', realLogData)
ctx.ee.emit('deploys:update', realDeployData)
```

**Need:** Wire subscriptions to actual metrics/logs/alerts from database

### Phase 3: Remove All Mock Data Patterns

Search & remove:
```typescript
// ❌ Mock fallbacks
if (err?.message?.includes('table')) return { rows: [] }
if (!fs.existsSync(mockFile)) return mockData
if (DATABASE_URL) { /* real */ } else { /* mock */ }

// ✅ Should be
if (err) throw err  // Let error bubble up, don't hide
```

---

## Migration Strategy

### Step 1: Run All Migrations (One-time)
```bash
# Load all 15 migration files into Neon Postgres
psql "$DATABASE_URL" < scripts/migrations/0001_init.sql
psql "$DATABASE_URL" < scripts/migrations/0002_add_provider_tables.sql
# ... all 15 files

# Verify tables created
psql "$DATABASE_URL" -c "\dt"  # Lists all tables
```

### Step 2: Update Each Router

For each mocked endpoint:
1. Write SQL query (using table from migration)
2. Replace `return []` with actual query
3. Test with `npm test`
4. Commit

**Example Fix:**
```typescript
// BEFORE (mocked)
list: secureProcedure('health-checks.list')
  .query(async ({ ctx, input }) => {
    return []  // ❌ Mocked
  })

// AFTER (real)
list: secureProcedure('health-checks.list')
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const result = await ctx.db.query(
      `SELECT id, name, type, url, status, frequency_seconds, 
              timeout_seconds, last_run_at, last_success_at, created_at
       FROM health_checks 
       WHERE project_id = $1 
       ORDER BY created_at DESC`,
      [input.projectId]
    )
    return result?.rows || []
  })
```

### Step 3: Error Handling

Instead of graceful degradation:
```typescript
// ❌ OLD (hides errors)
try {
  const result = await query(sql)
  return result?.rows || []
} catch (e) {
  console.warn('Ignored error:', e)
  return []
}

// ✅ NEW (proper error handling)
try {
  const result = await query(sql)
  if (!result?.rows) {
    throw new Error('No rows returned')
  }
  return result.rows
} catch (error) {
  // Log for debugging
  console.error('[health-checks.list]', error)
  
  // Return 500 error to client (tRPC handles it)
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to fetch health checks',
    cause: error,
  })
}
```

---

## Tables That Already Exist (Ready to Query)

These have migrations and are ready to use:

```
✅ deployments          — INSERT/UPDATE/SELECT already working
✅ metrics              — INSERT/UPDATE/SELECT already working
✅ logs                 — Table exists, needs SELECT queries
✅ services             — Table exists, needs queries
✅ projects             — INSERT/SELECT already working
✅ users                — Table exists, needs queries
✅ alert_rules          — Table exists, needs SELECT
✅ alert_instances      — Table exists (in migration 0015)
✅ health_checks        — Table exists, needs SELECT
✅ health_check_results — Table exists, needs SELECT
✅ traffic_configs      — Table exists, needs SELECT
✅ database_instances   — Table exists, needs SELECT
✅ database_backups     — Table exists, needs SELECT
✅ k8s_clusters         — Table exists, needs SELECT
✅ k8s_deployments      — Table exists, needs SELECT
✅ secrets              — Table exists (encrypted), needs SELECT
✅ audit_logs           — Table exists, needs SELECT
✅ provider_credentials — Table exists, needs SELECT
```

**No new schema needed. Just connect the queries.**

---

## Production Checklist

### Database (Week 1)
- [ ] Verify all migrations run on Neon
- [ ] Check table structure: `\d table_name`
- [ ] Ensure indexes created for performance
- [ ] Test connection pooling

### Routers (Week 2)
- [ ] Replace `return []` with real SQL (18 queries)
- [ ] Add proper error handling
- [ ] Test each endpoint with data
- [ ] Verify subscriptions emit real data

### Quality (Week 3)
- [ ] Write integration tests
- [ ] Load test with Prometheus
- [ ] Check error logging
- [ ] Verify no more mock data fallbacks

### Security (Week 4)
- [ ] Encrypt sensitive data (secrets, credentials)
- [ ] Add RBAC checks
- [ ] Audit logging working
- [ ] Rate limiting in place

---

## Effort Estimate

| Task | Effort | Notes |
|------|--------|-------|
| Connect 18 mocked endpoints | 6-8 hours | SQL queries + testing |
| Fix error handling | 2-3 hours | Remove mock fallbacks |
| Write tests | 4-5 hours | Integration tests per router |
| Load test & optimize | 3-4 hours | Prometheus metrics |
| Security audit | 2-3 hours | Encryption, RBAC, audit logs |
| **Total** | **17-23 hours** | **~2-3 days full-time** |

---

## Summary

✅ **Schema:** 40+ tables created, well-designed, Qovery-like  
✅ **Some Routers:** 8 routers fully functional with real DB queries  
❌ **Mocked Endpoints:** 22+ endpoints returning empty arrays  
❌ **Missing Connections:** Tables exist but queries don't use them  

**Next Step:** Go through each mocked router and replace `return []` with actual SQL queries from the existing table schema.

**Result:** Production-ready Sarge with zero mock data, full Qovery feature parity.

---

## Files to Update

Priority order:
1. `backend/src/api/routers/logs.ts` — 2 mocked endpoints
2. `backend/src/api/routers/metrics.ts` — 2 mocked endpoints
3. `backend/src/api/routers/alerts.ts` — 3 mocked endpoints
4. `backend/src/api/routers/health-checks.ts` — 2 mocked endpoints
5. `backend/src/api/routers/databases.ts` — 2 mocked endpoints
6. `backend/src/api/routers/kubernetes.ts` — 2 mocked endpoints
7. `backend/src/api/routers/traffic.ts` — 1 mocked endpoint
8. `backend/src/api/routers/stacks.ts` — 2 mocked endpoints
9. `backend/src/api/routers/deploy.ts` — 4 mocked endpoints
