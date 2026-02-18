import Anthropic from '@anthropic-ai/sdk';
import { aiLogger } from '../../lib/logger';
import { Octokit } from '@octokit/rest';

export interface ServiceConfig {
  name: string;                      // "frontend", "api", "worker", etc.
  type: 'web' | 'api' | 'worker' | 'database' | 'cache' | 'queue';
  framework?: string;                // "Next.js 14", "Express", "Django", etc.
  defaultPort: number;               // Suggested default port
  buildCommand?: string;             // How to build this service
  startCommand: string;              // How to start this service
  workingDirectory: string;          // Relative path from repo root
  environmentVariables: string[];    // Required env vars for this service
  dockerfile?: string;               // Generated Dockerfile content
  healthcheck?: string;              // Health check endpoint
}

export interface InfrastructureRequirement {
  type: 'database' | 'cache' | 'queue' | 'storage' | 'other';
  service: string;                   // "PostgreSQL", "Redis", "RabbitMQ", "S3", etc.
  version?: string;                  // "15", "7.0", etc.
  purpose: string;                   // "Primary database", "Session store", etc.
}

export interface RepositoryAnalysis {
  // Project structure
  projectType: 'monorepo' | 'fullstack' | 'frontend' | 'backend' | 'static';
  services: ServiceConfig[];         // All detected services

  // Infrastructure requirements
  infrastructure: InfrastructureRequirement[];

  // Docker configuration
  needsDocker: boolean;
  dockerComposeYml?: string | null;         // Generated docker-compose.yml
  dockerfiles: Record<string, string>; // service name -> Dockerfile content

  // Deployment recommendations
  recommendedPlatform: 'vercel' | 'docker' | 'kubernetes' | 'terraform' | 'traditional';
  deploymentStrategy: string;        // Detailed explanation
  terraformConfig?: string | null;   // Generated Terraform/OpenTofu code

  // Original fields (for backward compatibility)
  framework: string;
  detectedPorts: number[];
  detectedTools: string[];
  suggestedBuildCommand: string;
  suggestedOutputDirectory: string;
  suggestedInstallCommand: string;
  suggestedDevCommand: string;
  summary: string;
  confidence: number;
  estimatedBuildTime: number;
  requiresEnvironmentVariables: string[];
}

export interface FileInfo {
  path: string;
  content: string;
  size: number;
}

/**
 * AI-powered project analyzer using LLMs to extract architectural patterns
 * and deployment requirements from source code.
 */
export class AIRepositoryAnalyzer {
  private anthropic: Anthropic;
  private maxFileSize = 100 * 1024; // 100KB max per file
  private maxFiles = 30; // Limit files to analyze to control costs

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Analyze a GitHub repository using GitHub API
   */
  async analyzeRepository(owner: string, repo: string, branch: string = 'main', token?: string): Promise<RepositoryAnalysis> {
    aiLogger.info(`[AI Analyzer] Starting analysis for ${owner}/${repo}`);

    if (!token) {
      throw new Error('GitHub token is required for analysis. Please ensure you are connected to GitHub.');
    }

    try {
      // Use GitHub API (faster, no git dependency)
      const files = await this.scanRepositoryViaAPI(owner, repo, branch, token);

      if (files.length === 0) {
        throw new Error('No relevant files found in repository to analyze.');
      }

      // Analyze with Claude
      const analysis = await this.analyzeWithClaude(files, owner, repo);
      return analysis;

    } catch (error) {
      aiLogger.error(`[AI Analyzer] Analysis failed: ${error}`);
      throw error;
    }
  }



  /**
   * Scan repository using GitHub API (Octokit)
   */
  private async scanRepositoryViaAPI(owner: string, repo: string, branch: string, token: string): Promise<FileInfo[]> {
    const octokit = new Octokit({ auth: token });
    const files: FileInfo[] = [];

    // Priority files mapping for quick lookup
    const priorityFiles = new Set([
      'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
      'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
      'next.config.js', 'next.config.ts', 'next.config.mjs',
      'vite.config.js', 'vite.config.ts', 'nuxt.config.js', 'nuxt.config.ts',
      'angular.json', 'tsconfig.json', 'README.md',
      '.env.example', '.env.sample',
      'src/main.ts', 'src/main.js', 'src/index.ts', 'src/index.js',
      'app/page.tsx', 'pages/index.tsx',
      'main.go', 'go.mod', 'requirements.txt', 'Pipfile',
      'pyproject.toml', 'Cargo.toml', 'pom.xml', 'build.gradle',
    ]);

    aiLogger.info(`[AI Analyzer] Fetching file tree via API for ${owner}/${repo}`);

    try {
      // Get the tree recursively
      // Note: extensive repos might need truncation handling, but for analysis 'recursive' is good
      const { data: treeData } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: '1',
      });

