import { z } from 'zod'

export const HealthProbeSchema = z.object({
  http: z
    .object({ path: z.string().default('/'), port: z.number().int().positive().optional() })
    .optional(),
  tcp: z.object({ port: z.number().int().positive() }).optional(),
  command: z.string().optional()
})

export const ServiceSchema = z.object({
  name: z.string(),
  type: z.enum(['web', 'api', 'worker']).default('api'),
  cwd: z.string().optional(),
  startCommand: z.string().optional(),
  ports: z.array(z.number().int().positive()).default([]),
  envKeys: z.array(z.string()).default([]),
  health: HealthProbeSchema.optional()
})

export const ResourceSchema = z.object({
  s3Buckets: z.array(z.string()).default([]),
  dynamoTables: z
    .array(
      z.object({
        name: z.string(),
        partitionKey: z.string().default('id'),
        sortKey: z.string().optional()
      })
    )
    .default([]),
  lambdaFunctions: z
    .array(
      z.object({
        name: z.string(),
        handler: z.string().optional(),
        runtime: z.string().optional()
      })
    )
    .default([])
})

export const StackBlueprintSchema = z.object({
  services: z.array(ServiceSchema).default([]),
  resources: ResourceSchema.default({ s3Buckets: [], dynamoTables: [], lambdaFunctions: [] }),
  ports: z.array(z.number().int().positive()).default([]),
  envKeys: z.array(z.string()).default([]),
  docker: z.object({
    dockerfile: z.boolean().default(false),
    composeFiles: z.array(z.string()).default([])
  }).default({ dockerfile: false, composeFiles: [] }),
  awsSdks: z.array(z.enum(['s3', 'dynamodb', 'lambda'])).default([])
})

export type HealthProbe = z.infer<typeof HealthProbeSchema>
export type Service = z.infer<typeof ServiceSchema>
export type ResourceSummary = z.infer<typeof ResourceSchema>
export type StackBlueprint = z.infer<typeof StackBlueprintSchema>
