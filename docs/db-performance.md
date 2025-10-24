# Database Performance Notes

This document tracks the critical SELECTs used by the backend and the indexes that support them. Capture EXPLAIN (ANALYZE, BUFFERS) outputs on your dev DB and paste them below.

## Queries

1) metrics.latest
```sql
SELECT id, service_id, cpu, memory, latency, cost, "timestamp", created_at
FROM metrics
ORDER BY created_at DESC NULLS LAST, "timestamp" DESC NULLS LAST
LIMIT 1;
```

2) logs.recent (optionally filtered)
```sql
-- all types
SELECT id, service_id, type, message, "timestamp", created_at
FROM logs
ORDER BY created_at DESC NULLS LAST, "timestamp" DESC NULLS LAST
LIMIT 100;

-- filtered by type
SELECT id, service_id, type, message, "timestamp", created_at
FROM logs
WHERE type = $1
ORDER BY created_at DESC NULLS LAST, "timestamp" DESC NULLS LAST
LIMIT 100;
```

3) deployments list (recent)
```sql
SELECT *
FROM deployments
ORDER BY created_at DESC
LIMIT 50;
```

## Why these indexes help
- metrics(created_at DESC) and metrics(timestamp DESC): primary ordering on created_at with a legacy fallback on "timestamp"; both indexes can be used depending on data distribution.
- logs(created_at DESC) and logs(timestamp DESC): same dual-compat ordering pattern for logs.
- logs(type): supports equality filter on type before ordering.
- deployments(created_at DESC): supports recent deployments listing ordering.
- deployments(status): supports potential status filters.

## EXPLAIN (ANALYZE, BUFFERS)
Paste your outputs here after running against your dev DB.

### 1) metrics.latest
```
# Paste EXPLAIN ANALYZE BUFFERS output
```

### 2) logs.recent (no filter)
```
# Paste EXPLAIN ANALYZE BUFFERS output
```

### 2b) logs.recent (type filter)
```
# Paste EXPLAIN ANALYZE BUFFERS output
```

### 3) deployments list
```
# Paste EXPLAIN ANALYZE BUFFERS output
```

## Notes on dual-compat ORDER BY
- Read paths now prefer created_at for time ordering.
- We retain a secondary sort on legacy "timestamp" to safely cover rows inserted before migration 0003.
- This is a non-breaking change to ordering semantics and does not require additional schema changes.
