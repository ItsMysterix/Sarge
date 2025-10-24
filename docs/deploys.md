# Deploys: state machine and live updates

This document describes the deploy state machine, how updates are emitted to subscribers, and the retention/retry story.

## State machine

pending -> running -> success | failed

- pending: created by deployRouter.create
- running: set by the in-process executor after atomically claiming the pending row
- success: final state after all steps complete
- failed: final state if any step throws; error is recorded

## Emissions

- On running: `ee.emit('deploys:update', { id, status: 'running', started_at })`
- On success: `ee.emit('deploys:update', { id, status: 'success', finished_at })`
- On failed: `ee.emit('deploys:update', { id, status: 'failed', error, finished_at })`

Subscribe via tRPC using the router's `subscribe` procedure, which is backed by a bounded buffer. The UI receives each transition in real time.

Per-deployment logs:

Schema (table `deployment_logs`):
- id BIGSERIAL PRIMARY KEY
- deployment_id BIGINT NOT NULL REFERENCES deployments(id) ON DELETE CASCADE
- ts TIMESTAMPTZ NOT NULL DEFAULT now()
- step TEXT
- line TEXT NOT NULL
- Index: (deployment_id, id)

Realtime event topics:
- Global: `deploys:*`
- Per-id: `deploys:{id}`
- Frames: typed union `{ type:'deploys:update'| 'deploys:log' | 'deploys:enqueue', ... }`

Subscribe example (frontend):
```
// subscribe to one id
trpc.deploy.subscribe.useSubscription({ deploymentId }, {
	onData: (ev) => {
		if (ev.type === 'ready') return;
		if (ev.type === 'deploys:update') { /* update UI */ }
		if (ev.type === 'deploys:log') { /* append to log view */ }
	},
});
```

## Metrics

- Counter: `sarge_deploys_total{status}` is incremented only on the final transition (success/failed).

## Executor

- In-process job runner (`backend/src/jobs/deploy-executor.ts`).
- Starts automatically with the WS server and listens for `deploys:enqueue` events.
- Claims a row using a parameterized update (`... WHERE id=$1 AND status='pending' RETURNING *`).
- Performs small transactional steps (real DB updates; no mocked payloads) with short delays to simulate work.
- Emits `deploys:update` on each transition and records error on failure.
- Bounded in-memory queue (drops oldest if overloaded) to protect memory.

## Retry strategy

- No automatic retries for now. To re-run a failed deploy, create a new one (new row). Future work could introduce a retry column and exponential backoff policy.

## Observing
## Idempotency and replay

- A per-deployment advisory lock prevents double-processing the same id across restarts or duplicate enqueues.
- On boot, the server replays stale `pending` deployments (>60s old, up to 100) by emitting `deploys:enqueue` so they’re picked up after a crash.

- UI: subscribe to `deploys:update`.
- Prometheus/Grafana: query `sum(rate(sarge_deploys_total[5m])) by (status)` for deploy outcomes by status.
