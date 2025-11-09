import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'
import { neon } from '@neondatabase/serverless'
import { ENV } from '../../env'

const sql = neon(ENV.DATABASE_URL)

export const awsRouter = router({
  // Get all AWS resources summary
  getSummary: publicProcedure.query(async () => {
    const [s3Count] = await sql`SELECT COUNT(*)::int as count FROM s3_buckets`
    const [dynamoCount] = await sql`SELECT COUNT(*)::int as count FROM dynamodb_tables`
    const [lambdaCount] = await sql`SELECT COUNT(*)::int as count FROM lambda_functions`
    const [iamRoleCount] = await sql`SELECT COUNT(*)::int as count FROM iam_roles`
    const [cwLogGroupCount] = await sql`SELECT COUNT(*)::int as count FROM cloudwatch_log_groups`

    // Get total S3 storage
    const [s3Storage] = await sql`SELECT COALESCE(SUM(size_bytes), 0)::bigint as total FROM s3_buckets`
    
    // Get DynamoDB total items
    const [dynamoItems] = await sql`SELECT COALESCE(SUM(item_count), 0)::bigint as total FROM dynamodb_tables`

    // Get Lambda invocations (last 24h)
    const [lambdaInvocations] = await sql`
      SELECT COUNT(*)::int as count 
      FROM lambda_invocations 
      WHERE invoked_at > NOW() - INTERVAL '24 hours'
    `

    return {
      s3: {
        bucketCount: s3Count.count || 0,
        totalSizeBytes: Number(s3Storage.total) || 0,
      },
      dynamodb: {
        tableCount: dynamoCount.count || 0,
        totalItems: Number(dynamoItems.total) || 0,
      },
      lambda: {
        functionCount: lambdaCount.count || 0,
        invocationsLast24h: lambdaInvocations.count || 0,
      },
      iam: {
        roleCount: iamRoleCount.count || 0,
      },
      cloudwatch: {
        logGroupCount: cwLogGroupCount.count || 0,
      },
    }
  }),

  // S3 Operations
  s3: router({
    listBuckets: publicProcedure.query(async () => {
      const buckets = await sql`
        SELECT 
          id, name, region, versioning_enabled, 
          size_bytes, object_count, created_at
        FROM s3_buckets
        ORDER BY created_at DESC
      `
      return buckets
    }),

    getBucket: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        const [bucket] = await sql`
          SELECT * FROM s3_buckets WHERE name = ${input.name}
        `
        if (!bucket) throw new Error('Bucket not found')

        const objects = await sql`
          SELECT * FROM s3_objects 
          WHERE bucket_id = ${bucket.id}
          ORDER BY last_modified DESC
          LIMIT 100
        `

        return { ...bucket, objects }
      }),

    createBucket: publicProcedure
      .input(z.object({
        name: z.string(),
        region: z.string().default('us-east-1'),
        versioningEnabled: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        const [bucket] = await sql`
          INSERT INTO s3_buckets (name, region, versioning_enabled)
          VALUES (${input.name}, ${input.region}, ${input.versioningEnabled})
          RETURNING *
        `
        return bucket
      }),

    deleteBucket: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        await sql`DELETE FROM s3_buckets WHERE name = ${input.name}`
        return { success: true }
      }),
  }),

  // DynamoDB Operations
  dynamodb: router({
    listTables: publicProcedure.query(async () => {
      const tables = await sql`
        SELECT 
          id, name, status, partition_key, partition_key_type,
          sort_key, sort_key_type, item_count, size_bytes,
          read_capacity_units, write_capacity_units, created_at
        FROM dynamodb_tables
        ORDER BY created_at DESC
      `
      return tables
    }),

    getTable: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        const [table] = await sql`
          SELECT * FROM dynamodb_tables WHERE name = ${input.name}
        `
        if (!table) throw new Error('Table not found')

        const items = await sql`
          SELECT * FROM dynamodb_items 
          WHERE table_id = ${table.id}
          ORDER BY created_at DESC
          LIMIT 100
        `

        return { ...table, items }
      }),

    createTable: publicProcedure
      .input(z.object({
        name: z.string(),
        partitionKey: z.string(),
        partitionKeyType: z.enum(['S', 'N', 'B']),
        sortKey: z.string().optional(),
        sortKeyType: z.enum(['S', 'N', 'B']).optional(),
        readCapacity: z.number().default(5),
        writeCapacity: z.number().default(5),
      }))
      .mutation(async ({ input }) => {
        const [table] = await sql`
          INSERT INTO dynamodb_tables (
            name, partition_key, partition_key_type, 
            sort_key, sort_key_type,
            read_capacity_units, write_capacity_units
          )
          VALUES (
            ${input.name}, ${input.partitionKey}, ${input.partitionKeyType},
            ${input.sortKey || null}, ${input.sortKeyType || null},
            ${input.readCapacity}, ${input.writeCapacity}
          )
          RETURNING *
        `
        return table
      }),

    deleteTable: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        await sql`DELETE FROM dynamodb_tables WHERE name = ${input.name}`
        return { success: true }
      }),
  }),

  // Lambda Operations
  lambda: router({
    listFunctions: publicProcedure.query(async () => {
      const functions = await sql`
        SELECT 
          id, name, runtime, handler, code_size, memory_size,
          timeout, status, invocation_count, error_count,
          last_modified, created_at
        FROM lambda_functions
        ORDER BY created_at DESC
      `
      return functions
    }),

    getFunction: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        const [func] = await sql`
          SELECT * FROM lambda_functions WHERE name = ${input.name}
        `
        if (!func) throw new Error('Function not found')

        const recentInvocations = await sql`
          SELECT * FROM lambda_invocations 
          WHERE function_id = ${func.id}
          ORDER BY invoked_at DESC
          LIMIT 50
        `

        return { ...func, recentInvocations }
      }),

    createFunction: publicProcedure
      .input(z.object({
        name: z.string(),
        runtime: z.string(),
        handler: z.string(),
        codeSize: z.number().default(0),
        memorySize: z.number().default(128),
        timeout: z.number().default(3),
        roleArn: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const [func] = await sql`
          INSERT INTO lambda_functions (
            name, runtime, handler, code_size, memory_size, timeout, role_arn
          )
          VALUES (
            ${input.name}, ${input.runtime}, ${input.handler},
            ${input.codeSize}, ${input.memorySize}, ${input.timeout},
            ${input.roleArn || 'arn:aws:iam::000000000000:role/lambda-exec'}
          )
          RETURNING *
        `
        return func
      }),

    deleteFunction: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        await sql`DELETE FROM lambda_functions WHERE name = ${input.name}`
        return { success: true }
      }),

    invoke: publicProcedure
      .input(z.object({
        name: z.string(),
        payload: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const [func] = await sql`
          SELECT * FROM lambda_functions WHERE name = ${input.name}
        `
        if (!func) throw new Error('Function not found')

        // Simulate invocation
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const duration = Math.floor(Math.random() * 1000) + 50
        const memoryUsed = Math.floor(func.memory_size * (0.5 + Math.random() * 0.4))
        const status = Math.random() > 0.95 ? 'error' : 'success'

        const [invocation] = await sql`
          INSERT INTO lambda_invocations (
            function_id, request_id, status, duration_ms, 
            memory_used_mb, billed_duration_ms, invoked_at,
            error_message, logs
          )
          VALUES (
            ${func.id}, ${requestId}, ${status}, ${duration},
            ${memoryUsed}, ${Math.ceil(duration / 100) * 100}, NOW(),
            ${status === 'error' ? 'Simulated error' : null},
            'START RequestId: ' || ${requestId} || '\nEND RequestId: ' || ${requestId}
          )
          RETURNING *
        `

        // Update function invocation count
        await sql`
          UPDATE lambda_functions 
          SET invocation_count = invocation_count + 1,
              error_count = error_count + ${status === 'error' ? 1 : 0}
          WHERE id = ${func.id}
        `

        return invocation
      }),
  }),

  // IAM Operations
  iam: router({
    listRoles: publicProcedure.query(async () => {
      const roles = await sql`
        SELECT id, name, arn, description, created_at
        FROM iam_roles
        ORDER BY created_at DESC
      `
      return roles
    }),

    getRole: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        const [role] = await sql`
          SELECT * FROM iam_roles WHERE name = ${input.name}
        `
        if (!role) throw new Error('Role not found')

        const policies = await sql`
          SELECT p.* FROM iam_policies p
          JOIN iam_role_policies rp ON rp.policy_id = p.id
          WHERE rp.role_id = ${role.id}
        `

        return { ...role, policies }
      }),

    createRole: publicProcedure
      .input(z.object({
        name: z.string(),
        assumeRolePolicy: z.any(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const arn = `arn:aws:iam::000000000000:role/${input.name}`
        const [role] = await sql`
          INSERT INTO iam_roles (name, arn, assume_role_policy, description)
          VALUES (
            ${input.name}, ${arn}, ${JSON.stringify(input.assumeRolePolicy)},
            ${input.description || ''}
          )
          RETURNING *
        `
        return role
      }),
  }),

  // CloudWatch Operations
  cloudwatch: router({
    listLogGroups: publicProcedure.query(async () => {
      const logGroups = await sql`
        SELECT id, name, retention_days, size_bytes, created_at
        FROM cloudwatch_log_groups
        ORDER BY created_at DESC
      `
      return logGroups
    }),

    getLogGroup: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        const [logGroup] = await sql`
          SELECT * FROM cloudwatch_log_groups WHERE name = ${input.name}
        `
        if (!logGroup) throw new Error('Log group not found')

        const streams = await sql`
          SELECT * FROM cloudwatch_log_streams
          WHERE log_group_id = ${logGroup.id}
          ORDER BY created_at DESC
          LIMIT 20
        `

        return { ...logGroup, streams }
      }),

    getMetrics: publicProcedure
      .input(z.object({
        namespace: z.string(),
        metricName: z.string().optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
      }))
      .query(async ({ input }) => {
        const metrics = await sql`
          SELECT * FROM cloudwatch_metrics
          WHERE namespace = ${input.namespace}
            ${input.metricName ? sql`AND metric_name = ${input.metricName}` : sql``}
            ${input.startTime ? sql`AND timestamp >= ${input.startTime.toISOString()}` : sql``}
            ${input.endTime ? sql`AND timestamp <= ${input.endTime.toISOString()}` : sql``}
          ORDER BY timestamp DESC
          LIMIT 1000
        `
        return metrics
      }),
  }),
})
