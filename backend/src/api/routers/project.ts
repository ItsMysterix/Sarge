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
  repositoryId: z.number().optional(),
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
    // TODO: Get user from session/auth context
    // For now, return mock data until we connect to database
    
    const mockProjects = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'user_1',
        name: 'My Next.js App',
        slug: 'my-nextjs-app',
        description: 'A modern web application built with Next.js',
        framework: 'next.js',
        repositoryId: 1,
        rootDirectory: './',
        buildCommand: 'npm run build',
        outputDirectory: '.next',
        installCommand: 'npm install',
        devCommand: 'npm run dev',
        autoDeploy: true,
        autoDeployBranch: 'main',
        previewDeployments: true,
        aiDetectedFramework: 'next.js',
        aiDetectedPorts: [3000],
        aiDetectedTools: ['node', 'npm'],
        aiAnalysisSummary: 'Detected Next.js 14 application with App Router',
        aiAnalyzedAt: new Date().toISOString(),
        status: 'active' as const,
        lastDeployedAt: new Date().toISOString(),
        deploymentCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return { projects: mockProjects };
  }),

  // Get project by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // TODO: Query database for project
      // Check if user has access to this project
      
      // Mock response
      return {
        id: input.id,
        userId: 'user_1',
        name: 'My Next.js App',
        slug: 'my-nextjs-app',
        description: 'A modern web application built with Next.js',
        framework: 'next.js',
        repositoryId: 1,
        rootDirectory: './',
        buildCommand: 'npm run build',
        outputDirectory: '.next',
        installCommand: 'npm install',
        devCommand: 'npm run dev',
        autoDeploy: true,
        autoDeployBranch: 'main',
        previewDeployments: true,
        status: 'active' as const,
        lastDeployedAt: new Date().toISOString(),
        deploymentCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }),

  // Get project by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      // TODO: Query database for project by slug
      // Check if user has access to this project
      
      // Mock response
      return {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'user_1',
        name: 'My Next.js App',
        slug: input.slug,
        description: 'A modern web application built with Next.js',
        framework: 'next.js',
        repositoryId: 1,
        rootDirectory: './',
        buildCommand: 'npm run build',
        outputDirectory: '.next',
        installCommand: 'npm install',
        devCommand: 'npm run dev',
        autoDeploy: true,
        autoDeployBranch: 'main',
        previewDeployments: true,
        status: 'active' as const,
        lastDeployedAt: new Date().toISOString(),
        deploymentCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }),

  // Create new project
  create: publicProcedure
    .input(createProjectSchema)
    .mutation(async ({ input, ctx }) => {
      // TODO: Get user from session
      // TODO: Insert into database
      
      const projectId = crypto.randomUUID();
      
      return {
        id: projectId,
        userId: 'user_1',
        ...input,
        status: 'active' as const,
        deploymentCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
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
