/**
 * GitHub Repository Scanner
 * AI-powered detection using Claude 3.5 Sonnet + GitHub API
 * WITHOUT cloning the repository
 */

import { createGitHubAPI, GitHubAPIService } from './github-api'
import { AIRepositoryAnalyzer } from '../api/lib/ai-analyzer'

export interface DetectedService {
  name: string
  type: 'web' | 'api' | 'worker' | 'database' | 'monitoring' | 'cache' | 'queue' | 'storage'
  version?: string
  ports: number[]
  envKeys: string[]
  startCommand?: string
  buildCommand?: string
  cwd?: string
  dockerImage?: string
  requiredFor: string[]  // Which parts of the app need this
  framework?: string
  healthcheck?: string
}

export interface ProjectBlueprint {
  projectType: string  // 'nodejs', 'python', 'java', etc.
  packageManager?: string  // 'npm', 'pnpm', 'yarn', 'pip', etc.
  framework?: string  // 'next.js', 'express', 'django', etc.
  
  // Detected services from the repo
  services: DetectedService[]
  
  // External services needed (Prometheus, Grafana, Redis, etc.)
  externalServices: DetectedService[]
  
  // Docker configs found
  docker: {
    dockerfile: boolean
    dockerCompose: boolean
    composeFiles: string[]
  }
  
  // Infrastructure needs
  resources: {
    databases: string[]  // ['postgres', 'mongodb']
    caches: string[]     // ['redis', 'memcached']
    queues: string[]     // ['rabbitmq', 'kafka']
    monitoring: string[] // ['prometheus', 'grafana']
  }
  
  // Environment variables needed
  envKeys: string[]
  
  // Build & deploy info
  buildCommand?: string
  startCommand?: string
  outputDir?: string
}

export class GitHubScanner {
  private github: GitHubAPIService
  private aiAnalyzer?: AIRepositoryAnalyzer
  private useAI: boolean

  constructor(accessToken: string, useAI: boolean = true) {
    this.github = createGitHubAPI(accessToken)
    this.useAI = useAI && !!process.env.ANTHROPIC_API_KEY
    
    if (this.useAI) {
      try {
        this.aiAnalyzer = new AIRepositoryAnalyzer()
        console.log('[GitHubScanner] AI analysis enabled (Claude 3.5 Sonnet)')
      } catch (err) {
        console.warn('[GitHubScanner] AI analysis disabled:', err)
        this.useAI = false
      }
    }
  }

  /**
   * Main scanner: analyze repo and return deployment blueprint
   * Uses Claude AI if available, falls back to pattern matching
   */
  async scanRepository(owner: string, repo: string, branch: string = 'main'): Promise<ProjectBlueprint> {
    console.log(`[GitHubScanner] Scanning ${owner}/${repo}@${branch}`)

    // If AI is available, use it for comprehensive analysis
    if (this.useAI && this.aiAnalyzer) {
      try {
        console.log('[GitHubScanner] Using Claude AI for analysis')
        const aiAnalysis = await this.aiAnalyzer.analyzeRepository(owner, repo, branch)
        return this.convertAIAnalysisToBlueprint(aiAnalysis, owner, repo, branch)
      } catch (err) {
        console.warn('[GitHubScanner] AI analysis failed, falling back to pattern matching:', err)
        // Fall through to pattern matching
      }
    }

    // Fallback: Pattern-based detection (no AI)
    console.log('[GitHubScanner] Using pattern matching (no AI)')
    return this.scanWithPatternMatching(owner, repo, branch)
  }

