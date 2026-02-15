import { z } from 'zod'
import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { TRPCError } from '@trpc/server'
import { AWSDetector } from '../../services/aws-detector'
import { AWSCostCalculator } from '../../services/aws-cost-calculator'
import * as path from 'path'
import * as os from 'os'

export const awsRouter = router({
  // Detect AWS services in a repository
  detectServices: secureProcedure('aws.detectServices')
    .input(
      z.object({
        projectSlug: z.string(),
        repoPath: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const repoPath = input.repoPath || path.join(os.tmpdir(), 'sarge-repos', input.projectSlug)

      const detector = new AWSDetector(repoPath)
      const result = await detector.detect()

      return {
        success: true,
        detection: result,
      }
    }),

  // Calculate cost estimates for detected services
  calculateCosts: secureProcedure('aws.calculateCosts')
    .input(
      z.object({
        services: z.array(
          z.object({
            type: z.enum(['S3', 'Lambda', 'DynamoDB', 'SQS', 'SNS', 'EventBridge', 'CloudWatch', 'IAM', 'API Gateway', 'EC2', 'RDS', 'ElastiCache']),
            name: z.string(),
            config: z.record(z.string(), z.any()),
            detectedFrom: z.array(z.string()),
          })
        ),
        usage: z
          .object({
            s3: z
              .object({
                storageGB: z.number(),
                getRequestsPerMonth: z.number(),
                putRequestsPerMonth: z.number(),
              })
              .optional(),
            lambda: z
              .object({
                invocationsPerMonth: z.number(),
                avgDurationMs: z.number(),
                memoryMB: z.number(),
              })
              .optional(),
            dynamodb: z
              .object({
                storageGB: z.number(),
                readUnitsPerMonth: z.number(),
                writeUnitsPerMonth: z.number(),
              })
              .optional(),
            sqs: z
              .object({
                requestsPerMonth: z.number(),
              })
              .optional(),
            sns: z
              .object({
                requestsPerMonth: z.number(),
              })
              .optional(),
            eventbridge: z
              .object({
                eventsPerMonth: z.number(),
              })
              .optional(),
            cloudwatch: z
              .object({
                logsIngestedGB: z.number(),
                customMetrics: z.number(),
              })
              .optional(),
          })
          .optional(),
      })
    )
    .query(({ input }) => {
      const calculator = new AWSCostCalculator()
      const estimate = calculator.calculateCosts(input.services, input.usage)

      return {
        success: true,
        estimate,
      }
    }),

  // Get all AWS resources summary
  getSummary: secureProcedure('aws.getSummary').query(async ({ ctx }) => {
    try {
      const [s3Result, dynamoResult, lambdaResult, iamResult, cwResult, s3StorageResult, dynamoItemsResult, lambdaInvocResult] = await Promise.all([
        ctx.db.query(`SELECT COUNT(*)::int as count FROM s3_buckets`),
        ctx.db.query(`SELECT COUNT(*)::int as count FROM dynamodb_tables`),
        ctx.db.query(`SELECT COUNT(*)::int as count FROM lambda_functions`),
        ctx.db.query(`SELECT COUNT(*)::int as count FROM iam_roles`),
        ctx.db.query(`SELECT COUNT(*)::int as count FROM cloudwatch_log_groups`),
        ctx.db.query(`SELECT COALESCE(SUM(size_bytes), 0)::bigint as total FROM s3_buckets`),
        ctx.db.query(`SELECT COALESCE(SUM(item_count), 0)::bigint as total FROM dynamodb_tables`),
        ctx.db.query(`SELECT COUNT(*)::int as count FROM lambda_invocations WHERE invoked_at > NOW() - INTERVAL '24 hours'`),
      ])

      return {
        s3: {
          bucketCount: s3Result.rows[0]?.count || 0,
          totalSizeBytes: Number(s3StorageResult.rows[0]?.total) || 0,
        },
        dynamodb: {
          tableCount: dynamoResult.rows[0]?.count || 0,
          totalItems: Number(dynamoItemsResult.rows[0]?.total) || 0,
        },
        lambda: {
          functionCount: lambdaResult.rows[0]?.count || 0,
          invocationsLast24h: lambdaInvocResult.rows[0]?.count || 0,
        },
        iam: {
          roleCount: iamResult.rows[0]?.count || 0,
        },
        cloudwatch: {
          logGroupCount: cwResult.rows[0]?.count || 0,
        },
      }
    } catch (err) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get AWS summary', cause: err as Error })
    }
  }),

  // S3 Operations
  s3: router({
    listBuckets: secureProcedure('aws.s3.listBuckets').query(async ({ ctx }) => {
      const result = await ctx.db.query(
        `SELECT id, name, region, versioning_enabled, size_bytes, object_count, created_at
         FROM s3_buckets ORDER BY created_at DESC`
      )
      return result.rows
    }),

    getBucket: secureProcedure('aws.s3.getBucket')
      .input(z.object({ name: z.string() }))
      .query(async ({ ctx, input }) => {
        const bucketResult = await ctx.db.query(
          `SELECT * FROM s3_buckets WHERE name = $1`, [input.name]
        )
        const bucket = bucketResult.rows[0]
        if (!bucket) throw new TRPCError({ code: 'NOT_FOUND', message: 'Bucket not found' })

        const objectsResult = await ctx.db.query(
          `SELECT * FROM s3_objects WHERE bucket_id = $1 ORDER BY last_modified DESC LIMIT 100`,
          [bucket.id]
        )
        return { ...bucket, objects: objectsResult.rows }
      }),

    createBucket: secureProcedure('aws.s3.createBucket')
      .input(z.object({
        name: z.string(),
        region: z.string().default('us-east-1'),
        versioningEnabled: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await ctx.db.query(
          `INSERT INTO s3_buckets (name, region, versioning_enabled)
           VALUES ($1, $2, $3) RETURNING *`,
          [input.name, input.region, input.versioningEnabled]
        )
        return result.rows[0]
      }),

    deleteBucket: secureProcedure('aws.s3.deleteBucket')
      .input(z.object({ name: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.query(`DELETE FROM s3_buckets WHERE name = $1`, [input.name])
        return { success: true }
      }),
  }),

  // DynamoDB Operations
  dynamodb: router({
    listTables: secureProcedure('aws.dynamodb.listTables').query(async ({ ctx }) => {
      const result = await ctx.db.query(
        `SELECT id, name, status, partition_key, partition_key_type,
                sort_key, sort_key_type, item_count, size_bytes,
                read_capacity_units, write_capacity_units, created_at
         FROM dynamodb_tables ORDER BY created_at DESC`
      )
      return result.rows
    }),

    getTable: secureProcedure('aws.dynamodb.getTable')
      .input(z.object({ name: z.string() }))
      .query(async ({ ctx, input }) => {
        const tableResult = await ctx.db.query(
          `SELECT * FROM dynamodb_tables WHERE name = $1`, [input.name]
        )
        const table = tableResult.rows[0]
        if (!table) throw new TRPCError({ code: 'NOT_FOUND', message: 'Table not found' })

        const itemsResult = await ctx.db.query(
          `SELECT * FROM dynamodb_items WHERE table_id = $1 ORDER BY created_at DESC LIMIT 100`,
          [table.id]
        )
        return { ...table, items: itemsResult.rows }
      }),

    createTable: secureProcedure('aws.dynamodb.createTable')
      .input(z.object({
        name: z.string(),
        partitionKey: z.string(),
        partitionKeyType: z.enum(['S', 'N', 'B']),
        sortKey: z.string().optional(),
        sortKeyType: z.enum(['S', 'N', 'B']).optional(),
        readCapacity: z.number().default(5),
        writeCapacity: z.number().default(5),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await ctx.db.query(
          `INSERT INTO dynamodb_tables (
            name, partition_key, partition_key_type,
            sort_key, sort_key_type,
            read_capacity_units, write_capacity_units
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [input.name, input.partitionKey, input.partitionKeyType,
          input.sortKey || null, input.sortKeyType || null,
          input.readCapacity, input.writeCapacity]
        )
        return result.rows[0]
      }),

    deleteTable: secureProcedure('aws.dynamodb.deleteTable')
      .input(z.object({ name: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.query(`DELETE FROM dynamodb_tables WHERE name = $1`, [input.name])
        return { success: true }
      }),
  }),

  // Lambda Operations
  lambda: router({
    listFunctions: secureProcedure('aws.lambda.listFunctions').query(async ({ ctx }) => {
      const result = await ctx.db.query(
        `SELECT id, name, runtime, handler, code_size, memory_size,
                timeout, status, invocation_count, error_count,
                last_modified, created_at
         FROM lambda_functions ORDER BY created_at DESC`
      )
      return result.rows
    }),

    getFunction: secureProcedure('aws.lambda.getFunction')
      .input(z.object({ name: z.string() }))
      .query(async ({ ctx, input }) => {
        const funcResult = await ctx.db.query(
          `SELECT * FROM lambda_functions WHERE name = $1`, [input.name]
        )
        const func = funcResult.rows[0]
        if (!func) throw new TRPCError({ code: 'NOT_FOUND', message: 'Function not found' })

        const invocResult = await ctx.db.query(
          `SELECT * FROM lambda_invocations WHERE function_id = $1 ORDER BY invoked_at DESC LIMIT 50`,
          [func.id]
        )
        return { ...func, recentInvocations: invocResult.rows }
      }),

    createFunction: secureProcedure('aws.lambda.createFunction')
      .input(z.object({
        name: z.string(),
        runtime: z.string(),
        handler: z.string(),
        codeSize: z.number().default(0),
        memorySize: z.number().default(128),
        timeout: z.number().default(3),
        roleArn: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await ctx.db.query(
          `INSERT INTO lambda_functions (
            name, runtime, handler, code_size, memory_size, timeout, role_arn
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [input.name, input.runtime, input.handler,
          input.codeSize, input.memorySize, input.timeout,
          input.roleArn || 'arn:aws:iam::000000000000:role/lambda-exec']
        )
        return result.rows[0]
      }),

    deleteFunction: secureProcedure('aws.lambda.deleteFunction')
      .input(z.object({ name: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.query(`DELETE FROM lambda_functions WHERE name = $1`, [input.name])
        return { success: true }
      }),

    invoke: secureProcedure('aws.lambda.invoke')
      .input(z.object({
        name: z.string(),
        payload: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const funcResult = await ctx.db.query(
          `SELECT * FROM lambda_functions WHERE name = $1`, [input.name]
        )
        const func = funcResult.rows[0]
        if (!func) throw new TRPCError({ code: 'NOT_FOUND', message: 'Function not found' })

        const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const duration = Math.floor(Math.random() * 1000) + 50
        const memoryUsed = Math.floor(func.memory_size * (0.5 + Math.random() * 0.4))
        const status = Math.random() > 0.95 ? 'error' : 'success'

        const invocResult = await ctx.db.query(
          `INSERT INTO lambda_invocations (
            function_id, request_id, status, duration_ms,
            memory_used_mb, billed_duration_ms, invoked_at,
            error_message, logs
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8) RETURNING *`,
          [func.id, requestId, status, duration,
            memoryUsed, Math.ceil(duration / 100) * 100,
          status === 'error' ? 'Invocation error' : null,
          `START RequestId: ${requestId}\nEND RequestId: ${requestId}`]
        )

        await ctx.db.query(
          `UPDATE lambda_functions
           SET invocation_count = invocation_count + 1,
               error_count = error_count + $1
           WHERE id = $2`,
          [status === 'error' ? 1 : 0, func.id]
        )

        return invocResult.rows[0]
      }),
  }),

  // IAM Operations
  iam: router({
    listRoles: secureProcedure('aws.iam.listRoles').query(async ({ ctx }) => {
      const result = await ctx.db.query(
        `SELECT id, name, arn, description, created_at FROM iam_roles ORDER BY created_at DESC`
      )
      return result.rows
    }),

    getRole: secureProcedure('aws.iam.getRole')
      .input(z.object({ name: z.string() }))
      .query(async ({ ctx, input }) => {
        const roleResult = await ctx.db.query(
          `SELECT * FROM iam_roles WHERE name = $1`, [input.name]
        )
        const role = roleResult.rows[0]
        if (!role) throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' })

        const policiesResult = await ctx.db.query(
          `SELECT p.* FROM iam_policies p
           JOIN iam_role_policies rp ON rp.policy_id = p.id
           WHERE rp.role_id = $1`,
          [role.id]
        )
        return { ...role, policies: policiesResult.rows }
      }),

    createRole: secureProcedure('aws.iam.createRole')
      .input(z.object({
        name: z.string(),
        assumeRolePolicy: z.any(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const arn = `arn:aws:iam::000000000000:role/${input.name}`
        const result = await ctx.db.query(
          `INSERT INTO iam_roles (name, arn, assume_role_policy, description)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [input.name, arn, JSON.stringify(input.assumeRolePolicy), input.description || '']
        )
        return result.rows[0]
      }),
  }),

  // CloudWatch Operations
  cloudwatch: router({
    listLogGroups: secureProcedure('aws.cloudwatch.listLogGroups').query(async ({ ctx }) => {
      const result = await ctx.db.query(
        `SELECT id, name, retention_days, size_bytes, created_at
         FROM cloudwatch_log_groups ORDER BY created_at DESC`
      )
      return result.rows
    }),

    getLogGroup: secureProcedure('aws.cloudwatch.getLogGroup')
      .input(z.object({ name: z.string() }))
      .query(async ({ ctx, input }) => {
        const lgResult = await ctx.db.query(
          `SELECT * FROM cloudwatch_log_groups WHERE name = $1`, [input.name]
        )
        const logGroup = lgResult.rows[0]
        if (!logGroup) throw new TRPCError({ code: 'NOT_FOUND', message: 'Log group not found' })

        const streamsResult = await ctx.db.query(
          `SELECT * FROM cloudwatch_log_streams WHERE log_group_id = $1 ORDER BY created_at DESC LIMIT 20`,
          [logGroup.id]
        )
        return { ...logGroup, streams: streamsResult.rows }
      }),

    getMetrics: secureProcedure('aws.cloudwatch.getMetrics')
      .input(z.object({
        namespace: z.string(),
        metricName: z.string().optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        let query = `SELECT * FROM cloudwatch_metrics WHERE namespace = $1`
        const params: any[] = [input.namespace]

        if (input.metricName) {
          params.push(input.metricName)
          query += ` AND metric_name = $${params.length}`
        }
        if (input.startTime) {
          params.push(input.startTime.toISOString())
          query += ` AND timestamp >= $${params.length}`
        }
        if (input.endTime) {
          params.push(input.endTime.toISOString())
          query += ` AND timestamp <= $${params.length}`
        }

        query += ` ORDER BY timestamp DESC LIMIT 1000`

        const result = await ctx.db.query(query, params)
        return result.rows
      }),
  }),
})
