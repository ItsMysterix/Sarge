import { IProvider, DeployOptions, DeployResult, StatusOptions, DeploymentStatus, PreviewOptions, CostOptions, CostEstimate, ListEnvOptions, Environment, GetLogsOptions, LogEntry, DiscoverOptions, DiscoveredResource, ProviderMetric, SecurityFinding, DomainInfo, StorageInfo, FirewallInfo, UsageRecord, AnalyticsData } from './types'

export class TursoProvider implements IProvider {
    id = 'turso'
    name = 'Turso'
    kind: 'static' = 'static' // Database
    valid = true
    errors: string[] = []

    private getToken(creds: Record<string, string>): string {
        return creds.turso_token || creds.token || ''
    }

    async deploy(opts: DeployOptions): Promise<DeployResult> {
        const token = this.getToken(opts.credentials)
        const org = opts.credentials.turso_org || 'default'

        try {
            const dbName = `sarge-${opts.projectId}`
            // create turso db
            const res = await fetch(`https://api.turso.tech/v1/organizations/${org}/databases`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: dbName,
                    group: "default",
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Failed to create Turso database')

            // Create token right away
            const tokenRes = await fetch(`https://api.turso.tech/v1/organizations/${org}/databases/${dbName}/auth/tokens`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            const tokenData = await tokenRes.json()

            const connectionUrl = `libsql://${data.database.hostname}?authToken=${tokenData.jwt}`

            return {
                success: true,
                deploymentId: data.database.DbId,
                metadata: { tursoDatabaseName: dbName, connectionUrl, hostname: data.database.hostname },
                estimatedDuration: 15,
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
            message: `Turso database active`,
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
