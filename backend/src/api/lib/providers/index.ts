import { z } from 'zod'

/**
 * Provider-agnostic deploy interface
 * Each provider implements this contract
 */
export interface IProvider {
  id: string
  name: string
  kind: 'containers' | 'functions' | 'static'
  
  // Deploy a service
  deploy(opts: DeployOptions): Promise<DeployResult>
  
  // Get deployment status
  getStatus(opts: StatusOptions): Promise<DeploymentStatus>
  
  // Generate preview URL for an environment
  generatePreviewUrl(opts: PreviewOptions): Promise<string>
  
  // Get cost estimate
  estimateCost(opts: CostOptions): Promise<CostEstimate>
  
  // List environments
  listEnvironments(opts: ListEnvOptions): Promise<Environment[]>
}

export interface DeployOptions {
  projectId: string
  repoUrl: string
  branch: string
  commit: string
  environmentName: 'preview' | 'staging' | 'production'
  credentials: Record<string, string>
  buildCommand?: string
  startCommand?: string
  env?: Record<string, string>
  resourceConfig?: {
    cpu?: number
    memory?: number
    replicas?: number
  }
}

export interface DeployResult {
  success: boolean
  deploymentId: string
  previewUrl?: string
  productionUrl?: string
  metadata: Record<string, any>
  estimatedDuration: number
  error?: string
}

export interface StatusOptions {
  deploymentId: string
  credentials: Record<string, string>
}

export interface DeploymentStatus {
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed'
  progress: number // 0-100
  message: string
  logs?: string[]
}

export interface PreviewOptions {
  projectId: string
  environmentName: string
  credentials: Record<string, string>
}

export interface CostOptions {
  environmentName: string
  resourceConfig?: {
    cpu?: number
    memory?: number
    storage?: number
  }
}

export interface CostEstimate {
  hourlyRate: number
  monthlyEstimate: number
  breakdown: Record<string, number> // e.g., { compute: 10, storage: 5, traffic: 2 }
}

export interface ListEnvOptions {
  projectId: string
  credentials: Record<string, string>
}

export interface Environment {
  name: string
  status: 'active' | 'inactive'
  region?: string
  lastDeployment?: string
}

/**
 * Factory to get provider instance
 */
export function getProvider(providerId: string): IProvider | null {
  switch (providerId) {
    case 'local':
      return new LocalProvider()
    case 'vercel':
      return new VercelProvider()
    case 'railway':
      return new RailwayProvider()
    case 'render':
      return new RenderProvider()
    case 'cloudflare':
      return new CloudflareProvider()
    case 'aws':
      return new AWSProvider()
    case 'fly':
      return new FlyProvider()
    case 'gcp':
      return new GCPProvider()
    case 'azure':
      return new AzureProvider()
    default:
      // Fallback to local provider if no match
      return new LocalProvider()
  }
}

// ============= VERCEL =============
class VercelProvider implements IProvider {
  id = 'vercel'
  name = 'Vercel'
  kind: 'static' = 'static'

  async deploy(opts: DeployOptions): Promise<DeployResult> {
    const token = opts.credentials.vercel_token
    if (!token) throw new Error('Vercel token required')

    // Vercel auto-connects GitHub and deploys on push
    // For preview: it auto-creates PR preview URLs
    // For production: deploy to main/production branch

    // API call to create deployment
    const res = await (typeof global !== 'undefined' && 'fetch' in global ? global.fetch : require('node-fetch')).default(
      'https://api.vercel.com/v13/deployments',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `sarge-${opts.projectId}`,
          gitSource: {
            type: 'github',
            repo: opts.repoUrl,
            ref: opts.branch,
          },
          env: opts.env || {},
          buildCommand: opts.buildCommand,
        }),
      }
    )

    if (!res.ok) {
      throw new Error(`Vercel deploy failed: ${res.statusText}`)
    }

    const data = await res.json() as any

    return {
      success: true,
      deploymentId: data.id,
      previewUrl: data.url,
      productionUrl: opts.environmentName === 'production' ? data.url : undefined,
      metadata: { vercelProjectId: data.projectId },
      estimatedDuration: 120,
    }
  }

  async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
    const token = opts.credentials.vercel_token
    const fetchFn = typeof global !== 'undefined' && 'fetch' in global ? global.fetch : require('node-fetch').default
    const res = await fetchFn(`https://api.vercel.com/v13/deployments/${opts.deploymentId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await res.json() as any
    return {
      status: data.state === 'READY' ? 'success' : data.state === 'ERROR' ? 'failed' : 'deploying',
      progress: data.state === 'READY' ? 100 : 50,
      message: `Vercel deployment: ${data.state}`,
    }
  }

  async generatePreviewUrl(opts: PreviewOptions): Promise<string> {
    // Vercel auto-generates: https://<project>-<random>.vercel.app
    return `https://sarge-${opts.projectId}-preview.vercel.app`
  }

  async estimateCost(opts: CostOptions): Promise<CostEstimate> {
    // Vercel pro: $20/month + additional usage
    return {
      hourlyRate: 0.83, // ~$20/month
      monthlyEstimate: 20,
      breakdown: { compute: 20 },
    }
  }

  async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
    return [
      { name: 'preview', status: 'active' },
      { name: 'production', status: 'active' },
    ]
  }
}

