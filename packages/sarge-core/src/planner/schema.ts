import { z } from 'zod'
import { StackBlueprintSchema } from '../detector/schema'

export const CurrentServiceSchema = z.object({
  name: z.string(),
  type: z.enum(['web', 'api', 'worker']).default('api'),
  ports: z.array(z.number().int().positive()).default([]),
  env: z.record(z.string(), z.string().optional()).default({})
})

export const CurrentResourcesSchema = z.object({
  s3Buckets: z.array(z.string()).default([]),
  dynamoTables: z
    .array(
      z.object({ name: z.string(), partitionKey: z.string().default('id'), sortKey: z.string().optional() })
    )
    .default([]),
  lambdaFunctions: z.array(z.object({ name: z.string(), handler: z.string().optional(), runtime: z.string().optional() })).default([])
})

export const CurrentStackStateSchema = z.object({
  services: z.array(CurrentServiceSchema).default([]),
  resources: CurrentResourcesSchema.default({ s3Buckets: [], dynamoTables: [], lambdaFunctions: [] })
})

export type CurrentStackState = z.infer<typeof CurrentStackStateSchema>

export const ValidationIssueSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('port-conflict'), service: z.string(), requested: z.number(), assigned: z.number() }),
  z.object({ kind: z.literal('reserved-port'), service: z.string(), requested: z.number(), assigned: z.number() }),
  z.object({ kind: z.literal('missing-env'), key: z.string(), services: z.array(z.string()) })
])

export type ValidationIssue = z.infer<typeof ValidationIssueSchema>

export const ResourceOpSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('create'), resourceType: z.enum(['s3Bucket', 'dynamoTable', 'lambdaFunction']), payload: z.any() }),
  z.object({ op: z.literal('update'), resourceType: z.enum(['s3Bucket', 'dynamoTable', 'lambdaFunction']), payload: z.any() }),
  z.object({ op: z.literal('delete'), resourceType: z.enum(['s3Bucket', 'dynamoTable', 'lambdaFunction']), payload: z.any() })
])

export type ResourceOp = z.infer<typeof ResourceOpSchema>

export const ServiceOpSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('start'), name: z.string(), ports: z.array(z.number()).default([]) }),
  z.object({ op: z.literal('restart'), name: z.string(), reason: z.string().optional(), ports: z.array(z.number()).default([]) }),
  z.object({ op: z.literal('stop'), name: z.string() })
])

export type ServiceOp = z.infer<typeof ServiceOpSchema>

export const TelemetryAttachmentSchema = z.object({
  prometheus: z.boolean().default(true),
  cloudwatchLogs: z.boolean().default(true)
})

export const ApplyPlanSchema = z.object({
  blueprint: StackBlueprintSchema,
  assignedPorts: z.array(z.object({ service: z.string(), requested: z.array(z.number()), assigned: z.array(z.number()) })).default([]),
  issues: z.array(ValidationIssueSchema).default([]),
  resourceOps: z.array(ResourceOpSchema).default([]),
  serviceOps: z.array(ServiceOpSchema).default([]),
  telemetry: TelemetryAttachmentSchema.default({ prometheus: true, cloudwatchLogs: true }),
  rollbackPoints: z.array(z.object({ description: z.string() })).default([]),
  planText: z.string().default('')
})

export type ApplyPlan = z.infer<typeof ApplyPlanSchema>

export const PlannerOptionsSchema = z.object({
  reservedPorts: z.array(z.number().int().positive()).default([3200]),
  basePort: z.number().int().positive().default(4000),
  providedEnv: z.record(z.string(), z.string().optional()).default({})
})

export type PlannerOptions = z.infer<typeof PlannerOptionsSchema>