  /**
   * Convert AI analysis to our blueprint format
   */
  private convertAIAnalysisToBlueprint(aiAnalysis: any, owner: string, repo: string, branch: string): ProjectBlueprint {
    const services: DetectedService[] = (aiAnalysis.services || []).map((svc: any) => ({
      name: svc.name || 'unknown',
      type: svc.type || 'api',
      ports: Array.isArray(svc.ports) ? svc.ports : [svc.defaultPort || 3000],
      envKeys: svc.environmentVariables || [],
      startCommand: svc.startCommand || '',
      buildCommand: svc.buildCommand || '',
      cwd: svc.workingDirectory || '.',
      framework: svc.framework || '',
      healthcheck: svc.healthcheck || '',
      requiredFor: ['main-app'],
    }))

    const externalServices: DetectedService[] = (aiAnalysis.infrastructure || []).map((infra: any) => ({
      name: (infra.service || 'unknown').toLowerCase(),
      type: infra.type || 'database',
      version: infra.version || '',
      ports: this.getDefaultPort(infra.service),
      envKeys: this.getDefaultEnvKeys(infra.service),
      dockerImage: this.getDockerImage(infra.service, infra.version),
      requiredFor: [infra.purpose || 'app'],
    }))

    return {
      projectType: aiAnalysis.projectType || 'unknown',
      framework: aiAnalysis.framework || '',
      packageManager: this.detectPackageManagerFromServices(aiAnalysis.services),
      services,
      externalServices,
      docker: {
        dockerfile: !!aiAnalysis.needsDocker,
        dockerCompose: !!aiAnalysis.dockerComposeYml,
        composeFiles: aiAnalysis.dockerComposeYml ? ['docker-compose.yml'] : [],
      },
      resources: {
        databases: externalServices.filter(s => s.type === 'database').map(s => s.name),
        caches: externalServices.filter(s => s.type === 'cache').map(s => s.name),
        queues: externalServices.filter(s => s.type === 'queue').map(s => s.name),
        monitoring: [],
      },
      envKeys: aiAnalysis.requiresEnvironmentVariables || [],
      buildCommand: aiAnalysis.suggestedBuildCommand || '',
      startCommand: aiAnalysis.suggestedDevCommand || '',
      outputDir: aiAnalysis.suggestedOutputDirectory || '',
    }
  }

  /**
   * Pattern-based scanning (fallback when AI unavailable)
   */
  private async scanWithPatternMatching(owner: string, repo: string, branch: string): Promise<ProjectBlueprint> {

    // 1. Detect project type
    const projectType = await this.github.detectProjectType(owner, repo, branch)
    
    // 2. Get all relevant config files
    const files = await this.github.listFiles(owner, repo, '', branch)
    const configFiles = files.filter(f => this.isConfigFile(f.name))
    
    // 3. Analyze based on project type
    let blueprint: ProjectBlueprint
    
    switch (projectType) {
      case 'nodejs':
        blueprint = await this.scanNodeJS(owner, repo, branch, configFiles)
        break
      case 'python':
        blueprint = await this.scanPython(owner, repo, branch, configFiles)
        break
      default:
        blueprint = await this.scanGeneric(owner, repo, branch, configFiles)
    }

    // 4. Check for Docker configs
    blueprint.docker = await this.detectDockerConfig(owner, repo, branch)

    // 5. Detect monitoring setup (Prometheus, Grafana)
    blueprint.resources.monitoring = await this.detectMonitoring(owner, repo, branch)

    // 6. Detect external services from docker-compose
    if (blueprint.docker.dockerCompose) {
      const externalServices = await this.detectDockerComposeServices(owner, repo, branch)
      blueprint.externalServices.push(...externalServices)
    }

    console.log(`[GitHubScanner] Scan complete. Found ${blueprint.services.length} services, ${blueprint.externalServices.length} external`)
    return blueprint
  }

