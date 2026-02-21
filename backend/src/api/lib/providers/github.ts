import { IProvider, DeployOptions, DeployResult, StatusOptions, DeploymentStatus, PreviewOptions, CostOptions, CostEstimate, ListEnvOptions, Environment, GetLogsOptions, LogEntry, DiscoverOptions, DiscoveredResource, ProviderMetric, SecurityFinding, DomainInfo, StorageInfo, FirewallInfo, UsageRecord, AnalyticsData } from './types'

export class GithubProvider implements IProvider {
    id = 'github'
    name = 'GitHub'
    kind: 'static' = 'static' // Automation API
    valid = true
    errors: string[] = []

    private getToken(creds: Record<string, string>): string {
        return creds.github_token || creds.token || ''
    }

    async deploy(opts: DeployOptions): Promise<DeployResult> {
        // Here we could trigger a GitHub Action deployment workflow via api
        const token = this.getToken(opts.credentials)
        if (!token) throw new Error('GitHub token missing')

        try {
            // Triggering repository dispatch event 
            const repoParts = opts.repoUrl?.replace('https://github.com/', '').split('/')
            if (!repoParts || repoParts.length < 2) throw new Error('Invalid GitHub repo URL')

            const res = await fetch(`https://api.github.com/repos/${repoParts[0]}/${repoParts[1]}/dispatches`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    event_type: 'sarge_deploy',
                    client_payload: {
                        environment: opts.environmentName,
                        project: opts.projectId
                    }
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Failed to trigger GitHub Action')
            }

            return {
                success: true,
                deploymentId: `gh-${Date.now()}`,
                metadata: { repoUrl: opts.repoUrl, branch: opts.branch },
                estimatedDuration: 10,
            }
        } catch (err) {
            return {
                success: false,
                deploymentId: '',
                error: err instanceof Error ? err.message : 'Unknown error',
                metadata: {},
                estimatedDuration: 0
            }
        }
    }

    async getStatus(opts: StatusOptions): Promise<DeploymentStatus> { return { status: 'success', progress: 100, message: `GitHub action dispatched`, logs: [] } }
    async generatePreviewUrl(opts: PreviewOptions): Promise<string> { return '' }
    async forecastPreDeploy(opts: CostOptions): Promise<CostEstimate> { return { hourlyRate: 0, monthlyEstimate: 0, breakdown: { base: 0 } } }
    async getActualSpend(opts: CostOptions & { credentials: Record<string, string> }): Promise<{ total: number; currency: string; breakdown: Record<string, number> }> { return { total: 0, currency: 'USD', breakdown: {} } }
    async discoverResources(opts: DiscoverOptions): Promise<DiscoveredResource[]> { return [] }
    async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> { return [{ name: 'production', status: 'active' }] }
    async getLogs(opts: GetLogsOptions): Promise<LogEntry[]> { return [] }
    async getAccountLogs(opts: { credentials: Record<string, string>; resourceId?: string; limit?: number }): Promise<LogEntry[]> { return [] }
    async getAccountMetrics(opts: { credentials: Record<string, string>; resourceId?: string; timeRange: string }): Promise<ProviderMetric[]> { return [] }
    async getSecurityAlerts(opts: { credentials: Record<string, string> }): Promise<SecurityFinding[]> { return [] }
    async getAuditLogs(opts: { credentials: Record<string, string>; limit?: number }): Promise<LogEntry[]> { return [] }
    async getDomains(opts: { credentials: Record<string, string> }): Promise<DomainInfo[]> { return [] }
    async getStorage(opts: { credentials: Record<string, string> }): Promise<StorageInfo[]> { return [] }
    async getFirewall(opts: { credentials: Record<string, string> }): Promise<FirewallInfo[]> { return [] }
    async getDetailedUsage(opts: { credentials: Record<string, string> }): Promise<UsageRecord[]> { return [] }
    async getAnalytics(opts: { credentials: Record<string, string> }): Promise<AnalyticsData[]> { return [] }
}
