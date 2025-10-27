"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackBlueprintSchema = exports.ResourceSchema = exports.ServiceSchema = exports.HealthProbeSchema = void 0;
const zod_1 = require("zod");
exports.HealthProbeSchema = zod_1.z.object({
    http: zod_1.z
        .object({ path: zod_1.z.string().default('/'), port: zod_1.z.number().int().positive().optional() })
        .optional(),
    tcp: zod_1.z.object({ port: zod_1.z.number().int().positive() }).optional(),
    command: zod_1.z.string().optional()
});
exports.ServiceSchema = zod_1.z.object({
    name: zod_1.z.string(),
    type: zod_1.z.enum(['web', 'api', 'worker']).default('api'),
    cwd: zod_1.z.string().optional(),
    startCommand: zod_1.z.string().optional(),
    ports: zod_1.z.array(zod_1.z.number().int().positive()).default([]),
    envKeys: zod_1.z.array(zod_1.z.string()).default([]),
    health: exports.HealthProbeSchema.optional()
});
exports.ResourceSchema = zod_1.z.object({
    s3Buckets: zod_1.z.array(zod_1.z.string()).default([]),
    dynamoTables: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string(),
        partitionKey: zod_1.z.string().default('id'),
        sortKey: zod_1.z.string().optional()
    }))
        .default([]),
    lambdaFunctions: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string(),
        handler: zod_1.z.string().optional(),
        runtime: zod_1.z.string().optional()
    }))
        .default([])
});
exports.StackBlueprintSchema = zod_1.z.object({
    services: zod_1.z.array(exports.ServiceSchema).default([]),
    resources: exports.ResourceSchema.default({ s3Buckets: [], dynamoTables: [], lambdaFunctions: [] }),
    ports: zod_1.z.array(zod_1.z.number().int().positive()).default([]),
    envKeys: zod_1.z.array(zod_1.z.string()).default([]),
    docker: zod_1.z.object({
        dockerfile: zod_1.z.boolean().default(false),
        composeFiles: zod_1.z.array(zod_1.z.string()).default([])
    }).default({ dockerfile: false, composeFiles: [] }),
    awsSdks: zod_1.z.array(zod_1.z.enum(['s3', 'dynamodb', 'lambda'])).default([])
});
