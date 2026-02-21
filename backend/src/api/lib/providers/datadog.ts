import { IProvider, DeployOptions, DeployResult, StatusOptions, DeploymentStatus, PreviewOptions, CostOptions, CostEstimate, ListEnvOptions, Environment, GetLogsOptions, LogEntry, DiscoverOptions, DiscoveredResource, ProviderMetric, SecurityFinding, DomainInfo, StorageInfo, FirewallInfo, UsageRecord, AnalyticsData } from './types'

/**
 * Datadog Provider — Real API integration
 * Pulls: Events, metrics, monitors, logs, host inventory, dashboards
 * Docs: https://docs.datadoghq.com/api/latest/
 */
export class DatadogProvider implements IProvider {
    id = 'datadog'
    name = 'Datadog'
    kind: 'static' = 'static'
    valid = true
    errors: string[] = []

    private site(creds: Record<string, string>) {
        return creds.datadog_site || 'datadoghq.com'
    }

    private base(creds: Record<string, string>) {
        return `https://api.${this.site(creds)}/api`
    }

    private headers(creds: Record<string, string>) {
        return {
            'DD-API-KEY': creds.datadog_api_key || creds.api_key || '',
            'DD-APPLICATION-KEY': creds.datadog_app_key || creds.app_key || '',
            'Content-Type': 'application/json'
        }
    }

    async deploy(opts: DeployOptions): Promise<DeployResult> {
        // Deploying = sending a deployment event to Datadog
        const h = this.headers(opts.credentials)
        try {
            const res = await fetch(`${this.base(opts.credentials)}/v1/events`, {
                method: 'POST',
                headers: h,
                body: JSON.stringify({
                    title: `Deployment: ${opts.projectId} to ${opts.environmentName}`,
                    text: `Commit: ${opts.commit}\nBranch: ${opts.branch}\nRepo: ${opts.repoUrl}`,
                    tags: [`project:${opts.projectId}`, `env:${opts.environmentName}`, `branch:${opts.branch}`],
                    alert_type: 'info',
                    source_type_name: 'sarge',
                })
            })
            const data = await res.json()
            return {
                success: res.ok,
                deploymentId: data.event?.id?.toString() || `dd-${Date.now()}`,
                metadata: { eventId: data.event?.id, url: data.event?.url },
                estimatedDuration: 1,
            }
        } catch (err) {
            return { success: false, deploymentId: '', error: (err as Error).message, metadata: {}, estimatedDuration: 0 }
        }
    }

