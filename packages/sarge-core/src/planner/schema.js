"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlannerOptionsSchema = exports.ApplyPlanSchema = exports.TelemetryAttachmentSchema = exports.ServiceOpSchema = exports.ResourceOpSchema = exports.ValidationIssueSchema = exports.CurrentStackStateSchema = exports.CurrentResourcesSchema = exports.CurrentServiceSchema = void 0;
const zod_1 = require("zod");
const schema_1 = require("../detector/schema");
exports.CurrentServiceSchema = zod_1.z.object({
    name: zod_1.z.string(),
    type: zod_1.z.enum(['web', 'api', 'worker']).default('api'),
    ports: zod_1.z.array(zod_1.z.number().int().positive()).default([]),
    env: zod_1.z.record(zod_1.z.string(), zod_1.z.string().optional()).default({})
});
exports.CurrentResourcesSchema = zod_1.z.object({
    s3Buckets: zod_1.z.array(zod_1.z.string()).default([]),
    dynamoTables: zod_1.z
        .array(zod_1.z.object({ name: zod_1.z.string(), partitionKey: zod_1.z.string().default('id'), sortKey: zod_1.z.string().optional() }))
        .default([]),
    lambdaFunctions: zod_1.z.array(zod_1.z.object({ name: zod_1.z.string(), handler: zod_1.z.string().optional(), runtime: zod_1.z.string().optional() })).default([])
});
exports.CurrentStackStateSchema = zod_1.z.object({
    services: zod_1.z.array(exports.CurrentServiceSchema).default([]),
    resources: exports.CurrentResourcesSchema.default({ s3Buckets: [], dynamoTables: [], lambdaFunctions: [] })
});
exports.ValidationIssueSchema = zod_1.z.discriminatedUnion('kind', [
    zod_1.z.object({ kind: zod_1.z.literal('port-conflict'), service: zod_1.z.string(), requested: zod_1.z.number(), assigned: zod_1.z.number() }),
    zod_1.z.object({ kind: zod_1.z.literal('reserved-port'), service: zod_1.z.string(), requested: zod_1.z.number(), assigned: zod_1.z.number() }),
    zod_1.z.object({ kind: zod_1.z.literal('missing-env'), key: zod_1.z.string(), services: zod_1.z.array(zod_1.z.string()) })
]);
exports.ResourceOpSchema = zod_1.z.discriminatedUnion('op', [
    zod_1.z.object({ op: zod_1.z.literal('create'), resourceType: zod_1.z.enum(['s3Bucket', 'dynamoTable', 'lambdaFunction']), payload: zod_1.z.any() }),
    zod_1.z.object({ op: zod_1.z.literal('update'), resourceType: zod_1.z.enum(['s3Bucket', 'dynamoTable', 'lambdaFunction']), payload: zod_1.z.any() }),
    zod_1.z.object({ op: zod_1.z.literal('delete'), resourceType: zod_1.z.enum(['s3Bucket', 'dynamoTable', 'lambdaFunction']), payload: zod_1.z.any() })
]);
exports.ServiceOpSchema = zod_1.z.discriminatedUnion('op', [
    zod_1.z.object({ op: zod_1.z.literal('start'), name: zod_1.z.string(), ports: zod_1.z.array(zod_1.z.number()).default([]) }),
    zod_1.z.object({ op: zod_1.z.literal('restart'), name: zod_1.z.string(), reason: zod_1.z.string().optional(), ports: zod_1.z.array(zod_1.z.number()).default([]) }),
    zod_1.z.object({ op: zod_1.z.literal('stop'), name: zod_1.z.string() })
]);
exports.TelemetryAttachmentSchema = zod_1.z.object({
    prometheus: zod_1.z.boolean().default(true),
    cloudwatchLogs: zod_1.z.boolean().default(true)
});
exports.ApplyPlanSchema = zod_1.z.object({
    blueprint: schema_1.StackBlueprintSchema,
    assignedPorts: zod_1.z.array(zod_1.z.object({ service: zod_1.z.string(), requested: zod_1.z.array(zod_1.z.number()), assigned: zod_1.z.array(zod_1.z.number()) })).default([]),
    issues: zod_1.z.array(exports.ValidationIssueSchema).default([]),
    resourceOps: zod_1.z.array(exports.ResourceOpSchema).default([]),
    serviceOps: zod_1.z.array(exports.ServiceOpSchema).default([]),
    telemetry: exports.TelemetryAttachmentSchema.default({ prometheus: true, cloudwatchLogs: true }),
    rollbackPoints: zod_1.z.array(zod_1.z.object({ description: zod_1.z.string() })).default([]),
    planText: zod_1.z.string().default('')
});
exports.PlannerOptionsSchema = zod_1.z.object({
    reservedPorts: zod_1.z.array(zod_1.z.number().int().positive()).default([3200]),
    basePort: zod_1.z.number().int().positive().default(4000),
    providedEnv: zod_1.z.record(zod_1.z.string(), zod_1.z.string().optional()).default({})
});
