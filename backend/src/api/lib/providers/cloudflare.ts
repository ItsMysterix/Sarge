import { IProvider, DeployOptions, DeployResult, StatusOptions, DeploymentStatus, PreviewOptions, CostOptions, CostEstimate, ListEnvOptions, Environment, GetLogsOptions, LogEntry, DiscoverOptions, DiscoveredResource, ProviderMetric, SecurityFinding, DomainInfo, StorageInfo, FirewallInfo, UsageRecord, AnalyticsData } from './types'

/**
 * Cloudflare Provider — Real API integration
 * Pulls: Workers, DNS, WAF events, analytics, domains, zones, firewall rules
 * Docs: https://developers.cloudflare.com/api/
 */
export class CloudflareProvider implements IProvider {
    id = 'cloudflare'
    name = 'Cloudflare'
    kind: 'static' = 'static'
    valid = true
    errors: string[] = []

    private base = 'https://api.cloudflare.com/client/v4'

    private headers(creds: Record<string, string>) {
        const token = creds.cloudflare_api_token || creds.cf_token || creds.token
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }

    private accountId(creds: Record<string, string>) {
        return creds.cloudflare_account_id || creds.cf_account_id || ''
    }

    async deploy(opts: DeployOptions): Promise<DeployResult> {
        // Trigger Pages deployment or Workers upload
        const h = this.headers(opts.credentials)
        const accId = this.accountId(opts.credentials)
        try {
            // Create a Pages deployment
            const res = await fetch(`${this.base}/accounts/${accId}/pages/projects/${opts.projectId}/deployments`, {
                method: 'POST',
                headers: h,
                body: JSON.stringify({ branch: opts.branch })
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.errors?.[0]?.message || 'Deployment failed')
            const d = data.result
            return {
                success: true,
                deploymentId: d.id,
                previewUrl: d.url,
                metadata: { url: d.url, environment: d.environment, createdOn: d.created_on, stages: d.stages },
                estimatedDuration: 30,
            }
        } catch (err) {
            return { success: false, deploymentId: '', error: (err as Error).message, metadata: {}, estimatedDuration: 0 }
        }
    }

    async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
        const h = this.headers(opts.credentials)
        const accId = this.accountId(opts.credentials)
        try {
            const res = await fetch(`${this.base}/accounts/${accId}/pages/projects/${opts.deploymentId}`, { headers: h })
            const data = await res.json()
            const d = data.result?.latest_deployment
            if (!d) return { status: 'pending', progress: 0, message: 'Waiting for deployment', logs: [] }
            const stage = d.stages?.find((s: any) => s.status === 'active') || d.stages?.[d.stages.length - 1]
            return {
                status: stage?.status === 'success' ? 'success' : 'building',
                progress: stage?.status === 'success' ? 100 : 50,
                message: `Stage: ${stage?.name || 'unknown'} — ${stage?.status || 'pending'}`,
                logs: d.stages?.map((s: any) => `${s.name}: ${s.status}`) || []
            }
        } catch {
            return { status: 'pending', progress: 0, message: 'Unable to fetch status', logs: [] }
        }
    }

    async generatePreviewUrl(opts: PreviewOptions): Promise<string> { return '' }

    async forecastPreDeploy(opts: CostOptions): Promise<CostEstimate> {
        return { hourlyRate: 0, monthlyEstimate: 0, breakdown: { workers_free: 0 } }
    }

    async getActualSpend(opts: CostOptions & { credentials: Record<string, string> }): Promise<{ total: number; currency: string; breakdown: Record<string, number> }> {
        // Cloudflare billing isn't exposed via API — estimate from usage
        return { total: 0, currency: 'USD', breakdown: {} }
    }