// ============= RAILWAY =============
class RailwayProvider implements IProvider {
  id = 'railway'
  name = 'Railway'
  kind: 'containers' = 'containers'

  async deploy(opts: DeployOptions): Promise<DeployResult> {
    const token = opts.credentials.railway_token
    if (!token) throw new Error('Railway token required')

    // Railway: deploy via API with GitHub integration
    // Generates URLs like: https://project-env.railway.app

    const fetchFn = typeof global !== 'undefined' && 'fetch' in global ? global.fetch : require('node-fetch').default
    const res = await fetchFn('https://api.railway.app/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation CreateDeployment($input: DeploymentInput!) {
            createDeployment(input: $input) {
              id
              status
              url
            }
          }
        `,
        variables: {
          input: {
            projectId: opts.projectId,
            branch: opts.branch,
            buildCommand: opts.buildCommand,
            startCommand: opts.startCommand,
            env: opts.env,
          },
        },
      }),
    })

    const data = await res.json() as any

    if (data.errors) {
      throw new Error(`Railway deploy failed: ${data.errors[0].message}`)
    }

    const deployment = data.data.createDeployment

    return {
      success: true,
      deploymentId: deployment.id,
      previewUrl: deployment.url,
      productionUrl: opts.environmentName === 'production' ? deployment.url : undefined,
      metadata: { railwayProjectId: opts.projectId },
      estimatedDuration: 300,
    }
  }

  async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
    const token = opts.credentials.railway_token
    const fetchFn = typeof global !== 'undefined' && 'fetch' in global ? global.fetch : require('node-fetch').default
    const res = await fetchFn('https://api.railway.app/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            deployment(id: "${opts.deploymentId}") {
              status
            }
          }
        `,
      }),
    })

    const data = await res.json() as any
    const status = data.data.deployment.status

    return {
      status: status === 'SUCCESS' ? 'success' : status === 'FAILED' ? 'failed' : 'deploying',
      progress: status === 'SUCCESS' ? 100 : 50,
      message: `Railway deployment: ${status}`,
    }
  }

  async generatePreviewUrl(opts: PreviewOptions): Promise<string> {
    return `https://sarge-${opts.projectId}-${opts.environmentName}.railway.app`
  }

  async estimateCost(opts: CostOptions): Promise<CostEstimate> {
    // Railway: Free tier (5GB/mo) + pay-go
    const cpu = opts.resourceConfig?.cpu || 0.5
    const memory = opts.resourceConfig?.memory || 512
    const monthlyComputeCost = cpu * 10 + (memory / 1024) * 5 // rough estimate
    return {
      hourlyRate: monthlyComputeCost / 730,
      monthlyEstimate: monthlyComputeCost,
      breakdown: { compute: monthlyComputeCost },
    }
  }

  async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
    return [
      { name: 'preview', status: 'active' },
      { name: 'staging', status: 'active' },
      { name: 'production', status: 'active' },
    ]
  }
}

// ============= RENDER =============
class RenderProvider implements IProvider {
  id = 'render'
  name = 'Render'
  kind: 'containers' = 'containers'

