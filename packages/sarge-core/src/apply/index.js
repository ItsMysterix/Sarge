"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = apply;
const node_child_process_1 = require("node:child_process");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const promises_1 = require("node:timers/promises");
const attach_1 = require("../telemetry/attach");
const logging_1 = require("./logging");
async function apply(plan, options = {}) {
    const repoPath = options.repoPath ?? process.cwd();
    const dataRoot = options.dataRoot ?? node_path_1.default.resolve(process.cwd(), 'data/sarge');
    const started = [];
    const errors = [];
    const telemetry = (0, attach_1.createTelemetry)();
    const historyFile = node_path_1.default.join(dataRoot, 'history.jsonl');
    const runStartedAt = Date.now();
    let tookSnapshot = false;
    const snapshotName = options.snapshot?.name || `pre-apply-${new Date(runStartedAt).toISOString()}`;
    // Ensure log directories
    const logsDir = node_path_1.default.join(dataRoot, 'logs');
    node_fs_1.default.mkdirSync(logsDir, { recursive: true });
    const metricsDir = node_path_1.default.join(dataRoot, 'metrics');
    node_fs_1.default.mkdirSync(metricsDir, { recursive: true });
    (0, attach_1.ensureDashboards)(dataRoot);
    const writeMetrics = () => {
        const p = node_path_1.default.join(metricsDir, 'metrics.prom');
        node_fs_1.default.writeFileSync(p, (0, attach_1.renderPrometheus)(telemetry));
    };
    try {
        // Planner validations: missing envs or missing HTTP ports must be addressed before apply
        const missingEnvIssues = (plan.issues || []).filter((i) => i.kind === 'missing-env');
        if (missingEnvIssues.length) {
            const hints = missingEnvIssues.map((i) => `Missing env ${i.key} for services: ${(i.services || []).join(',') || 'n/a'}`);
            throw { category: 'planner', message: 'Missing required environment variables', hints };
        }
        const missingHttpPorts = [];
        for (const svc of plan.blueprint.services) {
            const http = svc.health?.http;
            if (http) {
                const assigned = (plan.assignedPorts || []).find((a) => a.service === svc.name)?.assigned || [];
                if (!assigned.length)
                    missingHttpPorts.push(svc.name);
            }
        }
        if (missingHttpPorts.length) {
            throw { category: 'planner', message: 'HTTP services without assigned ports', hints: missingHttpPorts.map((n) => `Assign a port to service ${n}`) };
        }
        // Optional pre-apply snapshot
        if (options.snapshot?.manager) {
            try {
                await options.snapshot.manager.create(snapshotName);
                tookSnapshot = true;
            }
            catch (e) {
                // Non-fatal telemetry category error
                errors.push({ category: 'telemetry', message: `snapshot.create failed: ${String(e?.message || e)}` });
            }
        }
        // Phase 1: resources (no-ops here; resources would be applied by adapters)
        // Phase 2: services
        for (const svcOp of plan.serviceOps) {
            if (svcOp.op === 'start') {
                const svc = plan.blueprint.services.find((s) => s.name === svcOp.name);
                if (!svc)
                    continue;
                const cwd = svc.cwd ? node_path_1.default.resolve(repoPath, svc.cwd) : repoPath;
                const port = (svcOp.ports && svcOp.ports[0]) || undefined;
                const logFile = node_path_1.default.join(logsDir, `${svcOp.name}.log`);
                const { child } = spawnService(svc.name, svc.startCommand || 'node server.js', cwd, logFile, port);
                started.push({ name: svc.name, proc: child, port, cwd });
                const ok = await waitHealthy(svc, port, options);
                if (!ok) {
                    const hints = [];
                    if (svc.health?.http && !port)
                        hints.push('Service has HTTP healthcheck but no port assigned; assign a port in plan');
                    const missingEnvHints = (plan.issues || [])
                        .filter((i) => i.kind === 'missing-env' && (i.services || []).includes(svc.name))
                        .map((i) => `Missing env ${i.key}`);
                    hints.push(...missingEnvHints);
                    throw mkRuntimeError(`healthcheck failed for ${svc.name}`, hints);
                }
                // mark service up in telemetry once healthy
                (0, attach_1.markUp)(telemetry, svc.name, true);
                writeMetrics();
            }
        }
        return {
            ok: true,
            startedServices: started.map((s) => s.name),
            errors,
            stop: async () => {
                await stopAll(started);
                // mark all services down on stop
                for (const s of started)
                    (0, attach_1.markUp)(telemetry, s.name, false);
                writeMetrics();
                persistHistory(historyFile, runStartedAt, true, started.map((s) => s.name), errors);
            }
        };
    }
    catch (e) {
        if (isStructuredError(e))
            errors.push(e);
        else
            errors.push({ category: 'runtime', message: String(e?.message || e) });
        // rollback: stop everything and invoke hook
        await stopAll(started);
        // mark any started services down
        for (const s of started)
            (0, attach_1.markUp)(telemetry, s.name, false);
        writeMetrics();
        // attempt snapshot rollback
        if (tookSnapshot && options.snapshot?.manager) {
            try {
                await options.snapshot.manager.replay(snapshotName);
            }
            catch (re) {
                errors.push({ category: 'runtime', message: `snapshot.replay failed: ${String(re?.message || re)}` });
            }
        }
        if (options.rollback)
            await options.rollback();
        persistHistory(historyFile, runStartedAt, false, [], errors);
        return { ok: false, startedServices: [], errors, stop: async () => { } };
    }
}
function spawnService(name, command, cwd, logFile, port) {
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(logFile), { recursive: true });
    const out = node_fs_1.default.createWriteStream(logFile, { flags: 'a' });
    const env = { ...process.env, ...(port ? { PORT: String(port) } : {}) };
    const child = (0, node_child_process_1.spawn)(command, { cwd, shell: true, env });
    child.stdout?.on('data', (d) => out.write((0, logging_1.formatLog)(name, 'stdout', d)));
    child.stderr?.on('data', (d) => out.write((0, logging_1.formatLog)(name, 'stderr', d)));
    child.on('exit', (code) => out.write((0, logging_1.formatLog)(name, 'exit', `code=${code}\n`)));
    return { child };
}
async function waitHealthy(svc, port, options) {
    const timeoutMs = options.serviceStartTimeoutMs ?? 5000;
    const retries = options.healthRetries ?? 10;
    const pathPart = svc.health?.http?.path ?? '/';
    if (!port)
        return true;
    const deadline = Date.now() + timeoutMs;
    let attempt = 0;
    // small initial delay to allow process bootstrap
    if (attempt === 0)
        await (0, promises_1.setTimeout)(200);
    while (Date.now() < deadline && attempt < retries) {
        attempt++;
        try {
            const res = await fetch(`http://127.0.0.1:${port}${pathPart}`);
            if (res.ok)
                return true;
        }
        catch { /* ignore */ }
        await (0, promises_1.setTimeout)(100);
    }
    return false;
}
async function stopAll(started) {
    for (const s of started.reverse()) {
        try {
            if (s.proc.pid)
                process.kill(s.proc.pid);
        }
        catch { /* ignore */ }
    }
}
function persistHistory(file, startedAt, ok, startedServices, errors) {
    try {
        node_fs_1.default.mkdirSync(node_path_1.default.dirname(file), { recursive: true });
        const rec = {
            ts: new Date().toISOString(),
            durationMs: Date.now() - startedAt,
            ok,
            startedServices,
            errors,
        };
        node_fs_1.default.appendFileSync(file, JSON.stringify(rec) + '\n');
    }
    catch {
        // ignore history persistence failures
    }
}
function mkRuntimeError(message, hints) {
    return { category: 'runtime', message, ...(hints && hints.length ? { hints } : {}) };
}
function isStructuredError(e) {
    return e && typeof e === 'object' && typeof e.message === 'string' && typeof e.category === 'string';
}
