import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'

/**
 * Audit Logs Router
 * 
 * Provides access to the system's security and operation audit trail.
 */

export const auditLogsRouter = router({
    // List audit logs with filtering and pagination
    list: secureProcedure('audit.list')
        .input(z.object({
            projectId: z.string().optional(),
            resourceType: z.string().optional(),
            action: z.string().optional(),
            userId: z.string().optional(),
            limit: z.number().min(1).max(100).default(50),
            cursor: z.string().optional(), // For pagination (created_at)
        }))
        .query(async ({ ctx, input }) => {
            try {
                const params: any[] = []
                let query = `
          SELECT id, action, resource_type, resource_id, user_id, metadata, created_at
          FROM audit_logs
          WHERE 1=1
        `

                if (input.projectId) {
                    // Metadata often contains project_id, but it's unstructured JSON.
                    // Ideally we'd have a project_id column, but migration only has metadata.
                    // We can use JSON containment operator @> if using Postgres, 
                    // or simple text filtering for now as a fallback.
                    query += ` AND (metadata->>'projectId' = $${params.length + 1} OR metadata->>'project_id' = $${params.length + 1} OR metadata::text ILIKE $${params.length + 1})`
                    params.push(input.projectId)
                }

                if (input.resourceType) {
                    query += ` AND resource_type = $${params.length + 1}`
                    params.push(input.resourceType)
                }

                if (input.action) {
                    query += ` AND action = $${params.length + 1}`
                    params.push(input.action)
                }

                if (input.userId) {
                    query += ` AND user_id = $${params.length + 1}`
                    params.push(input.userId)
                }

                if (input.cursor) {
                    query += ` AND created_at < $${params.length + 1}`
                    params.push(input.cursor)
                }

                query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`
                params.push(input.limit + 1) // Fetch one extra to check for next page

                const result = await ctx.db.query(query, params).catch((err: any) => {
                    if (err?.message?.includes('audit_logs')) {
                        return { rows: [] }
                    }
                    throw err
                })

                const rows = result?.rows || []
                let nextCursor: string | undefined = undefined

                if (rows.length > input.limit) {
                    const nextItem = rows.pop()
                    nextCursor = nextItem?.created_at?.toISOString()
                }

                return {
                    items: rows.map((row: any) => ({
                        id: row.id,
                        action: row.action,
                        resourceType: row.resource_type,
                        resourceId: row.resource_id,
                        userId: row.user_id,
                        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
                        createdAt: row.created_at,
                    })),
                    nextCursor,
                }
            } catch (err) {
                console.error('[audit.list] Error:', err)
                return { items: [], nextCursor: undefined }
            }
        }),

    // Get distinct filter options
    getFilters: secureProcedure('audit.filters')
        .query(async ({ ctx }) => {
            try {
                const types = await ctx.db.query(`SELECT DISTINCT resource_type FROM audit_logs ORDER BY resource_type`).catch(() => ({ rows: [] }))
                const actions = await ctx.db.query(`SELECT DISTINCT action FROM audit_logs ORDER BY action`).catch(() => ({ rows: [] }))

                return {
                    resourceTypes: types?.rows?.map((r: any) => r.resource_type) || [],
                    actions: actions?.rows?.map((r: any) => r.action) || [],
                }
            } catch (err) {
                return { resourceTypes: [], actions: [] }
            }
        }),
})
