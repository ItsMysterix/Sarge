import { z } from 'zod'
import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { TRPCError } from '@trpc/server'

export const stacksRouter = router({
  /**
   * ---
   * Example usage (tRPC mutation):
   * stacks.createFromRepo({
   *   owner: 'acme',
   *   repo: 'my-nextjs-app',
   *   branch: 'main',
   *   accessToken: 'ghp_...',
   *   name: 'Acme Next.js Stack',
   *   description: 'Stack for Acme Next.js repo'
   * })
   * Returns: { success, stack, blueprint }
   * ---
   */
  // Get all stacks
  list: secureProcedure('stacks.list').query(async ({ ctx }) => {
    try {
      const result = await ctx.db.query(`
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
      `)
      return result?.rows || []
    } catch (error) {
      console.error('[stacks.list] Error:', error)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch stacks', cause: error as Error })
    }
  }),

  // Get single stack by ID
  getById: secureProcedure('stacks.getById')
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(`
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
          WHERE s.id = $1
          GROUP BY s.id
        `, [input.id])
        return result?.rows?.[0] || null
      } catch (error) {
        console.error('[stacks.getById] Error:', error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch stack', cause: error as Error })
      }
    }),

  // Create a new stack
  create: secureProcedure('stacks.create')
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      services: z.array(z.any()).default([]),
      environment: z.record(z.string(), z.string()).default({}),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `INSERT INTO stacks (name, description, status, services, environment)
           VALUES ($1, $2, 'stopped', $3::jsonb, $4::jsonb)
           RETURNING *`,
          [input.name, input.description || '', JSON.stringify(input.services), JSON.stringify(input.environment)]
        )
        return { success: true, stack: result?.rows?.[0] }
      } catch (error) {
        console.error('[stacks.create] Error:', error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create stack', cause: error as Error })
      }
    }),

  // Update stack status
  updateStatus: secureProcedure('stacks.updateStatus')
    .input(z.object({
      id: z.string(),
      status: z.enum(['running', 'stopped', 'deploying', 'error']),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.query(
          `UPDATE stacks SET status = $1, updated_at = NOW() WHERE id = $2`,
          [input.status, input.id]
        )
        return { success: true }
      } catch (error) {
        console.error('[stacks.updateStatus] Error:', error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update status', cause: error as Error })
      }
    }),

  // Delete a stack
  delete: secureProcedure('stacks.delete')
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.query(`DELETE FROM stacks WHERE id = $1`, [input.id])
        return { success: true }
      } catch (error) {
        console.error('[stacks.delete] Error:', error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete stack', cause: error as Error })
      }
    }),

  // Get stack deployments history
  getDeployments: secureProcedure('stacks.getDeployments')
    .input(z.object({ stackId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `SELECT * FROM stack_deployments WHERE stack_id = $1 ORDER BY deployed_at DESC LIMIT 10`,
          [input.stackId]
        )
        return result?.rows || []
      } catch (error) {
        console.error('[stacks.getDeployments] Error:', error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch deployments', cause: error as Error })
      }
    }),

  // Get stack statistics
  getStats: secureProcedure('stacks.getStats').query(async ({ ctx }) => {
    try {
      const result = await ctx.db.query(`
        SELECT 
          COUNT(*) as total_stacks,
          COUNT(*) FILTER (WHERE status = 'running') as running,
          COUNT(*) FILTER (WHERE status = 'stopped') as stopped,
          COUNT(*) FILTER (WHERE status = 'error') as error
        FROM stacks
      `)
      return result?.rows?.[0] || { total_stacks: 0, running: 0, stopped: 0, error: 0 }
    } catch (error) {
      console.error('[stacks.getStats] Error:', error)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch stats', cause: error as Error })
    }
  }),

  /**
   * Create a stack from connected repository metadata/services
   * Usage: stacks.createFromRepo({ owner, repo, branch, accessToken, name?, description? })
   * This analyzes the repo using GitHubScanner and creates a stack with detected services.
   */
  createFromRepo: secureProcedure('stacks.createFromRepo')
    .input(z.object({
      owner: z.string(),
      repo: z.string(),
      branch: z.string().default('main'),
      accessToken: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Dynamically import GitHubScanner
        const { createGitHubScanner } = require('../../services/github-scanner')
        const scanner = createGitHubScanner(input.accessToken, !!process.env.ANTHROPIC_API_KEY)
        // Analyze repo for services and metadata
        const blueprint = await scanner.scanRepository(input.owner, input.repo, input.branch)

        // Prepare stack fields
        const stackName = input.name || `${input.owner}/${input.repo} Stack`
        const stackDescription = input.description || `Stack generated from ${input.owner}/${input.repo}@${input.branch}`
        const services = blueprint.services || []
        const environment: Record<string, string> = {}
        if (Array.isArray(blueprint.envKeys)) {
          blueprint.envKeys.forEach((key: string) => { environment[key] = '' })
        }

        // Insert stack into DB
        const result = await ctx.db.query(
          `INSERT INTO stacks (name, description, status, services, environment)
             VALUES ($1, $2, 'stopped', $3::jsonb, $4::jsonb)
             RETURNING *`,
          [stackName, stackDescription, JSON.stringify(services), JSON.stringify(environment)]
        )
        return { success: true, stack: result?.rows?.[0], blueprint }
      } catch (error) {
        console.error('[stacks.createFromRepo] Error:', error)
        const details = (error instanceof Error && error.message) ? error.message : String(error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create stack from repo: ' + details, cause: error as Error })
      }
    }),
})
