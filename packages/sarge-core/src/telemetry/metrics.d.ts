import { Counter, Gauge, Histogram, Registry } from 'prom-client';
import type { EventBus } from '../domain/events';
export interface Metrics {
    registry: Registry;
    counters: {
        events_total: Counter<string>;
    };
    gauges: {
        services_started: Gauge<string>;
        services_healthy: Gauge<string>;
    };
    histograms: {
        request_latency_seconds: Histogram<string>;
        snapshot_duration_seconds: Histogram<string>;
    };
}
export declare function createMetrics(): Metrics;
export declare function instrumentEventBus(bus: EventBus, metrics: Metrics): EventBus;
export declare function createMetricsHandler(registry: Registry): (_req: any, res: any) => Promise<void>;
export declare function time<T>(hist: Histogram<string>, labels: Record<string, string>, fn: () => Promise<T> | T): Promise<T> | T;
