import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'
import { neon } from '@neondatabase/serverless'
import { ENV } from '../../env'

const sql = neon(ENV.DATABASE_URL)

export const stacksRouter = router({
  // Get all stacks
  list: publicProcedure.query(async () => {
    try {
      const stacks = await sql`
        SELECT 
          id, 
          name, 
          description, 
          status, 
          services, 
          environment,
          resource_usage,
          created_at,
          updated_at
        FROM stacks
        ORDER BY created_at DESC
      `
      return stacks
    } catch (error) {
      console.error('Error fetching stacks:', error)
      return []
    }
  }),

  // Get single stack by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const stack = await sql`
          SELECT 
            s.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', ss.id,
                  'name', ss.name,
                  'type', ss.type,
                  'status', ss.status,
                  'port', ss.port,
                  'config', ss.config
                )
              ) FILTER (WHERE ss.id IS NOT NULL),
              '[]'
            ) as service_details
          FROM stacks s
          LEFT JOIN stack_services ss ON s.id = ss.stack_id
          WHERE s.id = ${input.id}
          GROUP BY s.id
        `
        return stack[0] || null
      } catch (error) {
        console.error('Error fetching stack:', error)
        return null
      }
    }),

  // Create a new stack
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      services: z.array(z.any()).default([]),
      environment: z.record(z.string(), z.string()).default({}),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await sql`
          INSERT INTO stacks (name, description, status, services, environment)
          VALUES (
            ${input.name},
            ${input.description || ''},
            'stopped',
            ${JSON.stringify(input.services)}::jsonb,
            ${JSON.stringify(input.environment)}::jsonb
          )
          RETURNING *
        `
        return { success: true, stack: result[0] }
      } catch (error) {
        console.error('Error creating stack:', error)
        return { success: false, error: 'Failed to create stack' }
      }
    }),

  // Update stack status
  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['running', 'stopped', 'deploying', 'error']),
    }))
    .mutation(async ({ input }) => {
      try {
        await sql`
          UPDATE stacks 
          SET status = ${input.status}, updated_at = NOW()
          WHERE id = ${input.id}
        `
        return { success: true }
      } catch (error) {
        console.error('Error updating stack status:', error)
        return { success: false, error: 'Failed to update status' }
      }
    }),

  // Delete a stack
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await sql`DELETE FROM stacks WHERE id = ${input.id}`
        return { success: true }
      } catch (error) {
        console.error('Error deleting stack:', error)
        return { success: false, error: 'Failed to delete stack' }
      }
    }),

  // Get stack deployments history
  getDeployments: publicProcedure
    .input(z.object({ stackId: z.string() }))
    .query(async ({ input }) => {
      try {
        const deployments = await sql`
          SELECT *
          FROM stack_deployments
          WHERE stack_id = ${input.stackId}
          ORDER BY deployed_at DESC
          LIMIT 10
        `
        return deployments
      } catch (error) {
        console.error('Error fetching deployments:', error)
        return []
      }
    }),

  // Get stack statistics
  getStats: publicProcedure.query(async () => {
    try {
      const stats = await sql`
        SELECT 
          COUNT(*) as total_stacks,
          COUNT(*) FILTER (WHERE status = 'running') as running,
          COUNT(*) FILTER (WHERE status = 'stopped') as stopped,
          COUNT(*) FILTER (WHERE status = 'error') as error
        FROM stacks
      `
      return stats[0] || { total_stacks: 0, running: 0, stopped: 0, error: 0 }
    } catch (error) {
      console.error('Error fetching stats:', error)
      return { total_stacks: 0, running: 0, stopped: 0, error: 0 }
    }
  }),
})
