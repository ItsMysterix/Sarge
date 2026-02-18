import { z } from 'zod';
import { router } from '../../trpc';
import { secureProcedure } from '../trpc/middlewares/security';
import { TRPCError } from '@trpc/server';
import { getAIAnalyzer } from '../lib/ai-analyzer';

// Project schema for validation
const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  framework: z.string().optional(),
  repositoryId: z.string().optional(),
  rootDirectory: z.string().default('./'),
  buildCommand: z.string().default('npm run build'),
  outputDirectory: z.string().default('.next'),
  installCommand: z.string().default('npm install'),
  devCommand: z.string().default('npm run dev'),
  autoDeploy: z.boolean().default(true),
  autoDeployBranch: z.string().default('main'),
  previewDeployments: z.boolean().default(true),
});

const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  framework: z.string().optional(),
  rootDirectory: z.string().optional(),
  buildCommand: z.string().optional(),
  outputDirectory: z.string().optional(),
  installCommand: z.string().optional(),
  devCommand: z.string().optional(),
  autoDeploy: z.boolean().optional(),
  autoDeployBranch: z.string().optional(),
  previewDeployments: z.boolean().optional(),
  status: z.enum(['active', 'paused', 'archived', 'pending']).optional(),
});

const projectSettingsSchema = z.object({
  projectId: z.string().uuid(),
  functionRegion: z.string().optional(),
  functionMemory: z.number().optional(),
  functionTimeout: z.number().optional(),
  functionRuntime: z.string().optional(),
  enableEdge: z.boolean().optional(),
  enableAnalytics: z.boolean().optional(),
  enableSpeedInsights: z.boolean().optional(),
  enableCaching: z.boolean().optional(),
  enableWaf: z.boolean().optional(),
  passwordProtection: z.boolean().optional(),
  nodeVersion: z.string().optional(),
});

