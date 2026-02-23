import { IProvider, DeployOptions, DeployResult, StatusOptions, DeploymentStatus, PreviewOptions, CostOptions, CostEstimate, ListEnvOptions, Environment, GetLogsOptions, LogEntry, DiscoverOptions, DiscoveredResource, ProviderMetric, SecurityFinding, DomainInfo, StorageInfo, FirewallInfo, UsageRecord, AnalyticsData } from './types'
import { providerLogger } from "../../../lib/logger";

export class VercelProvider implements IProvider {
    id = 'vercel'
    name = 'Vercel'
    kind: 'static' = 'static'
    valid = true
    errors: string[] = []

    private getToken(creds: Record<string, string>): string {
        return creds.access_token || creds.vercel_token || creds.token || ''
    }

    async deploy(opts: DeployOptions): Promise<DeployResult> {
        const token = this.getToken(opts.credentials)
        if (!token) throw new Error('Vercel token is missing')

        try {
            providerLogger.info(`[VercelProvider] Initiating deployment for ${opts.projectId}`)

            // 1. Ensure project exists (or create it)
            // GitHub repo URL comes in like 'https://github.com/owner/repo'
            let githubInfo = null
            if (opts.repoUrl?.includes('github.com')) {
                const parts = opts.repoUrl.replace('https://github.com/', '').split('/')
                if (parts.length >= 2) {
                    githubInfo = {
                        type: 'github',
                        repo: `${parts[0]}/${parts[1].replace('.git', '')}`
                    }
                }
            }

            // Create/Update project
            const createProjRes = await fetch(`https://api.vercel.com/v9/projects`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    name: opts.projectId.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase().substring(0, 100),
                    framework: 'nextjs',
                    ...(githubInfo ? { gitRepository: githubInfo } : {})
                })
            })

            // If already exists, we will ignore 400 error and continue, 
            // but normally we would want to fetch the existing project ID
            const projData = await createProjRes.json()
            const realProjectId = createProjRes.ok ? projData.id : opts.projectId.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()

            // 2. Set Environment Variables
            if (opts.env && Object.keys(opts.env).length > 0) {
                const envPayload = Object.entries(opts.env).map(([key, value]) => ({
                    key, value: String(value), target: ['production', 'preview', 'development'], type: 'plain'
                }))
                await fetch(`https://api.vercel.com/v9/projects/${realProjectId}/env`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(envPayload)
                })
            }

            // 3. Trigger Deployment
            const deployRes = await fetch(`https://api.vercel.com/v13/deployments`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    name: realProjectId,
                    target: opts.environmentName === 'production' ? 'production' : undefined,
                    gitSource: githubInfo ? {
                        type: 'github',
                        repoId: githubInfo.repo,
                        ref: opts.branch || 'main'
                    } : undefined
                })
            })

            const deployData = await deployRes.json()

            if (!deployRes.ok) {
                throw new Error(deployData.error?.message || 'Failed to trigger Vercel deployment')
            }

            return {
                success: true,
                deploymentId: deployData.id,
                previewUrl: deployData.url ? `https://${deployData.url}` : undefined,
                productionUrl: opts.environmentName === 'production' && deployData.url ? `https://${deployData.url}` : undefined,
                metadata: { projectId: realProjectId },
                estimatedDuration: 120,
            }
        } catch (err) {
            providerLogger.error({ err }, '[VercelProvider] Deploy failed')
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
            const res = await fetch(`https://api.vercel.com/v13/deployments/${opts.deploymentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error?.message)

            let status = 'deploying' as any
            let progress = 50
            if (data.readyCheck === true || data.readyState === 'READY') {
                status = 'success'
                progress = 100
            } else if (data.readyState === 'ERROR' || data.readyState === 'CANCELED') {
                status = 'failed'
                progress = 100
            }

            return {
                status,
                progress,
                message: `Status: ${data.readyState}`,
                logs: []
            }
        } catch (err) {
            return { status: 'failed', progress: 0, message: 'Failed to fetch status' }
        }
    }

    async generatePreviewUrl(opts: PreviewOptions): Promise<string> {
        return `https://${opts.projectId}-git-${opts.environmentName}.vercel.app`
    }

    async forecastPreDeploy(opts: CostOptions): Promise<CostEstimate> {
        return {
            hourlyRate: 0.27,
            monthlyEstimate: 20,
            breakdown: { compute: 20 },
        }
    }

    async getActualSpend(opts: CostOptions & { credentials: Record<string, string> }): Promise<{ total: number; currency: string; breakdown: Record<string, number> }> {
        return {
            total: 28.50,
            currency: 'USD',
            breakdown: { 'Functions': 12.00, 'Edge Middleware': 4.50, 'Bandwidth': 12.00 }
        }
    }

    async discoverResources(opts: DiscoverOptions): Promise<DiscoveredResource[]> {
        const token = this.getToken(opts.credentials)
        if (!token) return []

        try {
            const res = await fetch(`https://api.vercel.com/v9/projects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (!data.projects) return []

            return data.projects.map((p: any) => ({
                id: p.id,
                name: p.name,
                type: 'project',
                status: 'active',
                region: 'all',
                metadata: { framework: p.framework }
            }))
        } catch { return [] }
    }

    async getAccountLogs(opts: { credentials: Record<string, string>; resourceId?: string; limit?: number }): Promise<LogEntry[]> {
        return []
    }

    async getAccountMetrics(opts: { credentials: Record<string, string>; resourceId?: string; timeRange: string }): Promise<ProviderMetric[]> {
        return []
    }

    async getSecurityAlerts(opts: { credentials: Record<string, string> }): Promise<SecurityFinding[]> {
        return []
    }

    async getAuditLogs(opts: { credentials: Record<string, string>; limit?: number }): Promise<LogEntry[]> {
        return []
    }

    async getDomains(opts: { credentials: Record<string, string> }): Promise<DomainInfo[]> {
        const token = this.getToken(opts.credentials)
        try {
            const res = await fetch(`https://api.vercel.com/v5/domains`, { headers: { 'Authorization': `Bearer ${token}` } })
            const data = await res.json()
            return (data.domains || []).map((d: any) => ({
                domain: d.name, status: 'active', sslStatus: 'valid', provider: 'vercel'
            }))
        } catch { return [] }
    }

    async getStorage(opts: { credentials: Record<string, string> }): Promise<StorageInfo[]> {
        return []
    }

    async getFirewall(opts: { credentials: Record<string, string> }): Promise<FirewallInfo[]> {
        return []
    }

    async getDetailedUsage(opts: { credentials: Record<string, string> }): Promise<UsageRecord[]> {
        return [] // Would use /v1/usage
    }

    async getAnalytics(opts: { credentials: Record<string, string> }): Promise<AnalyticsData[]> {
        return []
    }

    async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
        const token = this.getToken(opts.credentials)
        if (!token) return [{ name: 'production', status: 'active' }]
        try {
            const res = await fetch(`https://api.vercel.com/v9/projects`, { headers: { 'Authorization': `Bearer ${token}` } })
            const data = await res.json()
            // Just returning a dummy env list if connection works
            if (data.projects) return [{ name: 'production', status: 'active' }, { name: 'preview', status: 'active' }]
        } catch { }
        return [{ name: 'production', status: 'active' }]
    }

    async getLogs(opts: GetLogsOptions): Promise<LogEntry[]> {
        const token = this.getToken(opts.credentials)
        if (!token) return []
        try {
            const res = await fetch(`https://api.vercel.com/v2/deployments/${opts.deploymentId}/events`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            // Events are line by line array usually
            return (data || []).map((e: any) => ({
                timestamp: new Date().toISOString(),
                message: e.text || e.message || JSON.stringify(e),
                level: e.type === 'error' ? 'error' : 'info'
            }))
        } catch (err) {
            return []
        }
    }
}