  /**
   * Scan Node.js project
   */
  private async scanNodeJS(owner: string, repo: string, branch: string, configFiles: any[]): Promise<ProjectBlueprint> {
    const packageJson = await this.github.getPackageJson(owner, repo, branch)
    
    // Detect package manager
    const packageManager = await this.detectPackageManager(owner, repo, branch)
    
    // Detect framework
    const framework = this.detectNodeFramework(packageJson)
    
    // Extract dependencies
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
    
    // Detect services from scripts and dependencies
    const services: DetectedService[] = []
    const externalServices: DetectedService[] = []
    const resources = {
      databases: [] as string[],
      caches: [] as string[],
      queues: [] as string[],
      monitoring: [] as string[],
    }

    // Main app service
    const startCommand = packageJson.scripts?.start || packageJson.scripts?.dev || `node ${packageJson.main || 'index.js'}`
    services.push({
      name: packageJson.name || 'app',
      type: 'web',
      ports: [3000], // Default for Node.js
      envKeys: this.extractEnvKeys(packageJson),
      startCommand,
      requiredFor: ['main-app'],
    })

    // Check for databases
    if (deps['pg'] || deps['postgres']) {
      resources.databases.push('postgres')
      externalServices.push({
        name: 'postgres',
        type: 'database',
        ports: [5432],
        envKeys: ['DATABASE_URL', 'POSTGRES_USER', 'POSTGRES_PASSWORD'],
        dockerImage: 'postgres:16-alpine',
        requiredFor: [packageJson.name || 'app'],
      })
    }
    if (deps['mongodb'] || deps['mongoose']) {
      resources.databases.push('mongodb')
      externalServices.push({
        name: 'mongodb',
        type: 'database',
        ports: [27017],
        envKeys: ['MONGODB_URI'],
        dockerImage: 'mongo:7',
        requiredFor: [packageJson.name || 'app'],
      })
    }
    if (deps['mysql'] || deps['mysql2']) {
      resources.databases.push('mysql')
      externalServices.push({
        name: 'mysql',
        type: 'database',
        ports: [3306],
        envKeys: ['MYSQL_ROOT_PASSWORD', 'MYSQL_DATABASE'],
        dockerImage: 'mysql:8',
        requiredFor: [packageJson.name || 'app'],
      })
    }

    // Check for Redis
    if (deps['redis'] || deps['ioredis']) {
      resources.caches.push('redis')
      externalServices.push({
        name: 'redis',
        type: 'cache',
        ports: [6379],
        envKeys: ['REDIS_URL'],
        dockerImage: 'redis:7-alpine',
        requiredFor: [packageJson.name || 'app'],
      })
    }

    // Check for message queues
    if (deps['amqplib'] || deps['rabbitmq']) {
      resources.queues.push('rabbitmq')
      externalServices.push({
        name: 'rabbitmq',
        type: 'worker',
        ports: [5672, 15672],
        envKeys: ['RABBITMQ_URL'],
        dockerImage: 'rabbitmq:3-management-alpine',
        requiredFor: [packageJson.name || 'app'],
      })
    }

    // Check for Prometheus client
    if (deps['prom-client']) {
      resources.monitoring.push('prometheus')
    }

    return {
      projectType: 'nodejs',
      packageManager,
      framework,
      services,
      externalServices,
      docker: { dockerfile: false, dockerCompose: false, composeFiles: [] },
      resources,
      envKeys: this.extractEnvKeys(packageJson),
      buildCommand: packageJson.scripts?.build || '',
      startCommand,
    }
  }

  /**
   * Scan Python project
   */
  private async scanPython(owner: string, repo: string, branch: string, configFiles: any[]): Promise<ProjectBlueprint> {
    const requirements = await this.github.getFileContent(owner, repo, 'requirements.txt', branch).catch(() => '')
    const deps = requirements.split('\n').filter(Boolean)

    const services: DetectedService[] = [{
      name: 'app',
      type: 'web',
      ports: [8000],
      envKeys: [],
      requiredFor: ['main-app'],
    }]

    const externalServices: DetectedService[] = []
    const resources = {
      databases: [] as string[],
      caches: [] as string[],
      queues: [] as string[],
      monitoring: [] as string[],
    }

    // Check for common Python frameworks
      const safeDeps = Array.isArray(deps) ? deps.map(d => (typeof d === 'string' ? d : String(d))) : []
      const framework = safeDeps.some(d => d.includes('django')) ? 'django' : 
                        safeDeps.some(d => d.includes('flask')) ? 'flask' :
                        safeDeps.some(d => d.includes('fastapi')) ? 'fastapi' : undefined

    // Check databases
    const depsForDb = Array.isArray(deps) ? deps.map(d => (typeof d === 'string' ? d : String(d))) : []
    if (depsForDb.some(d => d.includes('psycopg') || d.includes('postgres'))) {
      resources.databases.push('postgres')
      externalServices.push({
        name: 'postgres',
        type: 'database',
        ports: [5432],
        envKeys: ['DATABASE_URL'],
        dockerImage: 'postgres:16-alpine',
        requiredFor: ['app'],
      })
    }

    return {
      projectType: 'python',
      packageManager: 'pip',
      framework,
      services,
      externalServices,
      docker: { dockerfile: false, dockerCompose: false, composeFiles: [] },
      resources,
      envKeys: [],
      startCommand: framework === 'django' ? 'python manage.py runserver' : 'python app.py',
    }
  }

  /**
   * Generic scanner for unknown project types
   */
  private async scanGeneric(owner: string, repo: string, branch: string, configFiles: any[]): Promise<ProjectBlueprint> {
    return {
      projectType: 'unknown',
      services: [],
      externalServices: [],
      docker: { dockerfile: false, dockerCompose: false, composeFiles: [] },
      resources: {
        databases: [],
        caches: [],
        queues: [],
        monitoring: [],
      },
      envKeys: [],
    }
  }

