"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMetrics = createMetrics;
exports.instrumentEventBus = instrumentEventBus;
exports.createMetricsHandler = createMetricsHandler;
exports.time = time;
const prom_client_1 = require("prom-client");
function createMetrics() {
    const registry = new prom_client_1.Registry();
    (0, prom_client_1.collectDefaultMetrics)({ register: registry });
    const counters = {
        events_total: new prom_client_1.Counter({
            name: 'sarge_events_total',
            help: 'Total number of Sarge events by topic',
            labelNames: ['topic'],
            registers: [registry],
        }),
    };
    const gauges = {
        services_started: new prom_client_1.Gauge({
            name: 'sarge_services_started',
            help: 'Number of services in starting or started states',
            registers: [registry],
        }),
        services_healthy: new prom_client_1.Gauge({
            name: 'sarge_services_healthy',
            help: 'Number of services in healthy state',
            registers: [registry],
        }),
    };
    const histograms = {
        request_latency_seconds: new prom_client_1.Histogram({
            name: 'sarge_request_latency_seconds',
            help: 'Request latencies by route',
            labelNames: ['route'],
            buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
            registers: [registry],
        }),
        snapshot_duration_seconds: new prom_client_1.Histogram({
            name: 'sarge_snapshot_duration_seconds',
            help: 'Snapshot create/replay durations by action',
            labelNames: ['action'],
            buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
            registers: [registry],
        }),
    };
    return { registry, counters, gauges, histograms };
}
function instrumentEventBus(bus, metrics) {
    const started = new Set();
    const healthy = new Set();
    return {
        publish(topic, payload) {
            metrics.counters.events_total.inc({ topic: String(topic) });
            if (topic === 'service.lifecycle') {
                const p = payload;
                if (p.to === 'starting')
                    started.add(p.serviceId);
                if (p.to === 'healthy')
                    healthy.add(p.serviceId);
                if (p.to === 'stopped' || p.to === 'error') {
                    started.delete(p.serviceId);
                    healthy.delete(p.serviceId);
                }
                metrics.gauges.services_started.set(started.size);
                metrics.gauges.services_healthy.set(healthy.size);
            }
            return bus.publish(topic, payload);
        },
        subscribe(topic, handler) {
            return bus.subscribe(topic, handler);
        },
    };
}
function createMetricsHandler(registry) {
    return async function handler(_req, res) {
        const body = await registry.metrics();
        res.statusCode = 200;
        res.setHeader('content-type', registry.contentType);
        res.end(body);
    };
}
function time(hist, labels, fn) {
    const end = hist.startTimer(labels);
    try {
        const r = fn();
        if (r && typeof r.then === 'function') {
            return r.finally(() => end());
        }
        end();
        return r;
    }
    catch (e) {
        end();
        throw e;
    }
}
