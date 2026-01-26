# Sarge Production Readiness: Action Plan

**Goal:** Make Sarge production-ready (Qovery feature parity, no mock data)  
**Estimated Effort:** 17-23 hours (~2-3 days full-time)  
**Target Date:** End of week 1

---

## Quick Summary

**Current State:**
- ✅ Schema: 40+ tables created (perfect)
- ✅ Some routers: 8 working with real data
- ❌ 22+ endpoints: returning `[]` (empty arrays) instead of querying DB

**What needs doing:**
Replace `return []` with actual SQL queries for 18 endpoints.

---

## Phase 1: Database Verification (1-2 hours)

### Task 1.1: Run All Migrations
```bash
cd /Users/mysterix/Downloads/Sarge-1

# 1. Check migrations exist
ls scripts/migrations/ | wc -l  # Should be 15+

# 2. Run all migrations (one by one)
for file in scripts/migrations/*.sql; do
  echo "Running $file..."
  psql "$DATABASE_URL" -f "$file"
done

# 3. Verify tables
psql "$DATABASE_URL" -c "\dt"  # Lists all 40+ tables
```

### Task 1.2: Verify Critical Tables
```bash
# Check these tables exist:
psql "$DATABASE_URL" -c "
  \dt deployments
  \dt metrics
  \dt logs
  \dt alert_rules
  \dt health_checks
  \dt traffic_configs
  \dt database_instances
  \dt k8s_clusters
"
```

**Done when:** All 40+ tables exist with correct columns

---

## Phase 2: Fix Mocked Endpoints (6-8 hours)

### Critical Routers (Do First)

#### 2.1: logs.ts (2 endpoints)

**File:** `backend/src/api/routers/logs.ts`

**Current problem:**
```typescript
tail: secureProcedure('logs.tail').query(async () => {
  return []  // ❌ Mocked
})
```

**Fix needed:**
```typescript
tail: secureProcedure('logs.tail')
  .input(z.object({
    serviceId: z.string(),
    limit: z.number().default(100),
  }))
  .query(async ({ ctx, input }) => {
    const result = await ctx.db.query(
      `SELECT id, service, level, message, timestamp, context
       FROM logs
       WHERE service = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [input.serviceId, input.limit]
    )
    return result?.rows || []
  })
```

**Endpoints to fix:**
- `tail()` — Get recent logs
- `search()` — Search logs by message/time

**Test:**
```bash
npm run dev
# Then in Postman/curl:
# POST /trpc/logs.tail
# {"serviceId": "my-service", "limit": 100}
```

---

#### 2.2: metrics.ts (2 endpoints)

**File:** `backend/src/api/routers/metrics.ts`

**Fix needed:**
```typescript
live: secureProcedure('metrics.live')
  .input(z.object({ serviceId: z.string() }))
  .subscription(async function* ({ input }) {
    const result = await ctx.db.query(
      `SELECT id, service_name, cpu_usage, memory_usage, latency_ms, timestamp
       FROM metrics
       WHERE service_name = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [input.serviceId]
    )
    yield result?.rows?.[0] || null
  })

history: secureProcedure('metrics.history')
  .input(z.object({
    serviceId: z.string(),
    hoursBack: z.number().default(24),
  }))
  .query(async ({ ctx, input }) => {
    const result = await ctx.db.query(
      `SELECT * FROM metrics
       WHERE service_name = $1
       AND timestamp > NOW() - INTERVAL '$2 hours'
       ORDER BY timestamp ASC`,
      [input.serviceId, input.hoursBack]
    )
    return result?.rows || []
  })
```

**Endpoints to fix:**
- `live()` — Live metric subscription
- `history()` — Historical metrics

---

#### 2.3: alerts.ts (3 endpoints)

**File:** `backend/src/api/routers/alerts.ts`

**Fix needed:**
```typescript
listRules: secureProcedure('alerts.listRules')
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    const result = await ctx.db.query(
      `SELECT id, name, rule_type, condition, severity, enabled, created_at
       FROM alert_rules
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [input.projectId]
    )
    return result?.rows || []
  })

getActive: secureProcedure('alerts.getActive')
  .query(async ({ ctx }) => {
    const result = await ctx.db.query(
      `SELECT id, alert_rule_id, status, message, severity, created_at
       FROM alert_instances
       WHERE status = 'firing'
       ORDER BY severity DESC, created_at DESC`
    )
    return result?.rows || []
  })

