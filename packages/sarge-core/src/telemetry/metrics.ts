import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client'
import type { EventBus, Event, ServiceLifecycleEventPayload } from '../domain/events'

export interface Metrics {
  registry: Registry
  counters: {
    events_total: Counter<string>
  }
  gauges: {
    services_started: Gauge<string>
    services_healthy: Gauge<string>
  }
  histograms: {
    request_latency_seconds: Histogram<string>
    snapshot_duration_seconds: Histogram<string>
  }
}

export function createMetrics(): Metrics {
  const registry = new Registry()
  collectDefaultMetrics({ register: registry })

  const counters = {
    events_total: new Counter({
      name: 'sarge_events_total',
      help: 'Total number of Sarge events by topic',
      labelNames: ['topic'] as const,
      registers: [registry],
    }),
  }

  const gauges = {
    services_started: new Gauge({
      name: 'sarge_services_started',
      help: 'Number of services in starting or started states',
      registers: [registry],
    }),
    services_healthy: new Gauge({
      name: 'sarge_services_healthy',
      help: 'Number of services in healthy state',
      registers: [registry],
    }),
  }

  const histograms = {
    request_latency_seconds: new Histogram({
      name: 'sarge_request_latency_seconds',
      help: 'Request latencies by route',
      labelNames: ['route'] as const,
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [registry],
    }),
    snapshot_duration_seconds: new Histogram({
      name: 'sarge_snapshot_duration_seconds',
      help: 'Snapshot create/replay durations by action',
      labelNames: ['action'] as const,
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [registry],
    }),
  }

  return { registry, counters, gauges, histograms }
}

export function instrumentEventBus(bus: EventBus, metrics: Metrics): EventBus {
  const started = new Set<string>()
  const healthy = new Set<string>()

  return {
    publish<T>(topic: any, payload: T) {
      metrics.counters.events_total.inc({ topic: String(topic) })
      if (topic === 'service.lifecycle') {
        const p = payload as unknown as ServiceLifecycleEventPayload
        if (p.to === 'starting') started.add(p.serviceId)
        if (p.to === 'healthy') healthy.add(p.serviceId)
        if (p.to === 'stopped' || p.to === 'error') {
          started.delete(p.serviceId)
          healthy.delete(p.serviceId)
        }
        metrics.gauges.services_started.set(started.size)
        metrics.gauges.services_healthy.set(healthy.size)
      }
      return bus.publish(topic as any, payload)
    },
    subscribe(topic, handler) {
      return bus.subscribe(topic, handler)
    },
  }
}

export function createMetricsHandler(registry: Registry) {
  return async function handler(_req: any, res: any) {
    const body = await registry.metrics()
    res.statusCode = 200
    res.setHeader('content-type', registry.contentType)
    res.end(body)
  }
}

export function time<T>(hist: Histogram<string>, labels: Record<string, string>, fn: () => Promise<T> | T): Promise<T> | T {
  const end = hist.startTimer(labels)
  try {
    const r = fn()
    if (r && typeof (r as any).then === 'function') {
      return (r as Promise<T>).finally(() => end())
    }
    end()
    return r as T
  } catch (e) {
    end()
    throw e
  }
}
