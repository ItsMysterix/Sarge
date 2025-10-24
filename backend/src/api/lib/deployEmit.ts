import type { Emitter } from './realtime';

export type DeployEvent =
  | { type: 'deploys:enqueue'; id: string }
  | { type: 'deploys:update'; id: string; status: 'pending'|'running'|'success'|'failed'; started_at?: string|null; finished_at?: string|null; error?: string|null }
  | { type: 'deploys:log'; id: string; step?: string|null; line: string; ts: string };

export const topicAll = 'deploys:*';
export const topicOne = (id: string) => `deploys:${id}`;

export function emitDeploy(ee: Emitter, ev: DeployEvent): void {
  // Back-compat: still emit legacy update channel for updates
  if (ev.type === 'deploys:update') {
    ee.emit('deploys:update', ev);
  }
  // Global and per-id topics for updates and logs
  if (ev.type === 'deploys:update' || ev.type === 'deploys:log') {
    ee.emit(topicAll, ev);
    ee.emit(topicOne(ev.id), ev);
  }
  if (ev.type === 'deploys:enqueue') {
    ee.emit('deploys:enqueue', { id: ev.id });
  }
}
