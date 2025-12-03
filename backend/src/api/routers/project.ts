import { z } from 'zod';
import { router, publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { getAIAnalyzer } from '../lib/ai-analyzer';

// Project schema for validation
const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  framework: z.string().optional(),
  // Align with Neon schema: repositories.id is TEXT/UUID, not integer
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
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 2000)
      );
      
      const queryPromise = ctx.db.query(
        `SELECT 
          p.*,
          COUNT(DISTINCT d.id) as deployment_count,
          MAX(d.created_at) as last_deployed_at
         FROM projects p
         LEFT JOIN deployments d ON d.project_id = p.id
         WHERE p.user_id = $1
         GROUP BY p.id
         ORDER BY p.created_at DESC`,
        ['user_1'] // TODO: Get from auth context
      );
      
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      return { projects: result.rows }
    } catch (error) {
      console.error('Error fetching projects:', error)
      // Return empty array if table doesn't exist yet or DB is unavailable
      return { projects: [] }
    }
  }),

  // Get project by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), 2000)
        )

        const query = ctx.db.query(
          `SELECT 
             p.*,
             COUNT(DISTINCT d.id) as deployment_count,
             MAX(d.created_at) as last_deployed_at
           FROM projects p
           LEFT JOIN deployments d ON d.project_id = p.id
           WHERE p.id = $1 AND p.user_id = $2
           GROUP BY p.id`,
          [input.id, 'user_1']
        )

        const result = await Promise.race([query, timeout]) as any
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
        return null
      }
    }),

  // Get project by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), 2000)
        )

        const query = ctx.db.query(
          `SELECT 
             p.*,
             COUNT(DISTINCT d.id) as deployment_count,
             MAX(d.created_at) as last_deployed_at
           FROM projects p
           LEFT JOIN deployments d ON d.project_id = p.id
           WHERE p.slug = $1 AND p.user_id = $2
           GROUP BY p.id`,
          [input.slug, 'user_1']
        )

        const result = await Promise.race([query, timeout]) as any
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
        return null
      }
    }),

  // Create new project
  create: publicProcedure
    .input(createProjectSchema.extend({
      workspaceId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Get workspace details
        const workspaceManager = (() => {
          try {
            return require('../../services/workspace-manager').workspaceManager
          } catch {
            return null
          }
        })()

        let workspace: any = null
        let detectedInfo: any = {}

        if (workspaceManager && input.workspaceId) {
          // Use correct accessor (workspaceManager.getWorkspace) for consistency with other router calls.
          workspace = workspaceManager.getWorkspace?.(input.workspaceId) ?? workspaceManager.get?.(input.workspaceId)
          
          // Run AI detection on workspace
          if (workspace) {
            try {
              const modName = ['sarge','-','core'].join('')
              const core = require(modName)
              const detection = await core.detector.detectStack(workspace.path)
              detectedInfo = {
                detected_framework: detection.name,
                detected_package_manager: detection.packageManager,
                detected_languages: detection.languages || [],
                ai_detected_ports: detection.ports || [],
                ai_detected_tools: detection.tools || [],
                ai_analysis_summary: detection.summary || '',
                ai_analyzed_at: new Date().toISOString(),
              }
            } catch (err) {
              console.error('AI detection failed:', err)
            }
          }
        }

        const result = await ctx.db.query(
          `INSERT INTO projects (
            user_id, name, slug, description, workspace_id, workspace_path,
            repository_url, framework, detected_framework, detected_package_manager,
            detected_languages, build_command, dev_command, install_command,
            auto_deploy, auto_deploy_branch, ai_detected_ports, ai_detected_tools,
            ai_analysis_summary, ai_analyzed_at, status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
          ) RETURNING *`,
          [
            'user_1', // TODO: Get from auth
            input.name,
            input.slug,
            input.description || null,
            input.workspaceId,
            workspace?.path || null,
            workspace?.repoUrl || null,
            input.framework || null,
            detectedInfo.detected_framework || null,
            detectedInfo.detected_package_manager || null,
            JSON.stringify(detectedInfo.detected_languages || []),
            input.buildCommand || null,
            input.devCommand || null,
            input.installCommand || null,
            input.autoDeploy,
            input.autoDeployBranch,
            JSON.stringify(detectedInfo.ai_detected_ports || []),
            JSON.stringify(detectedInfo.ai_detected_tools || []),
            detectedInfo.ai_analysis_summary || null,
            detectedInfo.ai_analyzed_at || null,
            'active',
          ]
        )

        const project = result.rows[0]

        // Log activity
        await ctx.db.query(
          `INSERT INTO project_activity (project_id, user_id, action, details)
           VALUES ($1, $2, $3, $4)`,
          [
            project.id,
            'user_1',
            'created',
            JSON.stringify({ name: input.name, workspace_id: input.workspaceId }),
          ]
        )

        return project
      } catch (error: any) {
        console.error('Error creating project:', error)
        throw new Error(`Failed to create project: ${error.message}`)
      }
    }),

  // Update project
  update: publicProcedure
    .input(updateProjectSchema)
    .mutation(async ({ input, ctx }) => {
      // TODO: Check user has access to this project
      // TODO: Update in database
      
      const { id, ...updates } = input;
      
      return {
        id,
        userId: 'user_1',
        name: updates.name || 'My Project',
        slug: 'my-project',
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }),

  // Delete project
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Check user has access to this project
      // TODO: Delete from database (cascade will handle related data)
      
      return { success: true, id: input.id };
    }),

  // Get project settings
  getSettings: publicProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // TODO: Query database for project settings
      // Check if user has access to this project
      
      // Mock response
      return {
        id: 1,
        projectId: input.projectId,
        functionRegion: 'us-east-1',
        functionMemory: 1024,
        functionTimeout: 10,
        functionRuntime: 'nodejs18.x',
        enableEdge: false,
        enableAnalytics: true,
        enableSpeedInsights: true,
        enableCaching: true,
        enableWaf: false,
        passwordProtection: false,
        nodeVersion: '18.x',
        customHeaders: [],
        redirects: [],
        rewrites: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }),

  // Update project settings
  updateSettings: publicProcedure
    .input(projectSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      // TODO: Check user has access to this project
      // TODO: Update settings in database
      
      const { projectId, ...settings } = input;
      
      return {
        id: 1,
        projectId,
        ...settings,
        updatedAt: new Date().toISOString(),
      };
    }),

  // Get project stats
  getStats: publicProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // TODO: Query aggregated stats from database
      
      return {
        projectId: input.projectId,
        totalDeployments: 5,
        successfulDeployments: 4,
        failedDeployments: 1,
        lastDeploymentAt: new Date().toISOString(),
        totalLogs: 1243,
        errorCount: 12,
        activeServices: 3,
        avgDeployTime: 45, // seconds
        uptime: 99.9, // percentage
      };
    }),

  // Analyze project (AI detection for one-click deploy)
  analyzeRepository: publicProcedure
    .input(z.object({ 
      repositoryId: z.number(),
      owner: z.string(),
      repo: z.string(),
      branch: z.string().optional().default('main'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(`[tRPC] Analyzing repository: ${input.owner}/${input.repo}`);
        
        // Use AI analyzer to analyze the repository
        const analyzer = getAIAnalyzer();
        const analysis = await analyzer.analyzeRepository(
          input.owner,
          input.repo,
          input.branch
        );
        
        console.log(`[tRPC] Analysis complete: ${analysis.framework} (confidence: ${analysis.confidence})`);
        
        return analysis;
      } catch (error) {
        console.error('[tRPC] Analysis failed:', error);
        
        // Return fallback mock data if AI fails
        console.warn('[tRPC] Returning fallback mock analysis');
        return {
          projectType: 'fullstack' as const,
          services: [],
          infrastructure: [],
          needsDocker: false,
          dockerComposeYml: null,
          dockerfiles: {},
          recommendedPlatform: 'docker' as const,
          deploymentStrategy: 'Unable to analyze. Please configure manually.',
          framework: 'Unknown',
          detectedPorts: [3000],
          detectedTools: ['node', 'npm'],
          suggestedBuildCommand: 'npm run build',
          suggestedOutputDirectory: 'dist',
          suggestedInstallCommand: 'npm install',
          suggestedDevCommand: 'npm run dev',
          summary: `Unable to analyze repository automatically. Please configure manually. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          confidence: 0.3,
          estimatedBuildTime: 120,
          requiresEnvironmentVariables: [],
        };
      }
    }),
});