export const projectRouter = router({
  // List all projects for current user
  list: secureProcedure('project.list').query(async ({ ctx }) => {
    const userId = (ctx as any).userId;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }

    try {
      const result = await ctx.db.query(
        `SELECT 
          p.*,
          (SELECT COUNT(*) FROM deployments d WHERE d.project_id = p.id) as deployment_count,
          (SELECT MAX(created_at) FROM deployments d WHERE d.project_id = p.id) as last_deployed_at
         FROM projects p
         WHERE p.user_id = $1
         ORDER BY p.created_at DESC`,
        [userId]
      );

      return { projects: result.rows }
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch projects', cause: error as Error });
    }
  }),

  // Get project by ID
  getById: secureProcedure('project.getById')
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      try {
        const result = await ctx.db.query(
          `SELECT 
             p.*,
             (SELECT COUNT(*) FROM deployments d WHERE d.project_id = p.id) as deployment_count,
             (SELECT MAX(created_at) FROM deployments d WHERE d.project_id = p.id) as last_deployed_at
           FROM projects p
           WHERE p.id = $1 AND p.user_id = $2`,
          [input.id, userId]
        );

        const row = result.rows?.[0]
        if (!row) return null
        return {
          id: row.id,
          userId: row.user_id,
          name: row.name,
          slug: row.slug,
          description: row.description ?? undefined,
          framework: row.framework ?? undefined,
          repositoryId: row.repository_id ?? undefined,
          rootDirectory: row.root_directory ?? './',
          buildCommand: row.build_command ?? 'npm run build',
          outputDirectory: row.output_directory ?? '.next',
          installCommand: row.install_command ?? 'npm install',
          devCommand: row.dev_command ?? 'npm run dev',
          autoDeploy: !!row.auto_deploy,
          autoDeployBranch: row.auto_deploy_branch ?? 'main',
          previewDeployments: !!row.preview_deployments,
          status: (row.status ?? 'active') as 'active' | 'paused' | 'archived' | 'pending',
          lastDeployedAt: row.last_deployed_at ?? null,
          deploymentCount: Number(row.deployment_count ?? 0),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }
      } catch (error) {
        console.error('[project.getById] error:', error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch project', cause: error as Error });
      }
    }),

  // Get project by slug
  getBySlug: secureProcedure('project.getBySlug')
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      try {
        const result = await ctx.db.query(
          `SELECT 
             p.*,
             (SELECT COUNT(*) FROM deployments d WHERE d.project_id = p.id) as deployment_count,
             (SELECT MAX(created_at) FROM deployments d WHERE d.project_id = p.id) as last_deployed_at
           FROM projects p
           WHERE p.slug = $1 AND p.user_id = $2`,
          [input.slug, userId]
        );

        const row = result.rows?.[0]
        if (!row) return null
        return {
          id: row.id,
          userId: row.user_id,
          name: row.name,
          slug: row.slug,
          description: row.description ?? undefined,
          framework: row.framework ?? undefined,
          repositoryId: row.repository_id ?? undefined,
          rootDirectory: row.root_directory ?? './',
          buildCommand: row.build_command ?? 'npm run build',
          outputDirectory: row.output_directory ?? '.next',
          installCommand: row.install_command ?? 'npm install',
          devCommand: row.dev_command ?? 'npm run dev',
          autoDeploy: !!row.auto_deploy,
          autoDeployBranch: row.auto_deploy_branch ?? 'main',
          previewDeployments: !!row.preview_deployments,
          status: (row.status ?? 'active') as 'active' | 'paused' | 'archived' | 'pending',
          lastDeployedAt: row.last_deployed_at ?? null,
          deploymentCount: Number(row.deployment_count ?? 0),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }
      } catch (error) {
        console.error('[project.getBySlug] error:', error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch project', cause: error as Error });
      }
    }),

  // Create new project
  create: secureProcedure('project.create')
    .input(createProjectSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to create a project',
        });
      }

      try {
        let detectedInfo: any = {}

        // Auto-generate slug if not provided matches system-generated requirement
        let finalSlug = input.slug;
        if (!finalSlug) {
          const baseSlug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          finalSlug = `${baseSlug}-${randomSuffix}`;
        }

        // Optional: Run AI detection if repositoryId provided
        if (input.repositoryId) {
          try {
            const modName = ['sarge', '-', 'core'].join('')
            // Use try/catch for the require as well
            const core = require(modName)
            if (core && core.detector) {
              const detection = await core.detector.detectStack(input.repositoryId)
              detectedInfo = {
                detected_framework: detection.name,
                detected_package_manager: detection.packageManager,
                detected_languages: detection.languages || [],
                ai_detected_ports: detection.ports || [],
                ai_detected_tools: detection.tools || [],
                ai_analysis_summary: detection.summary || '',
                ai_analyzed_at: new Date().toISOString(),
              }
            }
          } catch (err) {
            console.error('[project.create] AI detection failed (non-fatal):', err)
            // Continue without detection info
          }
        }

        const result = await ctx.db.query(
          `INSERT INTO projects (
            user_id, name, slug, description,
            repository_id, framework, detected_framework, detected_package_manager,
            detected_languages, build_command, dev_command, install_command,
            root_directory, output_directory,
            auto_deploy, auto_deploy_branch, preview_deployments,
            ai_detected_ports, ai_detected_tools,
            ai_analysis_summary, ai_analyzed_at, status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
          ) RETURNING *`,
          [
            userId,
            input.name,
            finalSlug,
            input.description || null,
            input.repositoryId || null,
            input.framework || null,
            detectedInfo.detected_framework || null,
            detectedInfo.detected_package_manager || null,
            JSON.stringify(detectedInfo.detected_languages || []),
            input.buildCommand || null,
            input.devCommand || null,
            input.installCommand || null,
            input.rootDirectory || './',
            input.outputDirectory || '.next',
            input.autoDeploy,
            input.autoDeployBranch,
            input.previewDeployments,
            JSON.stringify(detectedInfo.ai_detected_ports || []),
            JSON.stringify(detectedInfo.ai_detected_tools || []),
            detectedInfo.ai_analysis_summary || null,
            detectedInfo.ai_analyzed_at || null,
            'active',
          ]
        )

        if (!result || !result.rows || result.rows.length === 0) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create project record' });
        }

        const project = result.rows[0]

        // Activity and Notification logging should not block project return if they fail
        try {
          // Log activity
          await ctx.db.query(
            `INSERT INTO project_activity (project_id, user_id, action, details)
             VALUES ($1, $2, $3, $4)`,
            [
              project.id,
              userId,
              'created',
              JSON.stringify({ name: input.name, repository_id: input.repositoryId }),
            ]
          )

          // Add notification
          await ctx.db.query(
            `INSERT INTO notifications (user_id, title, message, type)
             VALUES ($1, $2, $3, $4)`,
            [
              userId,
              'Project Created',
              `Project "${input.name}" has been created successfully.`,
              'success'
            ]
          )
        } catch (logErr) {
          console.error('[project.create] Failed to log activity/notification (non-fatal):', logErr)
        }

        return project
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        console.error('Error creating project:', error)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Failed to create project: ${error.message}` });
      }
    }),

  // Update project
  update: secureProcedure('project.update')
    .input(updateProjectSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const { id, ...updates } = input;

      // Build dynamic UPDATE query from provided fields
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      const fieldMap: Record<string, string> = {
        name: 'name',
        description: 'description',
        framework: 'framework',
        rootDirectory: 'root_directory',
        buildCommand: 'build_command',
        outputDirectory: 'output_directory',
        installCommand: 'install_command',
        devCommand: 'dev_command',
        autoDeploy: 'auto_deploy',
        autoDeployBranch: 'auto_deploy_branch',
        previewDeployments: 'preview_deployments',
        status: 'status',
      };

      for (const [key, dbCol] of Object.entries(fieldMap)) {
        if ((updates as any)[key] !== undefined) {
          setClauses.push(`${dbCol} = $${paramIndex}`);
          values.push((updates as any)[key]);
          paramIndex++;
        }
      }

      if (setClauses.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No fields to update' });
      }

      setClauses.push(`updated_at = NOW()`);
      values.push(id, userId);

      const result = await ctx.db.query(
        `UPDATE projects SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
         RETURNING *`,
        values
      );

      if (!result.rows[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found or access denied' });
      }

      return result.rows[0];
    }),

  // Delete project
  delete: secureProcedure('project.delete')
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Verify ownership before deleting
      const check = await ctx.db.query(
        `SELECT id FROM projects WHERE id = $1 AND user_id = $2`,
        [input.id, userId]
      );

      if (!check.rows[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found or access denied' });
      }

      await ctx.db.query(`DELETE FROM projects WHERE id = $1`, [input.id]);

      return { success: true, id: input.id };
    }),

  // Get project settings
  getSettings: secureProcedure('project.getSettings')
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      try {
        const result = await ctx.db.query(
          `SELECT ps.* FROM project_settings ps
           JOIN projects p ON ps.project_id = p.id
           WHERE ps.project_id = $1 AND p.user_id = $2`,
          [input.projectId, userId]
        );

        if (!result.rows[0]) {
          // Return null to indicate no settings configured yet — let frontend show setup prompt
          return null;
        }

        return result.rows[0];
      } catch (err) {
        // If table doesn't exist yet, indicate no settings
        console.error('[project.getSettings] Error:', err)
        return null;
      }
    }),

  // Update project settings
  updateSettings: secureProcedure('project.updateSettings')
    .input(projectSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Verify project ownership
      const project = await ctx.db.query(
        `SELECT id FROM projects WHERE id = $1 AND user_id = $2`,
        [input.projectId, userId]
      );

      if (!project.rows[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found or access denied' });
      }

      const { projectId, ...settings } = input;

      const result = await ctx.db.query(
        `INSERT INTO project_settings (project_id, settings, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (project_id) DO UPDATE
         SET settings = $2, updated_at = NOW()
         RETURNING *`,
        [projectId, JSON.stringify(settings)]
      );

      return result.rows[0];
    }),

  // Get project stats
  getStats: secureProcedure('project.getStats')
    .input(z.object({
      projectId: z.string().uuid().optional(),
      projectSlug: z.string().optional()
    }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      if (!input.projectId && !input.projectSlug) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'ProjectId or ProjectSlug is required' });
      }

      try {
        let projectId = input.projectId;
        if (!projectId && input.projectSlug) {
          const p = await ctx.db.query('SELECT id FROM projects WHERE slug = $1 AND user_id = $2', [input.projectSlug, userId]);
          projectId = p.rows[0]?.id;
        }

        if (!projectId) return null;

        // Query real aggregated stats from database using consolidated aggregates
        const [deployStats, logStats] = await Promise.all([
          ctx.db.query(
            `SELECT
               COUNT(*) as total,
               COUNT(*) FILTER (WHERE status = 'success') as successful,
               COUNT(*) FILTER (WHERE status = 'failed') as failed,
               COUNT(*) FILTER (WHERE status = 'running') as active_services,
               MAX(created_at) as last_deployed_at,
               AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_deploy_time
             FROM deployments
             WHERE project_id = $1`,
            [projectId]
          ),
          ctx.db.query(
            `SELECT
               COUNT(*) as total_logs,
               COUNT(*) FILTER (WHERE level = 'error') as error_count
             FROM logs
             WHERE project_id = $1`,
            [projectId]
          )
        ]);

        const ds = deployStats.rows[0] || {};
        const ls = logStats.rows[0] || {};

        return {
          projectId: input.projectId,
          totalDeployments: Number(ds.total) || 0,
          successfulDeployments: Number(ds.successful) || 0,
          failedDeployments: Number(ds.failed) || 0,
          lastDeploymentAt: ds.last_deployed_at || null,
          totalLogs: Number(ls.total_logs) || 0,
          errorCount: Number(ls.error_count) || 0,
          activeServices: Number(ds.active_services) || 0,
          avgDeployTime: Math.round(Number(ds.avg_deploy_time) || 0),
        };
      } catch (err) {
        console.error('[project.getStats] Error:', err)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch project stats', cause: err as Error });
      }
    }),

  // Analyze project (AI detection for one-click deploy)
  analyzeRepository: secureProcedure('project.analyzeRepository')
    .input(z.object({
      repositoryId: z.number(),
      owner: z.string(),
      repo: z.string(),
      branch: z.string().optional().default('main'),
      githubToken: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`[tRPC] Analyzing repository: ${input.owner}/${input.repo}`);

        const analyzer = getAIAnalyzer();
        const analysis = await analyzer.analyzeRepository(
          input.owner,
          input.repo,
          input.branch,
          input.githubToken
        );

        console.log(`[tRPC] Analysis complete: ${analysis.framework} (confidence: ${analysis.confidence})`);

        return analysis;
      } catch (error) {
        console.error('[tRPC] Analysis failed:', error);

        // Structured error for frontend to parse
        const structuredError = {
          userMessage: 'Analysis could not complete. This usually happens with private repositories or empty projects.',
          devDetail: error instanceof Error ? error.message : 'Unknown internal error'
        };

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: JSON.stringify(structuredError),
          cause: error as Error,
        });
      }
    }),

  // Get project activity
  getActivity: secureProcedure('project.getActivity')
    .input(z.object({
      projectId: z.string().uuid().optional(),
      projectSlug: z.string().optional(),
      limit: z.number().min(1).max(50).default(10)
    }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      if (!input.projectId && !input.projectSlug) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'ProjectId or ProjectSlug is required' });
      }

      try {
        let projectId = input.projectId;
        if (!projectId && input.projectSlug) {
          const p = await ctx.db.query('SELECT id FROM projects WHERE slug = $1 AND user_id = $2', [input.projectSlug, userId]);
          projectId = p.rows[0]?.id;
        }

        if (!projectId) return [];

        const result = await ctx.db.query(
          `SELECT id, action, details, created_at
           FROM project_activity
           WHERE project_id = $1
           ORDER BY created_at DESC
           LIMIT $2`,
          [projectId, input.limit]
        );

        return result.rows || [];
      } catch (error) {
        console.error('[project.getActivity] Error:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch activity', cause: error as Error });
      }
    }),
  // Get full dashboard data in one trip
  getDashboardSummary: secureProcedure('project.getDashboardSummary')
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx as any).userId;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      try {
        // 1. Get Project first to get the UUID
        const projectResult = await ctx.db.query(
          `SELECT p.* FROM projects p WHERE p.slug = $1 AND p.user_id = $2`,
          [input.slug, userId]
        );
        const project = projectResult.rows?.[0];
        if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });

        const projectId = project.id;

        // 2. Fetch everything else in parallel with resilience for missing tables
        const statsPromise = ctx.db.query(
          `SELECT
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'success') as successful,
             COUNT(*) FILTER (WHERE status = 'failed') as failed,
             COUNT(*) FILTER (WHERE status = 'running') as active_services,
             MAX(created_at) as last_deployed_at,
             AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_deploy_time
           FROM deployments
           WHERE project_id = $1`,
          [projectId]
        ).catch(err => {
          console.warn('[project.getDashboardSummary] Error fetching deployments (table might be missing):', err.message);
          return { rows: [{ total: 0, successful: 0, failed: 0, active_services: 0, last_deployed_at: null, avg_deploy_time: 0 }] };
        });

        const activityPromise = ctx.db.query(
          `SELECT id, action, details, created_at
           FROM project_activity
           WHERE project_id = $1
           ORDER BY created_at DESC
           LIMIT 15`,
          [projectId]
        ).catch(err => {
          console.warn('[project.getDashboardSummary] Error fetching activity:', err.message);
          return { rows: [] };
        });

        const envsPromise = ctx.db.query(
          `SELECT * FROM environments WHERE project_id = $1 ORDER BY updated_at DESC`,
          [projectId]
        ).catch(err => {
          console.warn('[project.getDashboardSummary] Error fetching environments:', err.message);
          return { rows: [] };
        });

        const latestDeploymentPromise = ctx.db.query(
          `SELECT * FROM deployments WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [projectId]
        ).catch(err => {
          console.warn('[project.getDashboardSummary] Error fetching latest deployment:', err.message);
          return { rows: [] };
        });

        const [envsRes, statsRes, activityRes, latestDepRes] = await Promise.all([
          envsPromise,
          statsPromise,
          activityPromise,
          latestDeploymentPromise
        ]);

        const ds = statsRes.rows[0] || {};
        const latestDep = latestDepRes.rows[0] || null;

        return {
          project: {
            ...project,
            deploymentCount: Number(ds.total) || 0,
            lastDeployedAt: ds.last_deployed_at || null,
          },
          latestDeployment: latestDep ? {
            ...latestDep,
            services: typeof latestDep.services === 'string' ? JSON.parse(latestDep.services) : (latestDep.services || [])
          } : null,
          environments: envsRes.rows.map(row => ({
            ...row,
            resource_config: typeof row.resource_config === 'string' ? JSON.parse(row.resource_config) : row.resource_config,
          })),
          stats: {
            totalDeployments: Number(ds.total) || 0,
            successfulDeployments: Number(ds.successful) || 0,
            failedDeployments: Number(ds.failed) || 0,
            lastDeploymentAt: ds.last_deployed_at || null,
            activeServices: Number(ds.active_services) || 0,
            avgDeployTime: Math.round(Number(ds.avg_deploy_time) || 0),
          },
          activity: activityRes.rows || []
        };
      } catch (err) {
        console.error('[project.getDashboardSummary] Root Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch dashboard summary: ${err instanceof Error ? err.message : 'Unknown error'}`
        });
      }
    }),
});
