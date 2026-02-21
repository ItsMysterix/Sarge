import { IProvider, DeployOptions, DeployResult, StatusOptions, DeploymentStatus, PreviewOptions, CostOptions, CostEstimate, ListEnvOptions, Environment, GetLogsOptions, LogEntry, DiscoverOptions, DiscoveredResource, ProviderMetric, SecurityFinding, DomainInfo, StorageInfo, FirewallInfo, UsageRecord, AnalyticsData } from './types'

export class NeonProvider implements IProvider {
    id = 'neon'
    name = 'Neon'
    kind: 'static' = 'static' // Database but acts like static interface
    valid = true
    errors: string[] = []

    private getToken(creds: Record<string, string>): string {
        return creds.neon_token || creds.token || ''
    }

    async deploy(opts: DeployOptions): Promise<DeployResult> {
        const token = this.getToken(opts.credentials)
        if (!token) throw new Error('Neon token is missing')

        try {
            // Neon API: Create Project
            const createRes = await fetch(`https://console.neon.tech/api/v2/projects`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    project: {
                        name: `sarge-${opts.projectId}`,
                        pg_version: 15,
                        region_id: 'aws-us-east-1'
                    }
                })
            })

            const data = await createRes.json()
            if (!createRes.ok) throw new Error(data.message || 'Failed to trigger Neon deployment')

            const projectId = data.project.id
            const branchId = data.branch.id
            const dbName = data.databases[0].name
            const roleName = data.roles[0].name
            const password = data.roles[0].password
            const endpoint = data.endpoints[0].host

            const connectionUrl = `postgresql://${roleName}:${password}@${endpoint}/${dbName}?sslmode=require`

            return {
                success: true,
                deploymentId: projectId,
                metadata: { neonProjectId: projectId, connectionUrl, branchId },
                estimatedDuration: 60,
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
        const token = this.getToken(opts.credentials)
        try {
            const res = await fetch(`https://console.neon.tech/api/v2/projects/${opts.deploymentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)

            return {
                status: 'success',
                progress: 100,
                message: `Neon project active`,
                logs: []
            }
        } catch (err) {
            return { status: 'failed', progress: 0, message: 'Failed to fetch status' }
        }
    }

    async generatePreviewUrl(opts: PreviewOptions): Promise<string> {
        return ''
    }

    async forecastPreDeploy(opts: CostOptions): Promise<CostEstimate> {
        return {
            hourlyRate: 0,
            monthlyEstimate: 0,
            breakdown: { base: 0 },
        }
    }

    async getActualSpend(opts: CostOptions & { credentials: Record<string, string> }): Promise<{ total: number; currency: string; breakdown: Record<string, number> }> {
        return {
            total: 0,
            currency: 'USD',
            breakdown: {}
        }
    }

    async discoverResources(opts: DiscoverOptions): Promise<DiscoveredResource[]> {
        const token = this.getToken(opts.credentials)
        if (!token) return []

        try {
            const res = await fetch(`https://console.neon.tech/api/v2/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            return (data.projects || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                type: 'database',
                status: 'active',
                region: p.region_id,
                metadata: { pg_version: p.pg_version }
            }))
        } catch { return [] }
    }

    async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
        return [{ name: 'production', status: 'active' }]
    }

    async getLogs(opts: GetLogsOptions): Promise<LogEntry[]> {
        return []
    }

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
