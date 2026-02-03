import { db } from '../api/lib/db';
import { ee } from '../api/lib/events';
import { incDeploy, startQueryTimer, deploysRunning } from '../metrics/exporter';
import { emitDeploy } from '../api/lib/deployEmit';
import { uuidLockKey, withAdvisoryLock } from '../api/lib/pgLock';

export type DeployWork = { id: number };

export function startDeployExecutor() {
  const queue: DeployWork[] = [];
  const MAX_QUEUE = 1000;
  let running = false;
  let stopped = false;

  function enqueue(work: DeployWork) {
    if (queue.length >= MAX_QUEUE) {
      // drop oldest to protect memory
      queue.shift();
      console.warn('deploy-executor: queue full, dropped oldest');
    }
    queue.push(work);
    process.nextTick(processQueue);
  }

  async function processQueue() {
    if (running || stopped) return;
    const job = queue.shift();
    if (!job) return;
    running = true;
    try {
      await runOne(job);
    } catch (err) {
      console.error('deploy-executor error:', err);
    } finally {
      running = false;
      if (!stopped && queue.length > 0) process.nextTick(processQueue);
    }
  }

  async function runOne(work: DeployWork) {
    const { id } = work;
    const startTimer = startQueryTimer('deploy.executor.runOne');
    const key = uuidLockKey(String(id));
    await withAdvisoryLock(db as any, key, async () => {
      try {
        // Transition to running if currently pending
        const res = await db.query(
          `UPDATE deployments SET status='running', started_at=NOW() WHERE id=$1 AND status='pending' RETURNING *`,
          [id]
        );
        if (res.rowCount === 0) {
          // Already claimed or not pending, skip
          return;
        }
        const runningRow = res.rows[0];
        (deploysRunning as any).inc();
        emitDeploy(ee, { type: 'deploys:update', id: String(runningRow.id), status: 'running', started_at: runningRow.started_at?.toString?.() ?? null });

        // Structured logs helper
        const log = async (step: string | null, line: string) => {
          const ins = await db.query(`INSERT INTO deployment_logs (deployment_id, step, line) VALUES ($1, $2, $3) RETURNING ts`, [id, step, line]);
          const ts = ins.rows?.[0]?.ts ?? new Date().toISOString();
          emitDeploy(ee, { type: 'deploys:log', id: String(id), step, line, ts: String(ts) });
        };

        // build step
        await log('build', 'Starting build…');
        // Forced failure sentinel for tests
        if (runningRow.version === '__FAIL__') {
          throw new Error('forced failure for test');
        }
        await db.query(`UPDATE deployments SET summary = COALESCE(summary,'') || ' | build' WHERE id=$1`, [id]);
        await log('build', 'Build complete.');

        // push step
        await log('push', 'Pushing image…');
        await db.query(`UPDATE deployments SET summary = COALESCE(summary,'') || ' | push' WHERE id=$1`, [id]);
        await log('push', 'Image pushed.');

        // release step
        await log('release', 'Releasing to environment…');
        await db.query(`UPDATE deployments SET summary = COALESCE(summary,'') || ' | release' WHERE id=$1`, [id]);
        await log('release', 'Release finalized.');

        // Finalize success
        const ok = await db.query(
          `UPDATE deployments SET status='success', finished_at=NOW() WHERE id=$1 RETURNING *`,
          [id]
        );
        const row = ok.rows[0];
        emitDeploy(ee, { type: 'deploys:update', id: String(row.id), status: 'success', finished_at: row.finished_at?.toString?.() ?? null });
        incDeploy('success');
      } catch (err: any) {
        // Mark failed
        const fail = await db.query(
          `UPDATE deployments SET status='failed', error=$2, finished_at=NOW() WHERE id=$1 RETURNING *`,
          [id, String(err?.message ?? err)]
        );
        const row = fail.rows[0];
        emitDeploy(ee, { type: 'deploys:update', id: String(row.id), status: 'failed', error: row.error ?? null, finished_at: row.finished_at?.toString?.() ?? null });
        incDeploy('failed');
      } finally {
        (deploysRunning as any).dec();
        startTimer();
      }
    });
  }

  function onEnqueue(payload: any) {
    const id = payload?.id;
    if (typeof id === 'number') enqueue({ id });
  }

  ee.on('deploys:enqueue', onEnqueue);

  async function stop() {
    stopped = true;
    ee.off('deploys:enqueue', onEnqueue);
  }

  return { enqueue, stop };
}
