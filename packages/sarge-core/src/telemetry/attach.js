"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTelemetry = createTelemetry;
exports.markUp = markUp;
exports.markRestart = markRestart;
exports.renderPrometheus = renderPrometheus;
exports.ensureDashboards = ensureDashboards;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function createTelemetry() {
    return { up: new Map(), restarts: new Map() };
}
function markUp(t, name, up) {
    t.up.set(name, up ? 1 : 0);
}
function markRestart(t, name) {
    const cur = t.restarts.get(name) || 0;
    t.restarts.set(name, cur + 1);
}
function renderPrometheus(t) {
    const lines = [];
    for (const [name, v] of t.up)
        lines.push(`sarge_service_up{service="${name}"} ${v}`);
    for (const [name, v] of t.restarts)
        lines.push(`sarge_service_restarts_total{service="${name}"} ${v}`);
    return lines.join('\n') + (lines.length ? '\n' : '');
}
function ensureDashboards(dataRoot) {
    const dir = node_path_1.default.join(dataRoot, 'dashboards');
    node_fs_1.default.mkdirSync(dir, { recursive: true });
    const dashboards = [
        { file: 'workspace-health.json', title: 'Workspace Health' },
        { file: 'stack-overview.json', title: 'Stack Overview' },
        { file: 'service-drilldown.json', title: 'Service Drill-down' }
    ];
    for (const d of dashboards) {
        const p = node_path_1.default.join(dir, d.file);
        if (!node_fs_1.default.existsSync(p)) {
            node_fs_1.default.writeFileSync(p, JSON.stringify({ title: d.title, panels: [] }, null, 2));
        }
    }
}
