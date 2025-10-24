import { describe, expect, test, vi } from 'vitest';

// Minimal observable mock for tRPC
vi.mock('@trpc/server/observable', () => {
  return {
    observable: (fn: any) => ({
      subscribe: (observer: any) => {
        const teardown = fn(observer);
        return { unsubscribe: teardown };
      },
    }),
  } as any;
});

import { ee } from '../src/api/lib/events';
import { createBufferedSubscription } from '../src/api/lib/realtime';

// Minimal observer harness to count emissions
function makeObserver() {
  const received: any[] = [];
  return {
    next: (v: any) => received.push(v),
    get: () => received,
  };
}

describe('logs.stream burst guard', () => {
  test('emits at most perTickCap items in a single tick and schedules remainder', async () => {
    const perTickCap = 25;
  const subFactory = createBufferedSubscription('logs:new:test', { bufferSize: 500, perTickCap });

  // Simulate tRPC observable subscription
  const observer = makeObserver();
  const subscription = (subFactory() as any);
  const sub = subscription.subscribe(observer);

    // Burst emit 100 items synchronously
    for (let i = 0; i < 100; i++) {
      ee.emit('logs:new:test', { i });
    }

    // Immediately after burst, we should have at most perTickCap items
    expect(observer.get().length).toBeLessThanOrEqual(perTickCap);

    // Await several immediates to allow all scheduled flushes
    for (let i = 0; i < 6 && observer.get().length < 100; i++) {
      await new Promise((r) => setImmediate(r));
    }
    expect(observer.get().length).toBe(100);

    // Cleanup
    sub.unsubscribe();
  });
});
