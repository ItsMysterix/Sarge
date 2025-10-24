import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { startDeployExecutor } from '../src/jobs/deploy-executor';

vi.useFakeTimers();

// Mock db to track parameterized updates
vi.mock('../src/api/lib/db', () => {
  return {
    db: {
      query: vi.fn(),
    },
  } as any;
});

// Spy on ee emissions
vi.mock('../src/api/lib/events', async () => {
  const actual = await vi.importActual<any>('../src/api/lib/events');
  return { ...actual };
});

describe('deploy executor', () => {
  let db: any;
  let ee: any;

  beforeEach(async () => {
    db = (await import('../src/api/lib/db')).db;
    ee = (await import('../src/api/lib/events')) as any;
    (db.query as any).mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test('transitions pending -> running -> success and emits updates', async () => {
    const exec = startDeployExecutor();

    // Arrange DB responses with a generic handler
    (db.query as any).mockImplementation(async (sql: string, params: any[]) => {
      if (/SET status='running'/.test(sql)) {
        return { rowCount: 1, rows: [{ id: 42, started_at: 't0', version: null }] };
      }
      if (/INSERT INTO deployment_logs/i.test(sql)) {
        return { rowCount: 1, rows: [{ ts: 't-log' }] };
      }
      if (/SET status='success'/.test(sql)) {
        return { rowCount: 1, rows: [{ id: 42, finished_at: 't1' }] };
      }
      return { rowCount: 1 };
    });

    const emitSpy = vi.spyOn((ee as any).ee, 'emit');

    // Enqueue
    (ee as any).ee.emit('deploys:enqueue', { id: 42 });

  // Allow microtasks
  await vi.runOnlyPendingTimersAsync();

  // Expect emissions (allow string id)
  expect(emitSpy).toHaveBeenCalledWith('deploys:update', expect.objectContaining({ id: expect.any(String), status: 'running' }));
  expect(emitSpy).toHaveBeenCalledWith('deploys:update', expect.objectContaining({ id: expect.any(String), status: 'success' }));

  // Ensure parameterized queries executed in order (allowing advisory lock calls first)
  const calls = (db.query.mock.calls as any[]).map((c) => ({ sql: c[0] as string, params: c[1] as any[] }));
  const idxRunning = calls.findIndex((c) => /UPDATE deployments SET status='running'/.test(c.sql));
  expect(idxRunning).toBeGreaterThanOrEqual(0);
  expect(calls[idxRunning].params).toEqual([42]);

  const idxSuccess = calls.findIndex((c) => /status='success'/.test(c.sql));
  expect(idxSuccess).toBeGreaterThan(idxRunning);
  expect(calls[idxSuccess].params).toEqual([42]);

    await exec.stop();
  });

  test('skips if not pending', async () => {
    const exec = startDeployExecutor();
    (db.query as any)
      .mockResolvedValueOnce({ rowCount: 0 }); // claim attempt returns 0 rows

    const emitSpy = vi.spyOn((ee as any).ee, 'emit');
    const baseline = emitSpy.mock.calls.length;

    (ee as any).ee.emit('deploys:enqueue', { id: 41 });
    await vi.runOnlyPendingTimersAsync();

    // No running or success/failed events
    const newCalls = emitSpy.mock.calls.slice(baseline).map((c: any[]) => c[0]);
    expect(newCalls.filter((e) => e === 'deploys:update').length).toBe(0);

    await exec.stop();
  });

  test('marks failed on error and emits', async () => {
    const exec = startDeployExecutor();

    (db.query as any).mockImplementation(async (sql: string, params: any[]) => {
      if (/SET status='running'/.test(sql)) {
        return { rowCount: 1, rows: [{ id: 43, started_at: 't0', version: '__FAIL__' }] };
      }
      if (/INSERT INTO deployment_logs/i.test(sql)) {
        return { rowCount: 1, rows: [{ ts: 't-log' }] };
      }
      if (/SET status='failed'/.test(sql)) {
        return { rowCount: 1, rows: [{ id: 43, finished_at: 't2', error: 'forced failure for test' }] };
      }
      return { rowCount: 1 };
    });
      
    const emitSpy = vi.spyOn((ee as any).ee, 'emit');

    (ee as any).ee.emit('deploys:enqueue', { id: 43 });
  await vi.runOnlyPendingTimersAsync();

    // The catch handler will attempt a failed update
    expect(db.query.mock.calls.at(-1)[0]).toMatch(/status='failed'/);
  expect(db.query.mock.calls.at(-1)[1][0]).toBe(43);

  expect(emitSpy).toHaveBeenCalledWith('deploys:update', expect.objectContaining({ id: expect.any(String), status: 'failed' }));

    await exec.stop();
  });
});