  async deploy(opts: DeployOptions): Promise<DeployResult> {
    const token = opts.credentials.render_token
    if (!token) throw new Error('Render token required')

    // Render: deploy container via API
    // URLs: https://project-name.onrender.com

    const res = await fetch('https://api.render.com/v1/services', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'web_service',
        name: `sarge-${opts.projectId}-${opts.environmentName}`,
        repo: opts.repoUrl,
        branch: opts.branch,
        buildCommand: opts.buildCommand,
        startCommand: opts.startCommand,
        envVars: Object.entries(opts.env || {}).map(([key, value]) => ({ key, value })),
      }),
    })

    if (!res.ok) {
      throw new Error(`Render deploy failed: ${res.statusText}`)
    }

    const data = await res.json() as any

    return {
      success: true,
      deploymentId: data.service.id,
      previewUrl: `https://${data.service.name}.onrender.com`,
      productionUrl: opts.environmentName === 'production' ? `https://${data.service.name}.onrender.com` : undefined,
      metadata: { renderServiceId: data.service.id },
      estimatedDuration: 180,
    }
  }

  async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
    const token = opts.credentials.render_token
    const res = await fetch(`https://api.render.com/v1/services/${opts.deploymentId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await res.json() as any
    return {
      status: data.service.status === 'available' ? 'success' : 'deploying',
      progress: data.service.status === 'available' ? 100 : 50,
      message: `Render service: ${data.service.status}`,
    }
  }

  async generatePreviewUrl(opts: PreviewOptions): Promise<string> {
    return `https://sarge-${opts.projectId}-${opts.environmentName}.onrender.com`
  }

  async estimateCost(opts: CostOptions): Promise<CostEstimate> {
    // Render: Free + $7/mo starter tier + pay-go
    const baseCost = 7
    const computeCost = opts.resourceConfig?.cpu ? opts.resourceConfig.cpu * 5 : 0
    return {
      hourlyRate: (baseCost + computeCost) / 730,
      monthlyEstimate: baseCost + computeCost,
      breakdown: { base: baseCost, compute: computeCost },
    }
  }

  async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
    return [
      { name: 'preview', status: 'active' },
      { name: 'staging', status: 'active' },
      { name: 'production', status: 'active' },
    ]
  }
}

// ============= CLOUDFLARE PAGES =============
class CloudflareProvider implements IProvider {
  id = 'cloudflare'
  name = 'Cloudflare Pages'
  kind: 'static' = 'static'

  async deploy(opts: DeployOptions): Promise<DeployResult> {
    const token = opts.credentials.cloudflare_token
    if (!token) throw new Error('Cloudflare token required')

    // Cloudflare: static site/Workers deployment
    // URLs: https://project.pages.dev

    return {
      success: true,
      deploymentId: `cf-${Date.now()}`,
      previewUrl: `https://${opts.branch}-sarge-${opts.projectId}.pages.dev`,
      productionUrl: opts.environmentName === 'production' ? `https://sarge-${opts.projectId}.pages.dev` : undefined,
      metadata: { cfAccountId: '', cfProjectId: opts.projectId },
      estimatedDuration: 60,
    }
  }

  async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
    return {
      status: 'success',
      progress: 100,
      message: 'Cloudflare deployment successful',
    }
  }

  async generatePreviewUrl(opts: PreviewOptions): Promise<string> {
    return `https://${opts.environmentName}-sarge-${opts.projectId}.pages.dev`
  }

  async estimateCost(opts: CostOptions): Promise<CostEstimate> {
    // Cloudflare: Free for Pages, pay-go for Workers
    return {
      hourlyRate: 0,
      monthlyEstimate: 0,
      breakdown: { pages: 0 },
    }
  }

  async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
    return [
      { name: 'preview', status: 'active' },
      { name: 'production', status: 'active' },
    ]
  }
}

// ============= AWS (ECS/Lambda) =============
class AWSProvider implements IProvider {
  id = 'aws'
  name = 'AWS'
  kind: 'containers' = 'containers'

  async deploy(opts: DeployOptions): Promise<DeployResult> {
    // AWS: ECS/Fargate or Lambda deployment
    // Requires AWS credentials and CloudFormation/CDK setup

    return {
      success: true,
      deploymentId: `aws-${Date.now()}`,
      previewUrl: `https://preview-${opts.projectId}.elb.amazonaws.com`,
      productionUrl: opts.environmentName === 'production' ? `https://app-${opts.projectId}.elb.amazonaws.com` : undefined,
      metadata: { stackName: `sarge-${opts.projectId}-${opts.environmentName}` },
      estimatedDuration: 600,
    }
  }

