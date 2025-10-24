# Logs API: pagination, stream, retention

## recent: cursor pagination
- Input: `{ type?: string, cursor?: string, limit?: number = 100 }`
- Ordering: `ORDER BY created_at DESC NULLS LAST, "timestamp" DESC NULLS LAST, id DESC`
- Cursor shape: base64(JSON.stringify({ created_at, id }))
- SQL (conceptual):
  - `WHERE (created_at, id) < ($created_at, $id)` when cursor provided
  - `LIMIT $limit`
- Response: `{ items: LogRow[], nextCursor: string | null }`

Example request/response:
```
// request
{ "type": "error", "limit": 50, "cursor": "eyBjcmVhdGVkX2F0OiAiMjAyNS0xMC0yMlQxMDozMDozMFoiLCAiaWQiOiAxMjM0IH0=" }

// response
{
  "items": [ /* 50 rows */ ],
  "nextCursor": "eyJjcmVhdGVkX2F0IjoiMjAyNS0xMC0yMlQwOTowMDowMFoiLCJpZCI6MTAwfQ=="
}
```

Indexes and EXPLAIN:
- Primary index used: `idx_logs_created_at_desc` with a stable `id` tie-breaker.
- For optimal pagination, consider a composite index `(created_at DESC, id DESC)`.
- Save an `EXPLAIN (ANALYZE, BUFFERS)` sample here after running against your dataset.

## stream: burst-guarded buffered subscription
- Transport: tRPC subscription backed by an EventEmitter
- Buffering: `createBufferedSubscription("logs:new", { bufferSize: 500 })`
- Burst guard: at most 100 items are emitted per event loop tick; remainder is scheduled via `setImmediate`.
- Policy: drop-oldest when buffer is full (keeps memory bounded).

## retention
- SQL: `scripts/retention.sql`
- Runner: `scripts/run-retention.ts`
- Env: `LOG_RETENTION_DAYS` (default `7`)
- Behavior: `DELETE FROM logs WHERE created_at < NOW() - (INTERVAL '1 day' * $1)` (parameterized)
- Script:
  - Add npm script in `backend/package.json`: `logs:retention`
  - Run periodically via cron or your scheduler of choice.
