import WebSocket from "ws";
// Provide WebSocket for Neon serverless driver
(global as any).WebSocket = WebSocket;

import { appRouter } from "../src/api/root";
import { db } from "../src/api/lib/db";
import { ee } from "../src/api/lib/events";

const PROJECT_ID = "febe0ac4-dd7f-4d53-bb53-8d1c87c9c224";

async function main() {
  const caller = appRouter.createCaller({
    db,
    ee,
    requestMeta: {},
    session: { user: { id: "smoke-user" } },
  });

  const results: Record<string, unknown> = {};
  const steps: Array<[string, () => Promise<unknown>]> = [
    ['logs.tail', () => caller.logs.tail({ service: "api", limit: 5 })],
    ['logs.search', () => caller.logs.search({ search: "test", service: "api", limit: 5 })],
    ['metrics.workspace', () => caller.metrics.getWorkspaceMetrics({ workspaceId: PROJECT_ID, limit: 5 })],
    ['metrics.workspaceHealth', () => caller.metrics.getWorkspaceHealth({ workspaceId: PROJECT_ID })],
    ['metrics.servicesSummary', () => caller.metrics.getServicesSummary()],
  ];

  for (const [name, fn] of steps) {
    try {
      results[name] = await fn();
    } catch (err) {
      results[name] = { error: (err as Error).message, stack: (err as Error).stack };
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
