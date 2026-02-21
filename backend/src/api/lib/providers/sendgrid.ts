import { IProvider, DeployOptions, DeployResult, StatusOptions, DeploymentStatus, PreviewOptions, CostOptions, CostEstimate, ListEnvOptions, Environment, GetLogsOptions, LogEntry, DiscoverOptions, DiscoveredResource, ProviderMetric, SecurityFinding, DomainInfo, StorageInfo, FirewallInfo, UsageRecord, AnalyticsData } from './types'

export class SendGridProvider implements IProvider {
    id = 'sendgrid'
    name = 'SendGrid'
    kind: 'static' = 'static' // Email API
    valid = true
    errors: string[] = []

    private getToken(creds: Record<string, string>): string {
        return creds.sendgrid_api_key || creds.token || ''
    }

    async deploy(opts: DeployOptions): Promise<DeployResult> {
        // SendGrid API isn't built around project namespaces tightly for easy sub-api-keys on a consumer level.
        // It's mostly just verifying the API key can be used.
        const token = this.getToken(opts.credentials)

        try {
            const res = await fetch(`https://api.sendgrid.com/v3/scopes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.errors?.[0]?.message || 'Failed to authenticate with SendGrid')

            return {
                success: true,
                deploymentId: `sg-${Date.now()}`,
                metadata: {
                    verified: true,
                    scopesCount: data.scopes?.length || 0,
                },
                estimatedDuration: 1,
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
            message: `Sendgrid integration active`,
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