    /**
     * Discover all zones (domains), Workers, Pages projects, KV namespaces, R2 buckets
     */
    async discoverResources(opts: DiscoverOptions): Promise<DiscoveredResource[]> {
        const h = this.headers(opts.credentials)
        const accId = this.accountId(opts.credentials)
        const resources: DiscoveredResource[] = []

        // Zones (domains)
        try {
            const res = await fetch(`${this.base}/zones?per_page=50`, { headers: h })
            const data = await res.json()
            for (const z of (data.result || [])) {
                resources.push({
                    id: z.id, name: z.name, type: 'cloudflare:zone',
                    status: z.status, region: z.plan?.name || 'free',
                    metadata: { plan: z.plan, nameServers: z.name_servers, originalDnshost: z.original_dnshost, createdOn: z.created_on }
                })
            }
        } catch { }

        // Workers
        try {
            const res = await fetch(`${this.base}/accounts/${accId}/workers/scripts`, { headers: h })
            const data = await res.json()
            for (const w of (data.result || [])) {
                resources.push({
                    id: w.id, name: w.id, type: 'cloudflare:worker',
                    status: 'active', region: 'global',
                    metadata: { modifiedOn: w.modified_on, createdOn: w.created_on, etag: w.etag }
                })
            }
        } catch { }

        // Pages projects
        try {
            const res = await fetch(`${this.base}/accounts/${accId}/pages/projects`, { headers: h })
            const data = await res.json()
            for (const p of (data.result || [])) {
                resources.push({
                    id: p.id || p.name, name: p.name, type: 'cloudflare:pages',
                    status: 'active', region: 'global',
                    metadata: { subdomain: p.subdomain, productionBranch: p.production_branch, domains: p.domains, latestDeployment: p.latest_deployment?.id }
                })
            }
        } catch { }

        // KV namespaces
        try {
            const res = await fetch(`${this.base}/accounts/${accId}/storage/kv/namespaces`, { headers: h })
            const data = await res.json()
            for (const ns of (data.result || [])) {
                resources.push({
                    id: ns.id, name: ns.title, type: 'cloudflare:kv',
                    status: 'active', region: 'global',
                    metadata: { supportsUrlEncoding: ns.supports_url_encoding }
                })
            }
        } catch { }

        // R2 buckets
        try {
            const res = await fetch(`${this.base}/accounts/${accId}/r2/buckets`, { headers: h })
            const data = await res.json()
            for (const b of (data.result?.buckets || data.result || [])) {
                resources.push({
                    id: b.name, name: b.name, type: 'cloudflare:r2',
                    status: 'active', region: b.location || 'auto',
                    metadata: { creationDate: b.creation_date }
                })
            }
        } catch { }

        return resources
    }