  /**
   * Detect Docker configuration
   */
  private async detectDockerConfig(owner: string, repo: string, branch: string) {
    const dockerfile = await this.github.hasFile(owner, repo, 'Dockerfile', branch)
    const dockerCompose = await this.github.hasFile(owner, repo, 'docker-compose.yml', branch) ||
                         await this.github.hasFile(owner, repo, 'docker-compose.yaml', branch)
    
    const composeFiles: string[] = []
    if (await this.github.hasFile(owner, repo, 'docker-compose.yml', branch)) {
      composeFiles.push('docker-compose.yml')
    }
    if (await this.github.hasFile(owner, repo, 'docker-compose.yaml', branch)) {
      composeFiles.push('docker-compose.yaml')
    }

    return { dockerfile, dockerCompose, composeFiles }
  }

  /**
   * Detect monitoring setup (Prometheus, Grafana, Alertmanager)
   */
  private async detectMonitoring(owner: string, repo: string, branch: string): Promise<string[]> {
    const monitoring: string[] = []

    // Check for Prometheus config
    if (await this.github.hasFile(owner, repo, 'prometheus.yml', branch) ||
        await this.github.hasFile(owner, repo, 'prometheus/prometheus.yml', branch)) {
      monitoring.push('prometheus')
    }

    // Check for Grafana
    if (await this.github.hasFile(owner, repo, 'grafana/dashboards', branch)) {
      monitoring.push('grafana')
    }

    // Check for Alertmanager
    if (await this.github.hasFile(owner, repo, 'alertmanager/alertmanager.yml', branch)) {
      monitoring.push('alertmanager')
    }

    return monitoring
  }

  /**
   * Parse docker-compose.yml to detect external services
   */
  private async detectDockerComposeServices(owner: string, repo: string, branch: string): Promise<DetectedService[]> {
    const services: DetectedService[] = []

    try {
      let composeContent = await this.github.getFileContent(owner, repo, 'docker-compose.yml', branch)
        .catch(() => this.github.getFileContent(owner, repo, 'docker-compose.yaml', branch))
        .catch(() => '')

      // Normalize to string to avoid `.includes` on undefined
      if (typeof composeContent !== 'string') composeContent = String(composeContent ?? '')

      // Simple regex parsing (for production, use a YAML parser)
      if (composeContent.includes('image: postgres')) {
        services.push({
          name: 'postgres',
          type: 'database',
          ports: [5432],
          envKeys: ['POSTGRES_PASSWORD'],
          dockerImage: 'postgres:16-alpine',
          requiredFor: ['app'],
        })
      }

      if (composeContent.includes('image: redis')) {
        services.push({
          name: 'redis',
          type: 'cache',
          ports: [6379],
          envKeys: [],
          dockerImage: 'redis:7-alpine',
          requiredFor: ['app'],
        })
      }

      if (composeContent.includes('image: prom/prometheus') || composeContent.includes('prometheus:')) {
        services.push({
          name: 'prometheus',
          type: 'monitoring',
          ports: [9090],
          envKeys: [],
          dockerImage: 'prom/prometheus:latest',
          requiredFor: ['monitoring'],
        })
      }

      if (composeContent.includes('image: grafana/grafana')) {
        services.push({
          name: 'grafana',
          type: 'monitoring',
          ports: [3000],
          envKeys: ['GF_SECURITY_ADMIN_PASSWORD'],
          dockerImage: 'grafana/grafana:latest',
          requiredFor: ['monitoring'],
        })
      }
    } catch (err) {
      console.warn('[GitHubScanner] Could not parse docker-compose', err)
    }

    return services
  }

  /**
   * Detect package manager from lock files
   */
  private async detectPackageManager(owner: string, repo: string, branch: string): Promise<string> {
    if (await this.github.hasFile(owner, repo, 'pnpm-lock.yaml', branch)) return 'pnpm'
    if (await this.github.hasFile(owner, repo, 'yarn.lock', branch)) return 'yarn'
    if (await this.github.hasFile(owner, repo, 'package-lock.json', branch)) return 'npm'
    if (await this.github.hasFile(owner, repo, 'bun.lockb', branch)) return 'bun'
    return 'npm' // default
  }

