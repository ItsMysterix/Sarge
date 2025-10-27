"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCompose = exportCompose;
exports.runCompose = runCompose;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_child_process_1 = require("node:child_process");
const logging_1 = require("../apply/logging");
const attach_1 = require("../telemetry/attach");
function exportCompose(plan, options = {}) {
    const outDir = options.outDir ?? process.cwd();
    const fileName = options.fileName ?? 'docker-compose.sarge.yml';
    const filePath = node_path_1.default.join(outDir, fileName);
    const portsMap = new Map();
    for (const ap of plan.assignedPorts) {
        if (ap.assigned[0])
            portsMap.set(ap.service, ap.assigned[0]);
    }
    const needLocalstack = plan.blueprint.resources.s3Buckets.length > 0 ||
        plan.blueprint.resources.dynamoTables.length > 0 ||
        plan.blueprint.resources.lambdaFunctions.length > 0;
    const servicesYaml = [];
    // localstack first if needed for determinism
    if (needLocalstack) {
        const svc = [
            '  localstack:',
            '    image: localstack/localstack:2.3',
            '    container_name: sarge-localstack',
            '    environment:',
            `      - SERVICES=${servicesList(plan)}`,
            '    ports:',
            '      - "4566:4566"',
            '    networks:',
            '      - sarge'
        ];
        servicesYaml.push(svc.join('\n'));
    }
    for (const op of plan.serviceOps) {
        if (op.op !== 'start')
            continue;
        const svc = plan.blueprint.services.find((s) => s.name === op.name);
        if (!svc)
            continue;
        const assigned = portsMap.get(svc.name);
        const cwdRel = svc.cwd ? `/workspace/${svc.cwd}` : '/workspace';
        const lines = [];
        lines.push(`  ${svc.name}:`);
        lines.push('    image: node:18-alpine');
        lines.push(`    container_name: sarge-${svc.name}`);
        lines.push('    working_dir: ' + cwdRel);
        lines.push('    command: ' + JSON.stringify(svc.startCommand || 'node server.js'));
        lines.push('    environment:');
        if (assigned)
            lines.push(`      - PORT=${assigned}`);
        for (const key of svc.envKeys || [])
            lines.push(`      - ${key}=
`);
        if (assigned) {
            lines.push('    ports:');
            lines.push(`      - "${assigned}:${assigned}"`);
        }
        lines.push('    volumes:');
        lines.push('      - .:/workspace');
        lines.push('    networks:');
        lines.push('      - sarge');
        if (needLocalstack) {
            lines.push('    depends_on:');
            lines.push('      - localstack');
        }
        servicesYaml.push(lines.join('\n'));
    }
    const yaml = [
        'version: "3.9"',
        'services:',
        servicesYaml.join('\n'),
        'networks:',
        '  sarge: {}'
    ].join('\n') + '\n';
    if (options.write !== false) {
        node_fs_1.default.writeFileSync(filePath, yaml);
    }
    return { filePath, yaml };
}
function servicesList(plan) {
    const set = new Set();
    if (plan.blueprint.resources.s3Buckets.length)
        set.add('s3');
    if (plan.blueprint.resources.dynamoTables.length)
        set.add('dynamodb');
    if (plan.blueprint.resources.lambdaFunctions.length)
        set.add('lambda');
    const list = Array.from(set).sort().join(',');
    return list || '';
}
async function runCompose(plan, options = {}) {
    const errors = [];
    if (process.env.DOCKER_MODE !== 'true') {
        return { ok: false, errors: ['docker mode disabled'], stop: async () => { } };
    }
    const cwd = options.cwd ?? process.cwd();
    const { filePath } = exportCompose(plan, { outDir: cwd });
    const logsDir = node_path_1.default.join(options.dataRoot ?? node_path_1.default.resolve(process.cwd(), 'data/sarge'), 'logs');
    node_fs_1.default.mkdirSync(logsDir, { recursive: true });
    // bring up compose
    await new Promise((resolve, reject) => {
        const p = (0, node_child_process_1.spawn)(`docker compose -f ${filePath} up -d`, { cwd, shell: true });
        p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('docker compose up failed'))));
    });
    // tail logs for each service to bridge into sarge logs
    const tails = [];
    const telemetry = options.telemetryEnabled ? (0, attach_1.createTelemetry)() : undefined;
    for (const op of plan.serviceOps) {
        if (op.op !== 'start')
            continue;
        const name = op.name;
        const container = `sarge-${name}`;
        const logFile = node_path_1.default.join(logsDir, `${name}.log`);
        const out = node_fs_1.default.createWriteStream(logFile, { flags: 'a' });
        const t = (0, node_child_process_1.spawn)(`docker logs -f ${container}`, { cwd, shell: true });
        t.stdout?.on('data', (d) => out.write((0, logging_1.formatLog)(name, 'stdout', d)));
        t.stderr?.on('data', (d) => out.write((0, logging_1.formatLog)(name, 'stderr', d)));
        tails.push({ name, proc: t, stream: out });
        if (telemetry)
            (0, attach_1.markUp)(telemetry, name, true);
    }
    const stop = async () => {
        // stop tails first
        for (const t of tails) {
            try {
                t.proc.kill();
            }
            catch { }
            try {
                t.stream.end();
            }
            catch { }
            if (telemetry)
                (0, attach_1.markUp)(telemetry, t.name, false);
        }
        await new Promise((resolve) => {
            const p = (0, node_child_process_1.spawn)(`docker compose -f ${filePath} down`, { cwd, shell: true });
            p.on('exit', () => resolve());
        });
    };
    return { ok: true, errors, stop };
}
