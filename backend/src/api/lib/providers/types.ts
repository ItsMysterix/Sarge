export interface IProvider {
    id: string
    name: string
    kind: 'containers' | 'functions' | 'static'
    valid: boolean
    errors?: string[]

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

    // --- K8s-specific (optional for non-K8s providers) ---

    // Scale replicas for a deployment
    scaleReplicas?(opts: ScaleOptions): Promise<ScaleResult>

    // Get CPU/memory usage per pod
    getResourceUsage?(opts: ResourceUsageOptions): Promise<ResourceUsage[]>

    // Rollout restart a deployment
    rolloutRestart?(opts: RolloutOptions): Promise<{ success: boolean; message: string }>

    // Deploy via Helm chart
    deployHelm?(opts: HelmDeployOptions): Promise<DeployResult>

    // Get metrics from provider (for unified aggregation)
    getMetrics?(opts: MetricsOptions): Promise<ProviderMetric[]>
}

// --- Core types ---

export interface LogEntry {
    timestamp: string
    message: string
    stream?: string
    level?: 'info' | 'warn' | 'error'
    service?: string
    provider?: string
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
        cpu?: number        // millicores (e.g., 500 = 0.5 CPU)
        memory?: number     // MB
        replicas?: number
    }
    // Deployment strategy
    strategy?: 'rolling' | 'blue-green' | 'canary'
    canaryPercent?: number  // 0-100, traffic % for canary
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
    breakdown: Record<string, number>
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

// --- K8s-specific types ---

export interface ScaleOptions {
    deploymentId: string
    namespace: string
    replicas: number
    credentials: Record<string, string>
}

export interface ScaleResult {
    success: boolean
    previousReplicas: number
    currentReplicas: number
    message: string
}

export interface ResourceUsageOptions {
    deploymentId: string
    namespace: string
    credentials: Record<string, string>
}

export interface ResourceUsage {
    podName: string
    cpuUsage: number        // millicores
    cpuLimit: number
    memoryUsage: number     // MB
    memoryLimit: number
    status: 'Running' | 'Pending' | 'CrashLoopBackOff' | 'Terminated'
    restartCount: number
    age: string
}

export interface RolloutOptions {
    deploymentId: string
    namespace: string
    credentials: Record<string, string>
}

export interface HelmDeployOptions {
    clusterId: string
    releaseName: string
    namespace: string
    chartName: string
    chartVersion?: string
    repository?: string
    values?: Record<string, any>
    credentials: Record<string, string>
}

// --- Metrics types (for unified aggregation) ---

export interface MetricsOptions {
    deploymentId: string
    credentials: Record<string, string>
    timeRange?: { start: number; end: number }
}

export interface ProviderMetric {
    name: string           // e.g., 'cpu_usage', 'memory_usage', 'request_count'
    value: number
    unit: string           // e.g., 'percent', 'MB', 'req/s'
    timestamp: string
    labels?: Record<string, string>
}
