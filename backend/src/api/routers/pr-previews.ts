import { router, publicProcedure } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { getProvider } from '../lib/providers'
import { getProviderCredentials } from '../lib/credentials'

/**
 * PR Previews Router
 * 
 * Handles GitHub Pull Request preview environments:
 * - Auto-deploy on PR open/update
 * - Auto-cleanup on PR close/merge
 * - Status updates back to GitHub
 */

export const prPreviewsRouter = router({
  // List all PR previews for a project
  list: secureProcedure('pr.list')
    .input(z.object({
      projectId: z.string(),
      status: z.enum(['pending', 'building', 'ready', 'failed', 'closed']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        let query = `SELECT * FROM pr_previews WHERE project_id = $1`
        const params: any[] = [input.projectId]

        if (input.status) {
          params.push(input.status)
          query += ` AND status = $${params.length}`
        }

        query += ` ORDER BY created_at DESC LIMIT 50`

        const result = await ctx.db.query(query, params).catch((err: any) => {
          if (err?.message?.includes('pr_previews')) {
            console.log('[pr.list] Table not migrated yet')
            return { rows: [] }
          }
          throw err
        })

        return result?.rows || []
      } catch (err) {
        console.error('[pr.list] Error:', err)
        return []
      }
    }),

  // GitHub webhook handler (public endpoint)
  githubWebhook: publicProcedure
    .input(z.object({
      action: z.enum(['opened', 'synchronize', 'closed', 'reopened']),
      pull_request: z.object({
        number: z.number(),
        title: z.string(),
        head: z.object({
          ref: z.string(),
          sha: z.string(),
        }),
        user: z.object({
          login: z.string(),
        }),
      }),
      repository: z.object({
        full_name: z.string(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const [owner, repo] = input.repository.full_name.split('/')
      const projectId = `${owner}-${repo}`
      
      console.log(`[PR Preview] Webhook: ${input.action} for PR #${input.pull_request.number}`)

      try {
        if (input.action === 'opened' || input.action === 'synchronize' || input.action === 'reopened') {
          // Create or update preview environment
          const existing = await ctx.db.query(
            `SELECT id, deployment_id FROM pr_previews 
             WHERE project_id = $1 AND pr_number = $2`,
            [projectId, input.pull_request.number]
          ).catch(() => ({ rows: [] }))

          if (existing?.rows?.[0]) {
            // Update existing preview
            await ctx.db.query(
              `UPDATE pr_previews 
               SET status = 'building', commit_sha = $1, updated_at = NOW()
               WHERE id = $2`,
              [input.pull_request.head.sha, existing.rows[0].id]
            ).catch(() => {})

            return { message: 'Preview environment updating', previewId: existing.rows[0].id }
          } else {
            // Create new preview
            const result = await ctx.db.query(
              `INSERT INTO pr_previews (
                project_id, provider_id, pr_number, pr_title, pr_author,
                branch, commit_sha, status, auto_cleanup, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'building', true, NOW(), NOW())
              RETURNING id`,
              [
                projectId,
                'local', // Default to local provider, can be configured per project
                input.pull_request.number,
                input.pull_request.title,
                input.pull_request.user.login,
                input.pull_request.head.ref,
                input.pull_request.head.sha
              ]
            ).catch((err: any) => {
              if (err?.message?.includes('pr_previews')) {
                console.warn('[PR Preview] Table not migrated yet')
                return { rows: [{ id: `pr-${Date.now()}` }] }
              }
              throw err
            })

            // TODO: Trigger actual deployment via provider
            // This would call the deploy router with the PR branch
            
            return { message: 'Preview environment created', previewId: result.rows[0].id }
          }
        } else if (input.action === 'closed') {
          // Clean up preview environment
          const preview = await ctx.db.query(
            `SELECT id, deployment_id, provider_id FROM pr_previews 
             WHERE project_id = $1 AND pr_number = $2 AND auto_cleanup = true`,
            [projectId, input.pull_request.number]
          ).catch(() => ({ rows: [] }))

          if (preview?.rows?.[0]) {
            // Mark as closed
            await ctx.db.query(
              `UPDATE pr_previews 
               SET status = 'closed', closed_at = NOW(), updated_at = NOW()
               WHERE id = $1`,
              [preview.rows[0].id]
            ).catch(() => {})

            // TODO: Call provider to destroy the deployment
            // This would call provider.destroy(deploymentId)

            return { message: 'Preview environment cleaned up', previewId: preview.rows[0].id }
          }
        }

        return { message: 'Webhook processed' }
      } catch (err) {
        console.error('[PR Preview] Webhook error:', err)
        throw err
      }
    }),

  // Manually trigger PR preview deployment
  deploy: secureProcedure('pr.deploy')
    .input(z.object({
      projectId: z.string(),
      prNumber: z.number(),
      providerId: z.string().default('local'),
      repoUrl: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get PR info
        const preview = await ctx.db.query(
          `SELECT * FROM pr_previews 
           WHERE project_id = $1 AND pr_number = $2`,
          [input.projectId, input.prNumber]
        ).catch(() => ({ rows: [] }))

        if (!preview?.rows?.[0]) {
          throw new Error('PR preview not found')
        }

        const pr = preview.rows[0]
        const provider = getProvider(input.providerId)
        
        if (!provider) {
          throw new Error(`Provider ${input.providerId} not supported`)
        }

        // Get credentials
        const credentials = await getProviderCredentials(input.providerId, ctx.db, (ctx as any).userId)

        // Deploy the PR branch
        const deployResult = await provider.deploy({
          projectId: input.projectId,
          repoUrl: input.repoUrl,
          branch: pr.branch,
          commit: pr.commit_sha,
          environmentName: 'preview',
          credentials,
          env: { PR_NUMBER: pr.pr_number.toString() },
        })

        if (deployResult.success) {
          // Update preview with deployment info
          await ctx.db.query(
            `UPDATE pr_previews 
             SET deployment_id = $1, preview_url = $2, status = 'ready', updated_at = NOW()
             WHERE id = $3`,
            [deployResult.deploymentId, deployResult.previewUrl, pr.id]
          ).catch(() => {})

          return {
            success: true,
            previewUrl: deployResult.previewUrl,
            deploymentId: deployResult.deploymentId,
          }
        } else {
          await ctx.db.query(
            `UPDATE pr_previews SET status = 'failed', updated_at = NOW() WHERE id = $1`,
            [pr.id]
          ).catch(() => {})

          throw new Error(deployResult.error || 'Deployment failed')
        }
      } catch (err) {
        console.error('[pr.deploy] Error:', err)
        throw err
      }
    }),

  // Manually cleanup a PR preview
  cleanup: secureProcedure('pr.cleanup')
    .input(z.object({
      previewId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const preview = await ctx.db.query(
          `SELECT * FROM pr_previews WHERE id = $1`,
          [input.previewId]
        ).catch(() => ({ rows: [] }))

        if (!preview?.rows?.[0]) {
          throw new Error('Preview not found')
        }

        const pr = preview.rows[0]

        // TODO: Call provider to destroy deployment
        // const provider = getProvider(pr.provider_id)
        // await provider.destroy({ deploymentId: pr.deployment_id })

        // Mark as closed
        await ctx.db.query(
          `UPDATE pr_previews 
           SET status = 'closed', closed_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [input.previewId]
        ).catch(() => {})

        return { success: true }
      } catch (err) {
        console.error('[pr.cleanup] Error:', err)
        throw err
      }
    }),

  // Get details for a specific PR preview
  get: secureProcedure('pr.get')
    .input(z.object({
      projectId: z.string(),
      prNumber: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `SELECT * FROM pr_previews 
           WHERE project_id = $1 AND pr_number = $2`,
          [input.projectId, input.prNumber]
        ).catch((err: any) => {
          if (err?.message?.includes('pr_previews')) {
            return { rows: [] }
          }
          throw err
        })

        return result?.rows?.[0] || null
      } catch (err) {
        console.error('[pr.get] Error:', err)
        return null
      }
    }),
})