  /**
   * Detect Node.js framework from package.json
   */
  private detectNodeFramework(packageJson: any): string | undefined {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
    
    if (deps['next']) return 'next.js'
    if (deps['nuxt']) return 'nuxt'
    if (deps['express']) return 'express'
    if (deps['fastify']) return 'fastify'
    if (deps['koa']) return 'koa'
    if (deps['nest']) return 'nestjs'
    if (deps['@nestjs/core']) return 'nestjs'
    
    return undefined
  }

  /**
   * Extract environment variable keys from package.json or code
   */
  private extractEnvKeys(packageJson: any): string[] {
    const envKeys: string[] = []
    
    // Check scripts for env vars
    const scripts = packageJson.scripts || {}
    const scriptStr = JSON.stringify(scripts)
    
    const matches = scriptStr.match(/\$\{?([A-Z_][A-Z0-9_]*)\}?/g) || []
    matches.forEach(m => {
      const key = m.replace(/\$\{?|\}?/g, '')
      const safeKey = typeof key === 'string' ? key : String(key ?? '')
      if (safeKey && !envKeys.includes(safeKey)) envKeys.push(safeKey)
    })

    return envKeys
  }

  /**
   * Check if filename is a config file
   */
  private isConfigFile(name: string): boolean {
    const configPatterns = [
      'package.json',
      'tsconfig.json',
      'next.config',
      'vite.config',
      'docker-compose',
      'Dockerfile',
      'prometheus.yml',
      'grafana',
      'requirements.txt',
      'Gemfile',
      'pom.xml',
      'build.gradle',
    ]
    const safeName = typeof name === 'string' ? name : String(name ?? '')
    return configPatterns.some(p => safeName.includes(p))
  }

  /**
   * Get default port for a service
   */
  private getDefaultPort(serviceName: string): number[] {
    const ports: Record<string, number[]> = {
      postgres: [5432],
      postgresql: [5432],
      mongodb: [27017],
      mongo: [27017],
      mysql: [3306],
      redis: [6379],
      rabbitmq: [5672, 15672],
      kafka: [9092],
      prometheus: [9090],
      grafana: [3000],
      elasticsearch: [9200],
    }
    return ports[serviceName.toLowerCase()] || [8080]
  }

  /**
   * Get default environment keys for a service
   */
  private getDefaultEnvKeys(serviceName: string): string[] {
    const envKeys: Record<string, string[]> = {
      postgres: ['POSTGRES_PASSWORD', 'POSTGRES_USER', 'POSTGRES_DB', 'DATABASE_URL'],
      postgresql: ['POSTGRES_PASSWORD', 'POSTGRES_USER', 'POSTGRES_DB', 'DATABASE_URL'],
      mongodb: ['MONGO_INITDB_ROOT_USERNAME', 'MONGO_INITDB_ROOT_PASSWORD', 'MONGODB_URI'],
      mysql: ['MYSQL_ROOT_PASSWORD', 'MYSQL_DATABASE'],
      redis: ['REDIS_URL'],
      rabbitmq: ['RABBITMQ_URL'],
      grafana: ['GF_SECURITY_ADMIN_PASSWORD'],
    }
    return envKeys[serviceName.toLowerCase()] || []
  }

  /**
   * Get Docker image for a service
   */
  private getDockerImage(serviceName: string, version?: string): string {
    const images: Record<string, string> = {
      postgres: `postgres:${version || '16-alpine'}`,
      postgresql: `postgres:${version || '16-alpine'}`,
      mongodb: `mongo:${version || '7'}`,
      mysql: `mysql:${version || '8'}`,
      redis: `redis:${version || '7-alpine'}`,
      rabbitmq: 'rabbitmq:3-management-alpine',
      prometheus: 'prom/prometheus:latest',
      grafana: 'grafana/grafana:latest',
      elasticsearch: `elasticsearch:${version || '8.11.0'}`,
    }
    return images[serviceName.toLowerCase()] || `${serviceName}:latest`
  }

  /**
   * Detect package manager from services
   */
  private detectPackageManagerFromServices(services: any[]): string | undefined {
    // This is a simple heuristic - in reality, the AI analysis should provide this
    return 'npm'
  }
}

/**
 * Factory function
 */
export function createGitHubScanner(accessToken: string, useAI: boolean = true): GitHubScanner {
  return new GitHubScanner(accessToken, useAI)
}
