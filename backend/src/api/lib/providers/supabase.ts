import { IProvider, DeployOptions, DeployResult, StatusOptions, DeploymentStatus, PreviewOptions, CostOptions, CostEstimate, ListEnvOptions, Environment, GetLogsOptions, LogEntry, DiscoverOptions, DiscoveredResource, ProviderMetric, SecurityFinding, DomainInfo, StorageInfo, FirewallInfo, UsageRecord, AnalyticsData } from './types'

export class SupabaseProvider implements IProvider {
    id = 'supabase'
    name = 'Supabase'
    kind: 'static' = 'static' // PaaS
    valid = true
    errors: string[] = []

    private getToken(creds: Record<string, string>): string {
        return creds.supabase_token || creds.token || ''
    }

    async deploy(opts: DeployOptions): Promise<DeployResult> {
        const token = this.getToken(opts.credentials)
        if (!token) throw new Error('Supabase token is missing')

        try {
            // Usually requires org_id, region, db_pass.
            // Simplified for demonstration of integrating Supabase mgmt api
            const res = await fetch(`https://api.supabase.com/v1/projects`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: `sarge-${opts.projectId}`,
                    organization_id: opts.credentials.supabase_org_id || 'default_org',
                    region: 'us-east-1',
                    plan: 'free',
                    db_pass: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Failed to trigger Supabase deployment')

            return {
                success: true,
                deploymentId: data.id,
                metadata: { supabaseProjectId: data.id, apiUrl: `https://${data.id}.supabase.co` },
                estimatedDuration: 180,
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
            // This is a mock API call, true API is /v1/projects
            const res = await fetch(`https://api.supabase.com/v1/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)

            const project = data.find((p: any) => p.id === opts.deploymentId)

            return {
                status: project?.status === 'ACTIVE_HEALTHY' ? 'success' : 'deploying',
                progress: project?.status === 'ACTIVE_HEALTHY' ? 100 : 50,
                message: project?.status || 'Unknown',
                logs: []
            }
        } catch (err) {
            return { status: 'failed', progress: 0, message: 'Failed to fetch status' }
        }
    }

    async generatePreviewUrl(opts: PreviewOptions): Promise<string> { return '' }
    async forecastPreDeploy(opts: CostOptions): Promise<CostEstimate> { return { hourlyRate: 0, monthlyEstimate: 0, breakdown: { base: 0 } } }
    async getActualSpend(opts: CostOptions & { credentials: Record<string, string> }): Promise<{ total: number; currency: string; breakdown: Record<string, number> }> { return { total: 0, currency: 'USD', breakdown: {} } }

    async discoverResources(opts: DiscoverOptions): Promise<DiscoveredResource[]> {
        const token = this.getToken(opts.credentials)
        if (!token) return []

        try {
            const res = await fetch(`https://api.supabase.com/v1/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            return (data || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                type: 'paas',
                status: p.status === 'ACTIVE_HEALTHY' ? 'active' : p.status,
                region: p.region,
                metadata: { org_id: p.organization_id }
            }))
        } catch { return [] }
    }

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