    async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
        return { status: 'success', progress: 100, message: 'Datadog integration active', logs: [] }
    }

    async generatePreviewUrl(opts: PreviewOptions): Promise<string> { return '' }
    async forecastPreDeploy(opts: CostOptions): Promise<CostEstimate> { return { hourlyRate: 0, monthlyEstimate: 31, breakdown: { hosts: 15, logs: 16 } } }

    async getActualSpend(opts: CostOptions & { credentials: Record<string, string> }): Promise<{ total: number; currency: string; breakdown: Record<string, number> }> {
        // Datadog usage API
        const h = this.headers(opts.credentials)
        try {
            const now = new Date()
            const startHr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 13)
            const res = await fetch(`${this.base(opts.credentials)}/v1/usage/summary?start_month=${startHr}`, { headers: h })
            if (!res.ok) return { total: 0, currency: 'USD', breakdown: {} }
            const data = await res.json()
            const usage = data.usage?.[0] || {}
            return {
                total: (usage.infra_host_top99p || 0) * 15 + (usage.indexed_events_count_sum || 0) * 0.000001,
                currency: 'USD',
                breakdown: {
                    hosts: (usage.infra_host_top99p || 0) * 15,
                    apm_hosts: (usage.apm_host_top99p || 0) * 31,
                    logs_indexed: (usage.indexed_events_count_sum || 0) * 0.000001,
                    custom_metrics: (usage.custom_ts_avg || 0) * 0.05,
                }
            }
        } catch { return { total: 0, currency: 'USD', breakdown: {} } }
    }

    /**
     * Discover all hosts, containers, and infrastructure monitored by Datadog
     */
    async discoverResources(opts: DiscoverOptions): Promise<DiscoveredResource[]> {
        const h = this.headers(opts.credentials)
        const resources: DiscoveredResource[] = []

        try {
            // Hosts
            const hostsRes = await fetch(`${this.base(opts.credentials)}/v1/hosts?count=100`, { headers: h })
            if (hostsRes.ok) {
                const hostsData = await hostsRes.json()
                for (const host of (hostsData.host_list || [])) {
                    resources.push({
                        id: host.id?.toString() || host.name,
                        name: host.name,
                        type: `datadog:host:${host.meta?.platform || 'unknown'}`,
                        status: host.is_muted ? 'muted' : 'active',
                        region: host.meta?.agent_version || '',
                        metadata: {
                            platform: host.meta?.platform,
                            cpuCores: host.meta?.cpuCores,
                            gohai: host.meta?.gohai,
                            lastReportedTime: host.last_reported_time,
                            apps: host.apps,
                            tags: host.tags_by_source,
                        }
                    })
                }
            }
        } catch { }

        try {
            // Monitors (health checks)
            const monRes = await fetch(`${this.base(opts.credentials)}/v1/monitor?page=0&page_size=50`, { headers: h })
            if (monRes.ok) {
                const monitors: any[] = await monRes.json()
                for (const mon of monitors) {
                    resources.push({
                        id: mon.id?.toString(),
                        name: mon.name,
                        type: `datadog:monitor:${mon.type}`,
                        status: mon.overall_state || 'unknown',
                        region: '',
                        metadata: {
                            type: mon.type,
                            query: mon.query,
                            message: mon.message,
                            overall_state: mon.overall_state,
                            created: mon.created,
                            tags: mon.tags,
                        }
                    })
                }
            }
        } catch { }

        return resources
    }

    async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
        return [{ name: 'production', status: 'active' }]
    }

    /**
     * Fetch recent events from Datadog (deployments, alerts, system events)
     */
    async getLogs(opts: GetLogsOptions): Promise<LogEntry[]> {
        const h = this.headers(opts.credentials)
        try {
            // Get events stream
            const now = Math.floor(Date.now() / 1000)
            const start = now - 3600 // last hour
            const res = await fetch(
                `${this.base(opts.credentials)}/v1/events?start=${start}&end=${now}&unaggregated=true`,
                { headers: h }
            )
            if (!res.ok) return []
            const data = await res.json()

            return (data.events || []).map((evt: any) => {
                const alertType = evt.alert_type || 'info'
                return {
                    timestamp: new Date((evt.date_happened || 0) * 1000).toISOString(),
                    message: evt.title || evt.text,
                    level: alertType === 'error' ? 'error' : alertType === 'warning' ? 'warn' : 'info',
                    severity: alertType === 'error' ? 'high' : alertType === 'warning' ? 'medium' : 'info',
                    provider: 'datadog',
                    category: evt.source_type_name || 'event',
                    source: evt.host,
                    metadata: {
                        eventId: evt.id,
                        priority: evt.priority,
                        tags: evt.tags,
                        sourceType: evt.source_type_name,
                    }
                }
            })
        } catch { return [] }
    }

    async getAccountLogs(opts: { credentials: Record<string, string>; resourceId?: string; limit?: number }): Promise<LogEntry[]> {
        return this.getLogs({ deploymentId: '', credentials: opts.credentials, limit: opts.limit })
    }

    /**
     * Fetch infrastructure metrics (CPU, memory, load) from Datadog
     */
    async getAccountMetrics(opts: { credentials: Record<string, string>; resourceId?: string; timeRange: string }): Promise<ProviderMetric[]> {
        const h = this.headers(opts.credentials)
        const now = Math.floor(Date.now() / 1000)
        const lookback = opts.timeRange === '1h' ? 3600 : opts.timeRange === '24h' ? 86400 : 3600

        const metricQueries = [
            { q: 'avg:system.cpu.user{*}', name: 'cpu_user' },
            { q: 'avg:system.mem.used{*}', name: 'memory_used' },
            { q: 'avg:system.load.1{*}', name: 'load_1m' },
        ]

        const metrics: ProviderMetric[] = []
        for (const mq of metricQueries) {
            try {
                const res = await fetch(
                    `${this.base(opts.credentials)}/v1/query?from=${now - lookback}&to=${now}&query=${encodeURIComponent(mq.q)}`,
                    { headers: h }
                )
                if (!res.ok) continue
                const data = await res.json()
                const series = data.series?.[0]
                if (series?.pointlist?.length) {
                    const lastPoint = series.pointlist[series.pointlist.length - 1]
                    metrics.push({
                        name: mq.name,
                        value: lastPoint[1] || 0,
                        unit: mq.name.includes('cpu') ? 'percent' : mq.name.includes('mem') ? 'bytes' : 'load',
                        timestamp: new Date(lastPoint[0]).toISOString(),
                        labels: { scope: series.scope || '*' }
                    })
                }
            } catch { }
        }
        return metrics
    }

    /**
     * Monitors in Alert state become security findings
     */
    async getSecurityAlerts(opts: { credentials: Record<string, string> }): Promise<SecurityFinding[]> {
        const h = this.headers(opts.credentials)
        try {
            const res = await fetch(`${this.base(opts.credentials)}/v1/monitor?monitor_tags=security&page=0&page_size=20`, { headers: h })
            if (!res.ok) return []
            const monitors: any[] = await res.json()
            return monitors
                .filter(m => m.overall_state === 'Alert' || m.overall_state === 'Warn')
                .map(m => ({
                    id: m.id?.toString(),
                    severity: m.overall_state === 'Alert' ? 'high' as const : 'medium' as const,
                    title: m.name,
                    description: m.message || `Monitor in ${m.overall_state} state`,
                    timestamp: m.modified || m.created,
                }))
        } catch { return [] }
    }

    async getAuditLogs(opts: { credentials: Record<string, string>; limit?: number }): Promise<LogEntry[]> {
        // Datadog Audit Trail API (v2)
        const h = this.headers(opts.credentials)
        try {
            const res = await fetch(`https://api.${this.site(opts.credentials)}/api/v2/audit/events?page[limit]=${opts.limit || 20}`, { headers: h })
            if (!res.ok) return []
            const data = await res.json()
            return (data.data || []).map((evt: any) => ({
                timestamp: evt.attributes?.timestamp,
                message: `${evt.attributes?.evt?.name}: ${evt.attributes?.message || ''}`,
                level: 'info' as const,
                provider: 'datadog',
                category: 'audit',
                metadata: { actor: evt.attributes?.usr?.name, service: evt.attributes?.service }
            }))
        } catch { return [] }
    }

    async getDomains(opts: { credentials: Record<string, string> }): Promise<DomainInfo[]> { return [] }
    async getStorage(opts: { credentials: Record<string, string> }): Promise<StorageInfo[]> { return [] }
    async getFirewall(opts: { credentials: Record<string, string> }): Promise<FirewallInfo[]> { return [] }

    async getDetailedUsage(opts: { credentials: Record<string, string> }): Promise<UsageRecord[]> {
        const h = this.headers(opts.credentials)
        try {
            const now = new Date()
            const startHr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 13)
            const res = await fetch(`${this.base(opts.credentials)}/v1/usage/summary?start_month=${startHr}`, { headers: h })
            if (!res.ok) return []
            const data = await res.json()
            const u = data.usage?.[0] || {}
            return [
                { metric: 'Infrastructure Hosts', current: u.infra_host_top99p || 0, limit: 10, unit: 'hosts', resetDate: '' },
                { metric: 'APM Hosts', current: u.apm_host_top99p || 0, limit: 10, unit: 'hosts', resetDate: '' },
                { metric: 'Indexed Logs', current: u.indexed_events_count_sum || 0, limit: 10000000, unit: 'events', resetDate: '' },
                { metric: 'Custom Metrics', current: u.custom_ts_avg || 0, limit: 100, unit: 'metrics', resetDate: '' },
            ]
        } catch { return [] }
    }

    async getAnalytics(opts: { credentials: Record<string, string> }): Promise<AnalyticsData[]> {
        const metrics = await this.getAccountMetrics({ credentials: opts.credentials, timeRange: '1h' })
        return metrics.map(m => ({
            name: m.name.replace(/_/g, ' '),
            value: Math.round(m.value * 100) / 100,
            unit: m.unit,
            timeRange: '1h',
        }))
    }
}