    async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
        return [{ name: 'production', status: 'active' }, { name: 'preview', status: 'active' }]
    }

    /**
     * Fetch WAF/Firewall events — real security telemetry
     */
    async getLogs(opts: GetLogsOptions): Promise<LogEntry[]> {
        const h = this.headers(opts.credentials)
        // Cloudflare doesn't have a general "logs" API for free plans
        // Use zone analytics + firewall events if available
        try {
            const zonesRes = await fetch(`${this.base}/zones?per_page=5`, { headers: h })
            const zonesData = await zonesRes.json()
            const zoneId = zonesData.result?.[0]?.id
            if (!zoneId) return []

            // Firewall Events
            const fwRes = await fetch(`${this.base}/zones/${zoneId}/security/events?per_page=${opts.limit || 25}`, { headers: h })
            if (!fwRes.ok) return []
            const fwData = await fwRes.json()
            return (fwData.result || []).map((evt: any) => ({
                timestamp: evt.occurredAt || evt.datetime,
                message: `${evt.action} — ${evt.clientRequestHTTPMethodName} ${evt.clientRequestPath} from ${evt.clientIP}`,
                level: evt.action === 'block' ? 'error' : evt.action === 'challenge' ? 'warn' : 'info',
                severity: evt.action === 'block' ? 'high' : evt.action === 'challenge' ? 'medium' : 'low',
                provider: 'cloudflare',
                category: 'security',
                source: 'waf',
                method: evt.clientRequestHTTPMethodName,
                path: evt.clientRequestPath,
                metadata: {
                    action: evt.action,
                    ruleId: evt.ruleId,
                    source: evt.source,
                    clientIP: evt.clientIP,
                    country: evt.clientCountryName,
                    userAgent: evt.userAgent,
                }
            }))
        } catch { return [] }
    }

    async getAccountLogs(opts: { credentials: Record<string, string>; resourceId?: string; limit?: number }): Promise<LogEntry[]> {
        return this.getLogs({ deploymentId: '', credentials: opts.credentials, limit: opts.limit })
    }

    /**
     * Zone analytics — requests, bandwidth, threats, page views
     */
    async getAccountMetrics(opts: { credentials: Record<string, string>; resourceId?: string; timeRange: string }): Promise<ProviderMetric[]> {
        const h = this.headers(opts.credentials)
        try {
            const zonesRes = await fetch(`${this.base}/zones?per_page=5`, { headers: h })
            const zonesData = await zonesRes.json()
            const zoneId = opts.resourceId || zonesData.result?.[0]?.id
            if (!zoneId) return []

            const since = new Date(Date.now() - (opts.timeRange === '24h' ? 86400000 : 3600000)).toISOString()
            const res = await fetch(`${this.base}/zones/${zoneId}/analytics/dashboard?since=${since}&continuous=true`, { headers: h })
            if (!res.ok) return []
            const data = await res.json()
            const totals = data.result?.totals || {}

            return [
                { name: 'total_requests', value: totals.requests?.all || 0, unit: 'requests', timestamp: new Date().toISOString() },
                { name: 'cached_requests', value: totals.requests?.cached || 0, unit: 'requests', timestamp: new Date().toISOString() },
                { name: 'uncached_requests', value: totals.requests?.uncached || 0, unit: 'requests', timestamp: new Date().toISOString() },
                { name: 'bandwidth', value: totals.bandwidth?.all || 0, unit: 'bytes', timestamp: new Date().toISOString() },
                { name: 'threats', value: totals.threats?.all || 0, unit: 'threats', timestamp: new Date().toISOString() },
                { name: 'page_views', value: totals.pageviews?.all || 0, unit: 'views', timestamp: new Date().toISOString() },
                { name: 'unique_visitors', value: totals.uniques?.all || 0, unit: 'visitors', timestamp: new Date().toISOString() },
            ]
        } catch { return [] }
    }

    /**
     * WAF triggered rules = security findings
     */
    async getSecurityAlerts(opts: { credentials: Record<string, string> }): Promise<SecurityFinding[]> {
        const logs = await this.getLogs({ deploymentId: '', credentials: opts.credentials, limit: 20 })
        return logs
            .filter(l => l.level === 'error' || l.severity === 'high')
            .map((l, i) => ({
                id: `cf-sec-${i}`,
                severity: 'high' as const,
                title: `WAF Block: ${l.method} ${l.path}`,
                description: l.message,
                timestamp: l.timestamp,
                resourceId: l.metadata?.ruleId,
            }))
    }

    async getAuditLogs(opts: { credentials: Record<string, string>; limit?: number }): Promise<LogEntry[]> {
        const h = this.headers(opts.credentials)
        const accId = this.accountId(opts.credentials)
        try {
            const res = await fetch(`${this.base}/accounts/${accId}/audit_logs?per_page=${opts.limit || 25}`, { headers: h })
            if (!res.ok) return []
            const data = await res.json()
            return (data.result || []).map((evt: any) => ({
                timestamp: evt.when,
                message: `${evt.action?.type}: ${evt.resource?.type} ${evt.resource?.id || ''}`,
                level: 'info' as const,
                provider: 'cloudflare',
                category: 'audit',
                metadata: { actor: evt.actor?.email, actionType: evt.action?.type, resourceType: evt.resource?.type, ip: evt.actor?.ip }
            }))
        } catch { return [] }
    }

    /**
     * All zones = domains with SSL status
     */
    async getDomains(opts: { credentials: Record<string, string> }): Promise<DomainInfo[]> {
        const h = this.headers(opts.credentials)
        try {
            const res = await fetch(`${this.base}/zones?per_page=50`, { headers: h })
            const data = await res.json()
            return (data.result || []).map((z: any) => ({
                domain: z.name,
                status: z.status === 'active' ? 'active' as const : 'pending' as const,
                sslStatus: z.ssl?.status === 'active' ? 'valid' as const : 'generating' as const,
                provider: 'cloudflare',
                expiresAt: z.ssl?.certificate_pack_id ? undefined : undefined,
            }))
        } catch { return [] }
    }

    /**
     * R2 + KV = storage resources
     */
    async getStorage(opts: { credentials: Record<string, string> }): Promise<StorageInfo[]> {
        const resources = await this.discoverResources({ credentials: opts.credentials })
        return resources
            .filter(r => r.type.includes('r2') || r.type.includes('kv'))
            .map(r => ({
                id: r.id,
                name: r.name,
                type: r.type.includes('r2') ? 'blob' as const : 'kv' as const,
                usage: 0,
                unit: 'bytes',
                status: r.status,
                metadata: r.metadata,
            }))
    }

    /**
     * Firewall rules from all zones
     */
    async getFirewall(opts: { credentials: Record<string, string> }): Promise<FirewallInfo[]> {
        const h = this.headers(opts.credentials)
        try {
            const zonesRes = await fetch(`${this.base}/zones?per_page=5`, { headers: h })
            const zonesData = await zonesRes.json()
            const results: FirewallInfo[] = []
            for (const zone of (zonesData.result || []).slice(0, 3)) {
                const res = await fetch(`${this.base}/zones/${zone.id}/firewall/rules`, { headers: h })
                if (!res.ok) continue
                const data = await res.json()
                for (const rule of (data.result || [])) {
                    results.push({
                        id: rule.id,
                        name: rule.description || `Rule ${rule.id}`,
                        type: 'firewall_rule',
                        status: rule.paused ? 'disabled' : 'enabled',
                        rulesCount: 1,
                        description: `Action: ${rule.action} | Filter: ${rule.filter?.expression || ''}`,
                    })
                }
            }
            return results
        } catch { return [] }
    }

    async getDetailedUsage(opts: { credentials: Record<string, string> }): Promise<UsageRecord[]> {
        const metrics = await this.getAccountMetrics({ credentials: opts.credentials, timeRange: '24h' })
        return metrics.map(m => ({
            metric: m.name.replace(/_/g, ' '),
            current: m.value,
            limit: 0, // Free plan has limits but they vary
            unit: m.unit,
            resetDate: '',
        }))
    }

    async getAnalytics(opts: { credentials: Record<string, string> }): Promise<AnalyticsData[]> {
        const metrics = await this.getAccountMetrics({ credentials: opts.credentials, timeRange: '24h' })
        return metrics.map(m => ({
            name: m.name.replace(/_/g, ' '),
            value: m.value,
            unit: m.unit,
            timeRange: '24h',
        }))
    }
}
