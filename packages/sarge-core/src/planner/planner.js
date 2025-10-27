"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planApply = planApply;
const schema_1 = require("../detector/schema");
const schema_2 = require("./schema");
const SYS_RESERVED_BELOW = 1024;
function planApply(blueprintInput, currentInput, optionsInput) {
    const blueprint = schema_1.StackBlueprintSchema.parse(blueprintInput);
    const current = schema_2.CurrentStackStateSchema.parse(currentInput ?? { services: [], resources: {} });
    const options = schema_2.PlannerOptionsSchema.parse(optionsInput ?? {});
    // Validate and assign ports
    const { assigned, issues } = assignPorts(blueprint, options);
    // Missing envs
    const envIssues = detectMissingEnvs(blueprint, options);
    // Resource diff
    const resourceOps = diffResources(current, blueprint);
    // Service diff and start plan
    const serviceOps = diffServices(current, blueprint, assigned);
    const allIssues = [...issues, ...envIssues];
    const planText = renderPlanText(assigned, allIssues, resourceOps, serviceOps);
    const applyPlan = schema_2.ApplyPlanSchema.parse({
        blueprint,
        assignedPorts: assigned,
        issues: allIssues,
        resourceOps,
        serviceOps,
        telemetry: { prometheus: true, cloudwatchLogs: true },
        rollbackPoints: [{ description: 'Pre-apply snapshot' }],
        planText
    });
    return applyPlan;
}
function assignPorts(blueprint, options) {
    const used = new Set([...options.reservedPorts]);
    for (let i = 1; i < SYS_RESERVED_BELOW; i++)
        used.add(i);
    const assigned = [];
    const issues = [];
    for (const svc of blueprint.services) {
        const req = (svc.ports ?? []);
        const got = [];
        for (const p of req.length ? req : []) {
            let target = p;
            if (used.has(target)) {
                const kind = options.reservedPorts.includes(target) || target < SYS_RESERVED_BELOW ? 'reserved-port' : 'port-conflict';
                target = findNextFree(Math.max(options.basePort, p), used);
                issues.push({ kind: kind, service: svc.name, requested: p, assigned: target });
            }
            used.add(target);
            got.push(target);
        }
        assigned.push({ service: svc.name, requested: req, assigned: got });
    }
    return { assigned, issues };
}
function findNextFree(start, used) {
    let p = Math.max(start, SYS_RESERVED_BELOW);
    while (used.has(p) && p < 65535)
        p++;
    return p;
}
function detectMissingEnvs(blueprint, options) {
    const issues = [];
    const need = new Set(blueprint.envKeys || []);
    // Also include service-level env keys if present
    for (const svc of blueprint.services) {
        for (const k of svc.envKeys || [])
            need.add(k);
    }
    const missing = [];
    for (const k of need) {
        if (!(k in options.providedEnv) || options.providedEnv[k] == null || options.providedEnv[k] === '')
            missing.push(k);
    }
    if (missing.length) {
        const svcMap = new Map();
        for (const k of missing) {
            const svcs = blueprint.services.filter((s) => (s.envKeys || []).includes(k)).map((s) => s.name);
            svcMap.set(k, svcs);
        }
        for (const k of missing) {
            issues.push({ kind: 'missing-env', key: k, services: svcMap.get(k) || [] });
        }
    }
    return issues;
}
function diffResources(current, blueprint) {
    const ops = [];
    // S3
    const curBuckets = new Set(current.resources.s3Buckets || []);
    const newBuckets = new Set(blueprint.resources.s3Buckets || []);
    for (const b of newBuckets)
        if (!curBuckets.has(b))
            ops.push({ op: 'create', resourceType: 's3Bucket', payload: { name: b } });
    for (const b of curBuckets)
        if (!newBuckets.has(b))
            ops.push({ op: 'delete', resourceType: 's3Bucket', payload: { name: b } });
    // Dynamo
    const curTables = new Map((current.resources.dynamoTables || []).map((t) => [t.name, t]));
    const newTables = new Map((blueprint.resources.dynamoTables || []).map((t) => [t.name, t]));
    for (const [name, t] of newTables) {
        if (!curTables.has(name))
            ops.push({ op: 'create', resourceType: 'dynamoTable', payload: t });
        else {
            const cur = curTables.get(name);
            if (cur.partitionKey !== t.partitionKey || cur.sortKey !== t.sortKey)
                ops.push({ op: 'update', resourceType: 'dynamoTable', payload: t });
        }
    }
    for (const [name, t] of curTables)
        if (!newTables.has(name))
            ops.push({ op: 'delete', resourceType: 'dynamoTable', payload: t });
    // Lambda
    const curFns = new Map((current.resources.lambdaFunctions || []).map((f) => [f.name, f]));
    const newFns = new Map((blueprint.resources.lambdaFunctions || []).map((f) => [f.name, f]));
    for (const [name, f] of newFns)
        if (!curFns.has(name))
            ops.push({ op: 'create', resourceType: 'lambdaFunction', payload: f });
    for (const [name, f] of curFns)
        if (!newFns.has(name))
            ops.push({ op: 'delete', resourceType: 'lambdaFunction', payload: f });
    return ops;
}
function diffServices(current, blueprint, assigned) {
    const ops = [];
    const curMap = new Map((current.services || []).map((s) => [s.name, s]));
    const namesInBlueprint = new Set(blueprint.services.map((s) => s.name));
    for (const svc of blueprint.services) {
        const cur = curMap.get(svc.name);
        const portsAssigned = (assigned.find((a) => a.service === svc.name)?.assigned || []);
        if (!cur) {
            ops.push({ op: 'start', name: svc.name, ports: portsAssigned });
        }
        else {
            const curPorts = cur.ports || [];
            if (JSON.stringify([...curPorts].sort()) !== JSON.stringify([...portsAssigned].sort())) {
                ops.push({ op: 'restart', name: svc.name, reason: 'ports-changed', ports: portsAssigned });
            }
        }
    }
    for (const cur of curMap.values())
        if (!namesInBlueprint.has(cur.name))
            ops.push({ op: 'stop', name: cur.name });
    return ops;
}
function renderPlanText(assigned, issues, resourceOps, serviceOps) {
    const lines = [];
    lines.push('Apply Plan:');
    lines.push('- Ports:');
    for (const a of assigned) {
        lines.push(`  - ${a.service}: ${a.requested.join(',') || 'none'} -> ${a.assigned.join(',') || 'none'}`);
    }
    if (issues.length) {
        lines.push('- Issues:');
        for (const i of issues) {
            if (i.kind === 'missing-env')
                lines.push(`  - Missing env ${i.key} (services: ${i.services.join(',') || 'n/a'})`);
            else
                lines.push(`  - ${i.kind} for ${i.service}: ${i.requested} -> ${i.assigned}`);
        }
    }
    if (resourceOps.length) {
        lines.push('- Resource ops:');
        for (const op of resourceOps)
            lines.push(`  - ${op.op} ${op.resourceType}`);
    }
    if (serviceOps.length) {
        lines.push('- Service ops:');
        for (const op of serviceOps)
            lines.push(`  - ${op.op} ${op.name}`);
    }
    return lines.join('\n');
}
