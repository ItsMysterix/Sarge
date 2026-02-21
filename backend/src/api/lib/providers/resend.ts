import { IProvider, DeployOptions, DeployResult, StatusOptions, DeploymentStatus, PreviewOptions, CostOptions, CostEstimate, ListEnvOptions, Environment, GetLogsOptions, LogEntry, DiscoverOptions, DiscoveredResource, ProviderMetric, SecurityFinding, DomainInfo, StorageInfo, FirewallInfo, UsageRecord, AnalyticsData } from './types'

export class ResendProvider implements IProvider {
    id = 'resend'
    name = 'Resend'
    kind: 'static' = 'static' // Email API
    valid = true
    errors: string[] = []

    private getToken(creds: Record<string, string>): string {
        return creds.resend_api_key || creds.token || ''
    }

    async deploy(opts: DeployOptions): Promise<DeployResult> {
        // Resend doesn't have an environment deployment, but configuring a domain or confirming keys.
        const token = this.getToken(opts.credentials)

        try {
            // Verify token / create an API key specifically for this project namespace
            const res = await fetch(`https://api.resend.com/api-keys`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: `sarge-${opts.projectId}-key`,
                    permission: 'full_access'
                })
            })

            const data = await res.json()
            if (!res.ok) {
                // Ignore if we can't create keys, we'll just consider it active
                return {
                    success: true,
                    deploymentId: `resend-${opts.projectId}`,
                    metadata: { type: 'existing_key' },
                    estimatedDuration: 1,
                }
            }

            return {
                success: true,
                deploymentId: data.id,
                metadata: {
                    apiKeyId: data.id,
                    projectApiKey: data.token,
                },
                estimatedDuration: 5,
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

    async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
        return {
            status: 'success',
            progress: 100,
            message: `Resend integration active`,
            logs: []
        }
    }

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
