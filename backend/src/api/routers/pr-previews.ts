import { router, publicProcedure } from '../../trpc'
import { TRPCError } from '@trpc/server'
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
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch PR previews', cause: err as Error })
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
        clone_url: z.string(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const [owner, repo] = input.repository.full_name.split('/')
      const projectId = `${owner}-${repo}`

      console.log(`[PR Preview] Webhook: ${input.action} for PR #${input.pull_request.number}`)

      try {
        if (input.action === 'opened' || input.action === 'synchronize' || input.action === 'reopened') {
          // 1. Create or update preview record
          const existing = await ctx.db.query(
            `SELECT id, deployment_id, provider_id FROM pr_previews 
             WHERE project_id = $1 AND pr_number = $2`,
            [projectId, input.pull_request.number]
          ).catch(() => ({ rows: [] }))

          let previewId: string;
          let providerId = 'local';

          if (existing?.rows?.[0]) {
            previewId = existing.rows[0].id;
            providerId = existing.rows[0].provider_id || 'local';
            await ctx.db.query(
              `UPDATE pr_previews 
               SET status = 'building', commit_sha = $1, updated_at = NOW()
               WHERE id = $2`,
              [input.pull_request.head.sha, previewId]
            ).catch(() => { })
          } else {
            const result = await ctx.db.query(
              `INSERT INTO pr_previews (
                project_id, provider_id, pr_number, pr_title, pr_author,
                branch, commit_sha, status, auto_cleanup, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'building', true, NOW(), NOW())
              RETURNING id`,
              [
                projectId,
                'local', // Should be dynamic based on project settings
                input.pull_request.number,
                input.pull_request.title,
                input.pull_request.user.login,
                input.pull_request.head.ref,
                input.pull_request.head.sha
              ]
            ).catch((err: any) => {
              throw new Error('Failed to create PR preview record: ' + (err?.message || 'Unknown error'))
            })
            previewId = result.rows[0].id;
          }

          // 2. Trigger Actual Deployment (The "Enterprise" Part)
          const provider = getProvider(providerId);
          if (provider) {
            console.log(`[PR Preview] Triggering ${providerId} deploy for PR #${input.pull_request.number}`);

            // In a real scenario, we'd fetch actual project-linked credentials
            const credentials = await getProviderCredentials(providerId, ctx.db, "system").catch(() => ({}));

            const deployResult = await provider.deploy({
              projectId,
              repoUrl: input.repository.clone_url,
              branch: input.pull_request.head.ref,
              commit: input.pull_request.head.sha,
              environmentName: 'preview',
              credentials,
              env: { PR_NUMBER: input.pull_request.number.toString() }
            });

            if (deployResult.success) {
              await ctx.db.query(
                `UPDATE pr_previews 
                 SET deployment_id = $1, preview_url = $2, status = 'ready', updated_at = NOW()
                 WHERE id = $3`,
                [deployResult.deploymentId, deployResult.previewUrl, previewId]
              ).catch(() => { });

              // 3. Post Back to GitHub (Simulated)
              await postGithubStatus(owner, repo, input.pull_request.number, deployResult.previewUrl!);
            } else {
              await ctx.db.query(
                `UPDATE pr_previews SET status = 'failed', updated_at = NOW() WHERE id = $1`,
                [previewId]
              ).catch(() => { });
            }
          }

          return { message: 'Preview environment sync started', previewId }
        } else if (input.action === 'closed') {
          // 1. Mark as closed
          const preview = await ctx.db.query(
            `SELECT id, deployment_id, provider_id FROM pr_previews 
             WHERE project_id = $1 AND pr_number = $2`,
            [projectId, input.pull_request.number]
          ).catch(() => ({ rows: [] }))

          if (preview?.rows?.[0]) {
            const pr = preview.rows[0];
            await ctx.db.query(
              `UPDATE pr_previews 
               SET status = 'closed', closed_at = NOW(), updated_at = NOW()
               WHERE id = $1`,
              [pr.id]
            ).catch(() => { })

            // 2. Cleanup Resources
            const provider = getProvider(pr.provider_id || 'local');
            if (provider && (provider as any).destroy) {
              console.log(`[PR Preview] Cleaning up resources for PR #${input.pull_request.number}`);
              await (provider as any).destroy({
                projectId,
                deploymentId: pr.deployment_id
              }).catch((e: any) => console.error('[PR Preview] Cleanup failed:', e));
            }

            return { message: 'Preview environment cleanup started', previewId: pr.id }
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
          ).catch(() => { })

          return {
            success: true,
            previewUrl: deployResult.previewUrl,
            deploymentId: deployResult.deploymentId,
          }
        } else {
          await ctx.db.query(
            `UPDATE pr_previews SET status = 'failed', updated_at = NOW() WHERE id = $1`,
            [pr.id]
          ).catch(() => { })

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

        // Destroy deployment if provider supports it
        const provider = getProvider(pr.provider_id || 'local')
        if (provider && (provider as any).destroy) {
          await (provider as any).destroy({
            projectId: pr.project_id,
            deploymentId: pr.deployment_id
          })
        }

        // Mark as closed
        await ctx.db.query(
          `UPDATE pr_previews 
           SET status = 'closed', closed_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [input.previewId]
        ).catch(() => { })

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
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch PR preview', cause: err as Error })
      }
    }),
})

// --- Helpers ---

/**
 * Post a comment to the GitHub PR with the preview URL
 */
async function postGithubStatus(owner: string, repo: string, prNumber: number, url: string) {
  console.log(`[GitHub API] Posting preview URL to ${owner}/${repo} PR #${prNumber}: ${url}`);

  // In a real implementation:
  // await githubApp.octokit.rest.issues.createComment({
  //   owner, repo, issue_number: prNumber,
  //   body: `🚀 SARGE Preview Environment is ready!\n\n**URL**: [${url}](${url})`
  // });

  return Promise.resolve();
}