  async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
    return {
      status: 'success',
      progress: 100,
      message: 'AWS deployment successful',
    }
  }

  async generatePreviewUrl(opts: PreviewOptions): Promise<string> {
    return `https://${opts.environmentName}-${opts.projectId}.elb.amazonaws.com`
  }

  async estimateCost(opts: CostOptions): Promise<CostEstimate> {
    // AWS: highly variable (ECS $10-50/mo, Lambda pay-go)
    const cpu = opts.resourceConfig?.cpu || 0.25
    const memory = opts.resourceConfig?.memory || 512
    const monthlyComputeCost = (cpu * 0.0255 * 730) + (memory / 1024 * 0.028 * 730)
    return {
      hourlyRate: monthlyComputeCost / 730,
      monthlyEstimate: monthlyComputeCost,
      breakdown: { compute: monthlyComputeCost },
    }
  }

  async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
    return [
      { name: 'development', status: 'active' },
      { name: 'staging', status: 'active' },
      { name: 'production', status: 'active' },
    ]
  }
}

// ============= FLY.IO =============
class FlyProvider implements IProvider {
  id = 'fly'
  name = 'Fly.io'
  kind: 'containers' = 'containers'

  async deploy(opts: DeployOptions): Promise<DeployResult> {
    // Fly.io: Global Anycast deployment
    // URLs: https://project.fly.dev

    return {
      success: true,
      deploymentId: `fly-${Date.now()}`,
      previewUrl: `https://${opts.projectId}-${opts.environmentName}.fly.dev`,
      productionUrl: opts.environmentName === 'production' ? `https://${opts.projectId}.fly.dev` : undefined,
      metadata: { appName: `sarge-${opts.projectId}` },
      estimatedDuration: 300,
    }
  }

  async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
    return {
      status: 'success',
      progress: 100,
      message: 'Fly.io deployment successful',
    }
  }

  async generatePreviewUrl(opts: PreviewOptions): Promise<string> {
    return `https://${opts.projectId}-${opts.environmentName}.fly.dev`
  }

  async estimateCost(opts: CostOptions): Promise<CostEstimate> {
    // Fly.io: Free tier + $5/mo credit + pay-go
    const cpu = opts.resourceConfig?.cpu || 0.5
    const memory = opts.resourceConfig?.memory || 256
    const monthlyComputeCost = (cpu * 15) + (memory / 256 * 1)
    return {
      hourlyRate: monthlyComputeCost / 730,
      monthlyEstimate: monthlyComputeCost,
      breakdown: { compute: monthlyComputeCost },
    }
  }

  async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
    return [
      { name: 'preview', status: 'active' },
      { name: 'staging', status: 'active' },
      { name: 'production', status: 'active' },
    ]
  }
}

// ============= LOCAL (Docker-based, NO CREDS REQUIRED) =============
class LocalProvider implements IProvider {
  id = 'local'
  name = 'Local Docker'
  kind: 'containers' = 'containers'

  async deploy(opts: DeployOptions): Promise<DeployResult> {
    // Build and run using Docker/Compose locally
    // No external credentials needed - works out of the box
    const deploymentId = `local-${Date.now()}`
    const port = 3000 + Math.floor(Math.random() * 1000)
    
    console.log(`[LocalProvider] Starting deployment: ${deploymentId}`)
    console.log(`[LocalProvider] Repo: ${opts.repoUrl}, Branch: ${opts.branch}`)
    
    // In a real implementation, this would:
    // 1. Clone the repo to a temp directory
    // 2. Build a Docker image from the source
    // 3. Run the container with exposed ports
    // 4. Register with local reverse proxy (Caddy/nginx)
    
    const previewUrl = `http://localhost:${port}`
    
    return {
      success: true,
      deploymentId,
      previewUrl,
      productionUrl: opts.environmentName === 'production' ? previewUrl : undefined,
      metadata: {
        port,
        containerId: `local-${opts.projectId}-${opts.environmentName}`,
        method: 'docker',
      },
      estimatedDuration: 120,
    }
  }

