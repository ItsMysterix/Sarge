import { describe, it, expect, beforeAll } from 'vitest';
import WebSocket from 'ws';

// Neon serverless driver requires WebSocket in global scope
// for non-browser environments.
(global as any).WebSocket = WebSocket;

import { appRouter } from '../src/api/root';
import { db, drizzleDb } from '../src/api/lib/db';
import { ee } from '../src/api/lib/events';

let projectId: string;

beforeAll(async () => {
  const res = await db.query(`SELECT id FROM projects LIMIT 1`);
  if (!res.rows?.[0]) throw new Error('No project found; seed projects first');
  projectId = res.rows[0].id;

  // Seed a log row
  await db.query(
    `INSERT INTO logs (project_id, type, message, service, severity) VALUES ($1, 'info', 'vitest smoke log', 'api', 'low')`,
    [projectId]
  );

  // Seed a metric row (respecting check constraints)
  await db.query(
    `INSERT INTO metrics (project_id, service_name, cpu_usage, memory_usage, latency_ms, cost_daily, uptime_percent) VALUES ($1, 'api', 10.5, 42.5, 120, 0.5, 99.5)`,
    [projectId]
  );
});

describe('tRPC smoke (db-backed)', () => {
  const caller = appRouter.createCaller({
    db,
    drizzleDb,
    ee,
    requestMeta: {},
    session: { user: { id: 'vitest-user' } },
  });

  it('returns logs.tail/search', async () => {
    const tail = await caller.logs.tail({ service: 'api', limit: 5 });
    expect(Array.isArray(tail)).toBe(true);
    expect(tail.length).toBeGreaterThan(0);

    const search = await caller.logs.search({ search: 'vitest smoke log', service: 'api', limit: 5 });
    expect(Array.isArray(search)).toBe(true);
    expect(search.length).toBeGreaterThan(0);
  });

  it('returns metrics workspace data', async () => {
    const list = await caller.metrics.getWorkspaceMetrics({ workspaceId: projectId, limit: 5 });
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);

    const health = await caller.metrics.getWorkspaceHealth({ workspaceId: projectId });
    expect(health).not.toBeNull();
    if (health) {
      expect(Number(health.samples || 0)).toBeGreaterThan(0);
    }

    const summary = await caller.metrics.getServicesSummary();
    expect(Array.isArray(summary)).toBe(true);
    expect(summary.length).toBeGreaterThan(0);
  });
});
