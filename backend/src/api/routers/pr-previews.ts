import { router, publicProcedure } from '../../trpc'
import { TRPCError } from '@trpc/server'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { getProvider } from '../lib/providers'
import { getProviderCredentials } from '../lib/credentials'
import logger from '../../lib/logger'

const prLogger = logger.child({ module: 'pr-previews' })

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
            prLogger.warn('[pr.list] Table not migrated yet')
            return { rows: [] }
          }
          throw err
        })

        return result?.rows || []
      } catch (err) {
        prLogger.error({ err, input }, '[pr.list] Error')
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

      // Look up user_id from the database to find who connected this repository
      const projectResult = await ctx.db.query(
        "SELECT user_id FROM projects WHERE repository_id = $1 OR slug = $2",
        [input.repository.full_name, projectId]
      ).catch(() => ({ rows: [] }));

      const userId = projectResult.rows?.[0]?.user_id;

      prLogger.info({ action: input.action, prNumber: input.pull_request.number, projectId, userId }, '[PR Preview] Webhook received')

      try {
        if (input.action === 'opened' || input.action === 'synchronize' || input.action === 'reopened') {
          // 1. Create or update preview record
          const existing = await ctx.db.query(
            `SELECT id, deployment_id, provider_id FROM pr_previews 
             WHERE project_id = $1 AND pr_number = $2`,
            [projectId, input.pull_request.number]
          ).catch((err) => {
            prLogger.error({ msg: 'Failed to fetch existing PR preview', projectId, prNumber: input.pull_request.number, err });
            return { rows: [] };
          })

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
            ).catch((err) => {
              prLogger.error({ msg: 'Failed to update PR preview status to building', previewId, err });
            })
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
            prLogger.info({ providerId, prNumber: input.pull_request.number }, '[PR Preview] Triggering deploy');

            // Fetch actual project-linked credentials via Nango
            const credentials = await getProviderCredentials(providerId, ctx.db, userId).catch(() => ({}));

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
              ).catch((err) => {
                prLogger.error({ msg: 'Failed to mark PR preview as ready', previewId, err });
              });

              // 3. Post Back to GitHub via Nango using the Project Owner's credentials
              await postGithubStatus(owner, repo, input.pull_request.number, deployResult.previewUrl!, userId);
            } else {
              await ctx.db.query(
                `UPDATE pr_previews SET status = 'failed', updated_at = NOW() WHERE id = $1`,
                [previewId]
              ).catch((err) => {
                prLogger.error({ msg: 'Failed to mark PR preview as failed', previewId, err });
              });
            }
          }

          return { message: 'Preview environment sync started', previewId }
        } else if (input.action === 'closed') {
          // 1. Mark as closed
          const preview = await ctx.db.query(
            `SELECT id, deployment_id, provider_id FROM pr_previews 
             WHERE project_id = $1 AND pr_number = $2`,
            [projectId, input.pull_request.number]
          ).catch((err) => {
            prLogger.error({ msg: 'Failed to fetch PR preview for closing', projectId, prNumber: input.pull_request.number, err });
            return { rows: [] };
          })

          if (preview?.rows?.[0]) {
            const pr = preview.rows[0];
            await ctx.db.query(
              `UPDATE pr_previews 
               SET status = 'closed', closed_at = NOW(), updated_at = NOW()
               WHERE id = $1`,
              [pr.id]
            ).catch((err) => {
              prLogger.error({ msg: 'Failed to mark PR preview as closed', previewId: pr.id, err });
            })

            // 2. Cleanup Resources
            const provider = getProvider(pr.provider_id || 'local');
            if (provider && (provider as any).destroy) {
              prLogger.info({ prNumber: input.pull_request.number }, '[PR Preview] Cleaning up resources');
              await (provider as any).destroy({
                projectId,
                deploymentId: pr.deployment_id
              }).catch((e: any) => prLogger.error({ err: e, prNumber: input.pull_request.number }, '[PR Preview] Cleanup failed'));
            }

            return { message: 'Preview environment cleanup started', previewId: pr.id }
          }
        }

        return { message: 'Webhook processed' }
      } catch (err) {
        prLogger.error({ err }, '[PR Preview] Webhook error')
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
        ).catch((err) => {
          prLogger.error({ msg: 'Failed to fetch PR preview for manual deploy', projectId: input.projectId, prNumber: input.prNumber, err });
          return { rows: [] };
        })

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
          ).catch((err) => {
            prLogger.error({ msg: 'Failed to update PR preview deployment info', previewId: pr.id, err });
          })

          return {
            success: true,
            previewUrl: deployResult.previewUrl,
            deploymentId: deployResult.deploymentId,
          }
        } else {
          await ctx.db.query(
            `UPDATE pr_previews SET status = 'failed', updated_at = NOW() WHERE id = $1`,
            [pr.id]
          ).catch((err) => {
            prLogger.error({ msg: 'Failed to mark PR preview as failed after manual deploy', previewId: pr.id, err });
          })

          throw new Error(deployResult.error || 'Deployment failed')
        }
      } catch (err) {
        prLogger.error({ err, input }, '[pr.deploy] Error')
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
        ).catch((err) => {
          prLogger.error({ msg: 'Failed to fetch PR preview for manual cleanup', previewId: input.previewId, err });
          return { rows: [] };
        })

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
        ).catch((err) => {
          prLogger.error({ msg: 'Failed to mark PR preview as closed after manual cleanup', previewId: input.previewId, err });
        })

        return { success: true }
      } catch (err) {
        prLogger.error({ err, input }, '[pr.cleanup] Error')
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
        prLogger.error({ err, input }, '[pr.get] Error')
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch PR preview', cause: err as Error })
      }
    }),
})

// --- Helpers ---

/**
 * Post a comment to the GitHub PR with the preview URL
 */
async function postGithubStatus(owner: string, repo: string, prNumber: number, url: string, userId?: string) {
  prLogger.info({ owner, repo, prNumber, url }, '[GitHub API] Posting preview URL to PR');

  if (!userId || !process.env.NANGO_SECRET_KEY) {
    prLogger.warn('[GitHub API] Skipping PR comment: Missing userId or NANGO_SECRET_KEY');
    return;
  }

  try {
    const { Nango } = await import('@nangohq/node');
    const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY });

    // Ensure user has a GitHub connection before trying to proxy the request
    const connection = await nango.getConnection('github', userId);
    if (!connection) {
      prLogger.warn('[GitHub API] User has not connected GitHub via Nango. Cannot post comment.');
      return;
    }

    // Proxy the request through Nango directly to GitHub's REST API using the user's fresh OAuth token
    await nango.proxy({
      connectionId: userId,
      providerConfigKey: 'github',
      retries: 2,
      endpoint: `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      data: {
        body: `🚀 **SARGE Preview Environment Deployed!**\n\nThe preview for this PR is running at:\n[${url}](${url})\n\n*(Automatically provisioned via Sarge CI)*`
      },
      method: "POST"
    });

    prLogger.info('[GitHub API] Successfully posted preview comment to GitHub via Nango');
  } catch (error: any) {
    prLogger.error({ err: error?.message || error }, '[GitHub API] Failed to post PR comment via Nango');
  }
}