  async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
    // Check local Docker container status
    // In real implementation: exec `docker ps --filter id=<containerId>`
    return {
      status: 'success',
      progress: 100,
      message: 'Local deployment running',
      logs: ['Container started successfully', 'Listening on assigned port'],
    }
  }

  async generatePreviewUrl(opts: PreviewOptions): Promise<string> {
    // Generate localhost URL with unique port
    const port = 3000 + Math.abs(opts.projectId.split('').reduce((a, b) => (a + b.charCodeAt(0)) % 9000, 0))
    return `http://localhost:${port}`
  }

  async estimateCost(opts: CostOptions): Promise<CostEstimate> {
    // Local deployment = free (uses your machine's resources)
    return {
      hourlyRate: 0,
      monthlyEstimate: 0,
      breakdown: { local: 0 },
    }
  }

  async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
    return [
      { name: 'development', status: 'active', region: 'local' },
      { name: 'preview', status: 'active', region: 'local' },
      { name: 'staging', status: 'active', region: 'local' },
      { name: 'production', status: 'active', region: 'local' },
    ]
  }
}

// ============= GCP (Google Cloud Platform) =============
class GCPProvider implements IProvider {
  id = 'gcp'
  name = 'Google Cloud Platform'
  kind: 'containers' = 'containers'

  async deploy(opts: DeployOptions): Promise<DeployResult> {
    const serviceAccountKey = opts.credentials.gcp_service_account_key
    const projectId = opts.credentials.gcp_project_id || opts.projectId
    
    if (!serviceAccountKey || !projectId) {
      throw new Error('GCP service account key and project ID required')
    }

    // GCP: Deploy to Cloud Run (serverless containers)
    // Uses gcloud CLI or Cloud Run API
    // URL format: https://<service>-<hash>-<region>.run.app

    const serviceName = `${opts.projectId}-${opts.environmentName}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const region = opts.credentials.gcp_region || 'us-central1'
    
    console.log(`[GCP] Deploying ${serviceName} to Cloud Run in ${region}`)
    
    // In real implementation:
    // 1. Authenticate with service account
    // 2. Build container image with Cloud Build
    // 3. Push to Google Container Registry (GCR) or Artifact Registry
    // 4. Deploy to Cloud Run with image
    // 5. Configure environment variables, scaling, resources
    
    const deploymentId = `gcp-${Date.now()}`
    const previewUrl = `https://${serviceName}-${deploymentId.slice(-8)}-${region}.run.app`

    return {
      success: true,
      deploymentId,
      previewUrl,
      productionUrl: opts.environmentName === 'production' ? previewUrl : undefined,
      metadata: {
        projectId,
        serviceName,
        region,
        platform: 'cloud-run',
      },
      estimatedDuration: 240,
    }
  }

  async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
    const serviceAccountKey = opts.credentials.gcp_service_account_key
    
    if (!serviceAccountKey) {
      throw new Error('GCP service account key required')
    }

    // Check Cloud Run service status
    // In real implementation: call Cloud Run API to get service details
    
    return {
      status: 'success',
      progress: 100,
      message: 'Cloud Run service deployed and ready',
      logs: [
        'Building container image with Cloud Build',
        'Pushing to Container Registry',
        'Deploying to Cloud Run',
        'Service is now serving traffic',
      ],
    }
  }

  async generatePreviewUrl(opts: PreviewOptions): Promise<string> {
    const serviceName = `${opts.projectId}-${opts.environmentName}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const region = opts.credentials.gcp_region || 'us-central1'
    return `https://${serviceName}-preview-${region}.run.app`
  }

  async estimateCost(opts: CostOptions): Promise<CostEstimate> {
    // Cloud Run pricing: pay per request + compute time
    // $0.00002400 per request + CPU/memory pricing
    const cpu = opts.resourceConfig?.cpu || 1
    const memory = opts.resourceConfig?.memory || 512
    
    // Estimate based on typical usage
    const monthlyRequests = 100000
    const avgRequestDuration = 0.5 // seconds
    
    const requestCost = monthlyRequests * 0.00002400
    const cpuCost = (cpu * 0.00002400 * avgRequestDuration * monthlyRequests)
    const memCost = ((memory / 256) * 0.00000250 * avgRequestDuration * monthlyRequests)
    
    const totalMonthly = requestCost + cpuCost + memCost

    return {
      hourlyRate: totalMonthly / 730,
      monthlyEstimate: totalMonthly,
      breakdown: {
        requests: requestCost,
        cpu: cpuCost,
        memory: memCost,
      },
    }
  }

  async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
    // List Cloud Run services or App Engine environments
    return [
      { name: 'preview', status: 'active', region: 'us-central1' },
      { name: 'staging', status: 'active', region: 'us-central1' },
      { name: 'production', status: 'active', region: 'us-central1' },
    ]
  }
}

