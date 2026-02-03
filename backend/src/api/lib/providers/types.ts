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

    // Get logs for a deployment
    getLogs(opts: GetLogsOptions): Promise<LogEntry[]>

    // Optional stack validation
    validateStack?(opts: DeployOptions): Promise<{ valid: boolean; errors?: string[] }>
}

export interface LogEntry {
    timestamp: string
    message: string
    stream?: string
    level?: 'info' | 'warn' | 'error'
}

export interface GetLogsOptions {
    deploymentId: string
    credentials: Record<string, string>
    limit?: number
    startTime?: number
    projectId?: string
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
