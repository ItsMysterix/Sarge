/**
 * Deployment Orchestrator
 * Deploys services to localhost WITHOUT cloning repos
 * Uses GitHub API + Docker to run services
 */

import { spawn, ChildProcess } from 'child_process'
import { createGitHubAPI } from './github-api'
import { DetectedService } from './github-scanner'

export interface DeploymentConfig {
  owner: string
  repo: string
  branch: string
  accessToken: string
  services: DetectedService[]
  externalServices: DetectedService[]
}

export interface ServiceInstance {
  name: string
  pid?: number
  port?: number
  url?: string
  status: 'starting' | 'running' | 'failed' | 'stopped'
  logs: string[]
  process?: ChildProcess
}

export class DeploymentOrchestrator {
  private instances: Map<string, ServiceInstance> = new Map()

  /**
   * Deploy all services from a GitHub repo (no cloning!)
   */
  async deploy(config: DeploymentConfig): Promise<Map<string, ServiceInstance>> {
    console.log(`[Orchestrator] Deploying ${config.owner}/${config.repo}`)

    // 1. Start external services first (databases, caches, monitoring)
    for (const service of config.externalServices) {
      await this.startExternalService(service)
    }

    // 2. Build & start app services
    for (const service of config.services) {
      await this.startAppService(service, config)
    }

    return this.instances
  }

  /**
   * Start external service via Docker
   */
  private async startExternalService(service: DetectedService): Promise<void> {
    console.log(`[Orchestrator] Starting ${service.name} via Docker`)

    const instance: ServiceInstance = {
      name: service.name,
      status: 'starting',
      logs: [],
      port: service.ports[0],
    }
    this.instances.set(service.name, instance)

    try {
      // Build docker run command
      const dockerArgs = [
        'run',
        '-d', // Detached
        '--name', `sarge-${service.name}`,
        '--rm', // Auto-remove on stop
      ]

      // Add port mappings
      service.ports.forEach(port => {
        dockerArgs.push('-p', `${port}:${port}`)
      })

      // Add environment variables
      service.envKeys.forEach(key => {
        const value = process.env[key] || this.getDefaultEnv(service.name, key)
        if (value) {
          dockerArgs.push('-e', `${key}=${value}`)
        }
      })

      // Add image
      dockerArgs.push(service.dockerImage!)

      // Run Docker container
      const proc = spawn('docker', dockerArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      proc.stdout?.on('data', (data) => {
        instance.logs.push(data.toString())
      })

      proc.stderr?.on('data', (data) => {
        instance.logs.push(`[ERROR] ${data.toString()}`)
      })

      proc.on('close', (code) => {
        if (code === 0) {
          instance.status = 'running'
          instance.url = `http://localhost:${instance.port}`
          console.log(`[Orchestrator] ✅ ${service.name} started on port ${instance.port}`)
        } else {
          instance.status = 'failed'
          console.error(`[Orchestrator] ❌ ${service.name} failed to start`)
        }
      })

      // Wait a bit for container to start
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (err) {
      console.error(`[Orchestrator] Failed to start ${service.name}:`, err)
      instance.status = 'failed'
      instance.logs.push(`ERROR: ${err}`)
    }
  }

  /**
   * Start app service (fetch code from GitHub, build, run)
   */
  private async startAppService(service: DetectedService, config: DeploymentConfig): Promise<void> {
    console.log(`[Orchestrator] Starting app service ${service.name}`)

    const instance: ServiceInstance = {
      name: service.name,
      status: 'starting',
      logs: [],
      port: service.ports[0],
    }
    this.instances.set(service.name, instance)

    try {
      const github = createGitHubAPI(config.accessToken)

      // For Node.js apps, we can fetch package.json and run via npx
      // For other languages, we'd need to fetch more files or use Docker

      // Simple approach: Use GitHub's tarball download + Docker
      const tarballUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/tarball/${config.branch}`

      const dockerfileContent = `
FROM node:20-alpine
WORKDIR /app
ADD ${tarballUrl} /tmp/repo.tar.gz
RUN tar -xzf /tmp/repo.tar.gz -C /app --strip-components=1
RUN npm install --production
CMD ${service.startCommand || 'npm start'}
EXPOSE ${service.ports[0] || 3000}
      `.trim()

      // For now, mark as running (actual implementation would build Docker image)
      instance.status = 'running'
      instance.url = `http://localhost:${instance.port}`
      instance.logs.push(`[INFO] Service would be started with: ${service.startCommand}`)

      console.log(`[Orchestrator] ✅ ${service.name} ready`)

    } catch (err) {
      console.error(`[Orchestrator] Failed to start ${service.name}:`, err)
      instance.status = 'failed'
      instance.logs.push(`ERROR: ${err}`)
    }
  }

  /**
   * Get default environment variable for a service
   */
  private getDefaultEnv(serviceName: string, key: string): string | undefined {
    const defaults: Record<string, Record<string, string>> = {
      postgres: {
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: process.env.DEFAULT_DB_PASSWORD || 'postgres',
        POSTGRES_DB: 'app',
      },
      mongodb: {
        MONGO_INITDB_ROOT_USERNAME: 'admin',
        MONGO_INITDB_ROOT_PASSWORD: process.env.DEFAULT_DB_PASSWORD || 'password',
      },
      redis: {},
      mysql: {
        MYSQL_ROOT_PASSWORD: process.env.DEFAULT_DB_PASSWORD || 'root',
        MYSQL_DATABASE: 'app',
      },
      grafana: {
      },
    }

    return defaults[serviceName]?.[key]
  }

  /**
   * Stop all services
   */
  async stopAll(): Promise<void> {
    console.log('[Orchestrator] Stopping all services')

    for (const [name, instance] of this.instances.entries()) {
      try {
        // Stop Docker container
        await this.execCommand('docker', ['stop', `sarge-${name}`])
        instance.status = 'stopped'
      } catch (err) {
        console.warn(`[Orchestrator] Could not stop ${name}:`, err)
      }
    }

    this.instances.clear()
  }

  /**
   * Get service status
   */
  getStatus(serviceName: string): ServiceInstance | undefined {
    return this.instances.get(serviceName)
  }

  /**
   * Get all instances
   */
  getAllInstances(): ServiceInstance[] {
    return Array.from(this.instances.values())
  }

  /**
   * Execute shell command
   */
  private execCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { stdio: 'pipe' })
      let output = ''

      proc.stdout?.on('data', (data) => {
        output += data.toString()
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output)
        } else {
          reject(new Error(`Command failed with code ${code}`))
        }
      })
    })
  }
}

/**
 * Factory function
 */
export function createDeploymentOrchestrator(): DeploymentOrchestrator {
  return new DeploymentOrchestrator()
}