      // Filter for priority files and small files
      const candidates = treeData.tree.filter(item =>
        item.type === 'blob' &&
        priorityFiles.has(item.path || '') &&
        (item.size || 0) < this.maxFileSize
      );

      // Also include some root files if not in priority list but look relevant?
      // For now stick to priority list to save API calls

      aiLogger.info(`[AI Analyzer] Found ${candidates.length} relevant files in tree`);

      // Limit concurrent requests
      const limit = 5;
      const chunks: any[][] = [];
      for (let i = 0; i < candidates.length; i += limit) {
        chunks.push(candidates.slice(i, i + limit));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(async (item) => {
          if (!item.path || files.length >= this.maxFiles) return;

          try {
            const { data } = await octokit.rest.repos.getContent({
              owner,
              repo,
              path: item.path,
              ref: branch,
              mediaType: {
                format: 'raw',
              },
            });

            // If data is array (directory), ignore. If object (file content), use it.
            // With mediaType: raw, data should be string
            const content = data as any;
            if (typeof content === 'string') {
              files.push({
                path: item.path,
                content: content,
                size: item.size || content.length,
              });
              aiLogger.info(`[AI Analyzer] Fetched (API): ${item.path}`);
            }
          } catch (err) {
            aiLogger.warn(`[AI Analyzer] Failed to fetch ${item.path}: ${err}`);
          }
        }));
      }

    } catch (e) {
      aiLogger.error(`[AI Analyzer] API Tree fetch failed: ${e}`);
      throw e;
    }

    return files;
  }

  /**
   * Analyze repository files using Claude 3.5 Sonnet
   */
  private async analyzeWithClaude(files: FileInfo[], owner: string, repo: string): Promise<RepositoryAnalysis> {
    console.log(`[AI Analyzer] Analyzing ${files.length} files with Claude 3.5 Sonnet`);

    // Prepare context for Claude
    const filesContext = files.map(f =>
      `--- ${f.path} ---\n${f.content}\n`
    ).join('\n');

    const prompt = `You are an expert DevOps engineer analyzing a GitHub repository for automatic deployment configuration.

Repository: ${owner}/${repo}
Files provided: ${files.map(f => f.path).join(', ')}

${filesContext}

Analyze the repository structure and provide a comprehensive deployment analysis as JSON:

{
  "projectType": "monorepo | fullstack | frontend | backend | static",
  
  "services": [
    {
      "name": "string (e.g., 'frontend', 'api', 'worker', 'admin')",
      "type": "web | api | worker | database | cache | queue",
      "framework": "string (e.g., 'Next.js 14', 'Express 4', 'FastAPI')",
      "defaultPort": number (suggested default port - user can spawn multiple instances on different ports),
      "buildCommand": "string (how to build, or null)",
      "startCommand": "string (how to start in production)",
      "workingDirectory": "string (relative path from repo root, e.g., '.' or 'apps/web')",
      "environmentVariables": ["array of required env vars for this service"],
      "dockerfile": "string (generated Dockerfile content for this service, or null)",
      "healthcheck": "string (health check endpoint like '/health' or null)"
    }
  ],
  
  "infrastructure": [
    {
      "type": "database | cache | queue | storage | other",
      "service": "string (e.g., 'PostgreSQL', 'Redis', 'RabbitMQ', 'S3')",
      "version": "string (recommended version, or null)",
      "purpose": "string (why it's needed, e.g., 'Primary database', 'Session store')"
    }
  ],
  
  "needsDocker": boolean,
  "dockerComposeYml": "string (full docker-compose.yml content, or null)",
  "dockerfiles": {
    "serviceName": "Dockerfile content as string"
  },
  
  "recommendedPlatform": "vercel | docker | kubernetes | terraform | traditional",
  "deploymentStrategy": "string (detailed explanation of how to deploy)",
  "terraformConfig": "string (complete production-ready Terraform/OpenTofu code using community modules for all detected services and infrastructure, or null)",
  
  "framework": "string (primary framework)",
  "detectedPorts": [all ports needed],
  "detectedTools": ["node", "npm", "typescript", "docker", etc.],
  "suggestedBuildCommand": "string (for primary service)",
  "suggestedOutputDirectory": "string",
  "suggestedInstallCommand": "string",
  "suggestedDevCommand": "string",
  "summary": "string (2-3 sentences)",
  "confidence": number (0.0 to 1.0),
  "estimatedBuildTime": number (seconds),
  "requiresEnvironmentVariables": [all env vars across all services]
}

CRITICAL ANALYSIS REQUIREMENTS:

1. PROJECT STRUCTURE:
   - Detect monorepo (multiple apps/packages)
   - Detect fullstack (frontend + backend in same repo)
   - Identify each deployable service separately

2. SERVICE DETECTION:
   - Frontend: Next.js, React, Vue, Angular, static sites
   - Backend: Express, Fastify, NestJS, Django, FastAPI, Go, etc.
   - Workers: Background jobs, cron tasks
   - Identify port for EACH service

3. INFRASTRUCTURE:
   - Database: PostgreSQL, MySQL, MongoDB from dependencies
   - Cache: Redis, Memcached
   - Queue: RabbitMQ, Redis, SQS
   - Storage: S3, local filesystem
   - Look for: pg, mysql2, mongoose, redis, bull, aws-sdk

4. DOCKER GENERATION:
   - If multiple services OR needs database: needsDocker = true
   - Generate production-ready Dockerfiles for each service
   - Generate docker-compose.yml with all services + infrastructure
   - Include proper networking, volumes, health checks

5. DEPLOYMENT STRATEGY:
   - Vercel: Next.js/React frontend-only or with serverless API
   - Docker: Multiple services, needs custom infra
   - Kubernetes: Microservices, high scale
   - Traditional: Simple apps, VPS deployment

6. TERRAFORM GENERATION:
   - If project needs cloud-specific services beyond simple containers (RDS, S3, Pub/Sub, etc.)
   - Generate high-quality, production-ready Terraform/OpenTofu code
   - Use standard providers (hashicorp/aws, azure/azurerm, google)
   - Include variables for secrets (DB passwords, API keys)
   - Ensure resources are logically grouped and tagged

7. PORT DETECTION:
   - Check server.listen() in code
   - Check PORT env var usage
   - Check Dockerfile EXPOSE
   - Default: 3000 (Node), 8000 (Python), 8080 (Go)

Respond ONLY with valid JSON, no markdown, no additional text.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.2, // Low temperature for more consistent analysis
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract JSON from response
      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      console.log(`[AI Analyzer] Claude response: ${responseText.substring(0, 200)}...`);

      // Parse JSON response
      const analysis = JSON.parse(responseText) as RepositoryAnalysis;

      // Validate and sanitize
      return {
        // New comprehensive fields
        projectType: analysis.projectType || 'fullstack',
        services: Array.isArray(analysis.services) ? analysis.services : [],
        infrastructure: Array.isArray(analysis.infrastructure) ? analysis.infrastructure : [],
        needsDocker: analysis.needsDocker ?? true,
        dockerComposeYml: analysis.dockerComposeYml || null,
        dockerfiles: analysis.dockerfiles || {},
        recommendedPlatform: analysis.recommendedPlatform || 'terraform',
        deploymentStrategy: analysis.deploymentStrategy || 'Provision using generated Terraform code',
        terraformConfig: analysis.terraformConfig || null,

        // Backward compatibility fields
        framework: analysis.framework || 'Unknown',
        detectedPorts: Array.isArray(analysis.detectedPorts) ? analysis.detectedPorts : [],
        detectedTools: Array.isArray(analysis.detectedTools) ? analysis.detectedTools : [],
        suggestedBuildCommand: analysis.suggestedBuildCommand || 'npm run build',
        suggestedOutputDirectory: analysis.suggestedOutputDirectory || 'dist',
        suggestedInstallCommand: analysis.suggestedInstallCommand || 'npm install',
        suggestedDevCommand: analysis.suggestedDevCommand || 'npm run dev',
        summary: analysis.summary || 'Repository analysis completed.',
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
        estimatedBuildTime: Math.max(0, analysis.estimatedBuildTime || 60),
        requiresEnvironmentVariables: Array.isArray(analysis.requiresEnvironmentVariables)
          ? analysis.requiresEnvironmentVariables
          : [],
      };
    } catch (error) {
      console.error('[AI Analyzer] Claude API error:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


}

/**
 * Create singleton instance
 */
let analyzerInstance: AIRepositoryAnalyzer | null = null;

export function getAIAnalyzer(): AIRepositoryAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new AIRepositoryAnalyzer();
  }
  return analyzerInstance;
}