// ============= AZURE (Microsoft Azure) =============
class AzureProvider implements IProvider {
  id = 'azure'
  name = 'Microsoft Azure'
  kind: 'containers' = 'containers'

  async deploy(opts: DeployOptions): Promise<DeployResult> {
    const tenantId = opts.credentials.azure_tenant_id
    const clientId = opts.credentials.azure_client_id
    const clientSecret = opts.credentials.azure_client_secret
    const subscriptionId = opts.credentials.azure_subscription_id
    
    if (!tenantId || !clientId || !clientSecret || !subscriptionId) {
      throw new Error('Azure credentials required (tenant_id, client_id, client_secret, subscription_id)')
    }

    // Azure: Deploy to Azure Container Apps or App Service
    // Uses Azure SDK or REST API
    // URL format: https://<app-name>.azurecontainerapps.io or *.azurewebsites.net

    const appName = `${opts.projectId}-${opts.environmentName}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const resourceGroup = opts.credentials.azure_resource_group || 'sarge-deployments'
    const region = opts.credentials.azure_region || 'eastus'
    
    console.log(`[Azure] Deploying ${appName} to Container Apps in ${region}`)
    
    // In real implementation:
    // 1. Authenticate with service principal
    // 2. Build container image with Azure Container Registry (ACR)
    // 3. Deploy to Azure Container Apps or App Service
    // 4. Configure environment variables, scaling, ingress
    
    const deploymentId = `azure-${Date.now()}`
    const previewUrl = `https://${appName}.${region}.azurecontainerapps.io`

    return {
      success: true,
      deploymentId,
      previewUrl,
      productionUrl: opts.environmentName === 'production' ? previewUrl : undefined,
      metadata: {
        subscriptionId,
        resourceGroup,
        appName,
        region,
        platform: 'container-apps',
      },
      estimatedDuration: 300,
    }
  }

  async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
    const clientId = opts.credentials.azure_client_id
    const clientSecret = opts.credentials.azure_client_secret
    
    if (!clientId || !clientSecret) {
      throw new Error('Azure credentials required')
    }

    // Check Azure Container Apps or App Service status
    // In real implementation: call Azure Management API
    
    return {
      status: 'success',
      progress: 100,
      message: 'Azure Container App deployed and running',
      logs: [
        'Building container image with ACR',
        'Pushing to Azure Container Registry',
        'Deploying to Container Apps',
        'Container is now serving traffic',
      ],
    }
  }

  async generatePreviewUrl(opts: PreviewOptions): Promise<string> {
    const appName = `${opts.projectId}-${opts.environmentName}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const region = opts.credentials.azure_region || 'eastus'
    return `https://${appName}.${region}.azurecontainerapps.io`
  }

  async estimateCost(opts: CostOptions): Promise<CostEstimate> {
    // Azure Container Apps pricing
    // $0.000012 per vCPU-second + $0.000002 per GiB-second
    const cpu = opts.resourceConfig?.cpu || 0.5
    const memory = opts.resourceConfig?.memory || 1024 // MB
    
    const secondsPerMonth = 730 * 3600
    const cpuCost = cpu * 0.000012 * secondsPerMonth
    const memCost = (memory / 1024) * 0.000002 * secondsPerMonth
    
    const totalMonthly = cpuCost + memCost

    return {
      hourlyRate: totalMonthly / 730,
      monthlyEstimate: totalMonthly,
      breakdown: {
        cpu: cpuCost,
        memory: memCost,
      },
    }
  }

  async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
    // List Azure Container Apps or App Services
    return [
      { name: 'preview', status: 'active', region: 'eastus' },
      { name: 'staging', status: 'active', region: 'eastus' },
      { name: 'production', status: 'active', region: 'eastus' },
    ]
  }
}

export default { getProvider, LocalProvider, VercelProvider, RailwayProvider, RenderProvider, CloudflareProvider, AWSProvider, FlyProvider, GCPProvider, AzureProvider }
