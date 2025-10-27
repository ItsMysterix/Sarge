import { describe, expect, it } from 'vitest'
import type { EventBus, Event, EventHandler } from '../domain/events'

class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, Set<EventHandler<any>>>()
  publish<T>(topic: string, payload: T) {
    const evt: Event<T> = { topic: topic as any, timestamp: Date.now(), payload }
    for (const h of this.handlers.get(topic) ?? []) h(evt)
  }
  subscribe<T>(topic: string, handler: EventHandler<T>) {
    if (!this.handlers.has(topic)) this.handlers.set(topic, new Set())
    this.handlers.get(topic)!.add(handler as any)
    return () => this.handlers.get(topic)!.delete(handler as any)
  }
}

describe('EventBus', () => {
  it('delivers service lifecycle events to subscribers', async () => {
    const bus = new InMemoryEventBus()
    const received: string[] = []
    const unsub = bus.subscribe('service.lifecycle', (e) => {
      received.push((e.payload as any).to)
    })
    bus.publish('service.lifecycle', { serviceId: 'api', from: 'init', to: 'starting' })
    bus.publish('service.lifecycle', { serviceId: 'api', from: 'starting', to: 'healthy' })
    unsub()
    bus.publish('service.lifecycle', { serviceId: 'api', from: 'healthy', to: 'stopping' })
    expect(received).toEqual(['starting', 'healthy'])
  })
})