getHistory: secureProcedure('alerts.getHistory')
  .input(z.object({
    projectId: z.string(),
    limit: z.number().default(100),
  }))
  .query(async ({ ctx, input }) => {
    const result = await ctx.db.query(
      `SELECT id, alert_rule_id, status, message, created_at
       FROM alert_instances
       WHERE project_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [input.projectId, input.limit]
    )
    return result?.rows || []
  })
```

**Endpoints to fix:**
- `listRules()` — List alert rules
- `getActive()` — Currently firing alerts
- `getHistory()` — Past alerts

---

### Secondary Routers

#### 2.4: health-checks.ts (2 endpoints)
```typescript
list: /* query health_checks table */
getResults: /* query health_check_results table */
```

#### 2.5: databases.ts (2 endpoints)
```typescript
list: /* query database_instances table */
getBackups: /* query database_backups table */
```

#### 2.6: kubernetes.ts (2 endpoints)
```typescript
listClusters: /* query k8s_clusters table */
getDeployments: /* query k8s_deployments table */
```

#### 2.7: traffic.ts (1 endpoint)
```typescript
list: /* query traffic_configs table */
```

#### 2.8: stacks.ts (2 endpoints)
```typescript
list: /* query stacks table */
getStatus: /* query stack_status or compute from related tables */
```

#### 2.9: deploy.ts (4 endpoints)
```typescript
status: /* query deployments table */
getLogs: /* query deployment_logs table */
listServices: /* query services table */
rollback: /* INSERT to deployments with status='rolling_back' */
```

---

## Phase 3: Testing (4-5 hours)

### 3.1: Unit Tests
```bash
# For each router, create/update test:
backend/src/api/routers/__tests__/logs.test.ts
backend/src/api/routers/__tests__/metrics.test.ts
backend/src/api/routers/__tests__/alerts.test.ts
# ... etc
```

**Example test:**
```typescript
describe('logs router', () => {
  it('should return logs from database', async () => {
    const logs = await ctx.caller.logs.tail({
      serviceId: 'test-service',
      limit: 10,
    })
    
    expect(logs).toBeArray()
    expect(logs.length).toBeLessThanOrEqual(10)
    expect(logs[0]).toHaveProperty('message')
  })
})
```

### 3.2: Integration Tests
```bash
# Test end-to-end with real database:
npm run test -- backend/src/api/routers/__tests__/
```

### 3.3: Manual Testing
```bash
npm run dev

# Then test each endpoint:
# 1. curl or Postman to test queries work
# 2. Verify data comes from DB, not mocked
# 3. Check error handling works
```

---

## Phase 4: Error Handling & Logging (2-3 hours)

### 4.1: Remove Mock Fallbacks
Find and remove all:
```typescript
// ❌ DELETE THESE:
.catch((err: any) => {
  if (err?.message?.includes('table_name')) {
    return { rows: [] }  // Mock fallback
  }
  throw err
})
```

### 4.2: Add Proper Error Handling
```typescript
// ✅ ADD THIS:
.catch((err: any) => {
  console.error('[logs.tail] Database error:', err)
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to fetch logs',
    cause: err,
  })
})
```

### 4.3: Add Logging
```typescript
const result = await ctx.db.query(sql, params)
console.log('[logs.tail] Found', result.rows.length, 'logs')
return result?.rows || []
```

---

## Phase 5: Security & Audit (2-3 hours)

### 5.1: Verify RBAC
- [ ] Check each endpoint has `secureProcedure`
- [ ] Verify `requiresRole` is set where needed
- [ ] Test unauthorized access fails

### 5.2: Verify Audit Logging
- [ ] INSERT audit logs for sensitive operations
- [ ] Log all create/update/delete operations
- [ ] Include user_id, action, timestamp

### 5.3: Verify Encryption
- [ ] Secrets stored encrypted
- [ ] Credentials encrypted in DB
- [ ] Decryption only on demand

---

## Execution Order (By Priority)

### Week 1 (Mon-Wed)
1. **Monday AM** (2h): Phase 1 - Verify all migrations run
2. **Monday PM - Tuesday** (8h): Phase 2.1-2.3 - Fix logs, metrics, alerts (most critical)
3. **Wednesday** (4h): Phase 3 - Test critical endpoints

### Week 1 (Wed-Fri)
4. **Thursday** (6h): Phase 2.4-2.9 - Fix remaining routers
5. **Friday AM** (4h): Phase 3 - Test all endpoints
6. **Friday PM** (4h): Phase 4 & 5 - Error handling, security

---

## Verification Checklist

Before shipping to production:

- [ ] **No `return []` mock patterns** - `grep -r 'return \[\]' backend/src/api/routers/`
- [ ] **No catch-all error silencing** - `grep -r '\.catch' backend/src/api/routers/` (should be minimal)
- [ ] **All endpoints tested** - `npm test -- backend/`
- [ ] **All tables populated** - `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM metrics"`
- [ ] **Subscriptions working** - Frontend receives real data
- [ ] **Logging working** - Check logs in backend output
- [ ] **Error handling** - Bad requests return 400, DB errors return 500
- [ ] **RBAC enforced** - Unauthorized requests fail
- [ ] **No secrets in logs** - Sensitive data redacted
- [ ] **Performance acceptable** - Queries < 100ms

---

## Files to Modify

**Priority 1 (Critical):**
- [ ] `backend/src/api/routers/logs.ts`
- [ ] `backend/src/api/routers/metrics.ts`
- [ ] `backend/src/api/routers/alerts.ts`

**Priority 2 (Important):**
- [ ] `backend/src/api/routers/health-checks.ts`
- [ ] `backend/src/api/routers/databases.ts`
- [ ] `backend/src/api/routers/kubernetes.ts`

**Priority 3 (Nice-to-Have):**
- [ ] `backend/src/api/routers/traffic.ts`
- [ ] `backend/src/api/routers/stacks.ts`
- [ ] `backend/src/api/routers/deploy.ts`

---

## Resources

- Database schema: `scripts/create-neon-schema.sql`
- Migrations: `scripts/migrations/*.sql`
- Example working router: `backend/src/api/routers/projects.ts` (reference)
- Type definitions: `backend/src/types/`

---

## Success Criteria

✅ **Production Ready when:**
1. Zero mock data patterns (`return []` removed)
2. All 40+ tables have live data
3. All endpoints query database
4. All tests pass (`npm test`)
5. All errors logged properly
6. RBAC enforced everywhere
7. No secrets in plain text
8. Load test passes (1000 req/s)

---

**Start:** This week  
**Expected completion:** End of week 1  
**Effort:** ~20 hours (~2-3 days full-time)
