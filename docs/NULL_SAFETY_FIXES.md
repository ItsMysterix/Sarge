# Null Safety & Error Handling Fixes

**Date:** 2025-01-24  
**Commit:** 6f61799  
**Issue:** JSON.parse errors and HTTP 500s from tRPC endpoints when DB returns empty results

## Root Cause

When database queries returned empty results, routers tried to access result.rows[0] directly, causing crashes and returning empty/malformed responses.

## Changes Made

### 1. Added Null Safety to All DB Query Results

All routers now check: `if (!result || !result.rows || result.rows.length === 0)`

### 2. Routers Updated

- metrics.ts: Returns null instead of crashing
- logs.ts: Returns empty arrays instead of crashing  
- deploy.ts: Returns null/[] on query failures
- project.ts: Throws error if insert fails
- repository.ts: Throws error if upsert fails

### 3. Added Try/Catch with Logging

All queries wrapped with try/catch and console.warn fallbacks.

### 4. Added tRPC Error Handler in WS Server

Added onError handler in ws-server.ts logging to console + Prometheus.

### 5. Added Prometheus Error Tracking

New metric: trpc_errors_total tracking errors by path and code.

## Expected Behavior

**Before:** Backend crashes → Returns empty response → Frontend JSON.parse error
**After:** Backend returns null/[] (valid JSON) → Frontend handles gracefully

## Files Changed

- backend/src/api/routers/metrics.ts
- backend/src/api/routers/logs.ts
- backend/src/api/routers/deploy.ts
- backend/src/api/routers/project.ts
- backend/src/api/routers/repository.ts
- backend/src/ws-server.ts
- backend/src/metrics/exporter.ts

**Result:** No more JSON.parse errors or 500s from empty DB responses!
