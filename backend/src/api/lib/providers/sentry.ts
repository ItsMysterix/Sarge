import { IProvider, DeployOptions, DeployResult, StatusOptions, DeploymentStatus, PreviewOptions, CostOptions, CostEstimate, ListEnvOptions, Environment, GetLogsOptions, LogEntry, DiscoverOptions, DiscoveredResource, ProviderMetric, SecurityFinding, DomainInfo, StorageInfo, FirewallInfo, UsageRecord, AnalyticsData } from './types'

/**
 * Sentry Provider — Real API integration
 * Pulls: Issues, events, error rates, release health, projects
 * Docs: https://docs.sentry.io/api/
 */
export class SentryProvider implements IProvider {
    id = 'sentry'
    name = 'Sentry'
    kind: 'static' = 'static'
    valid = true
    errors: string[] = []

    private base = 'https://sentry.io/api/0'

    private headers(creds: Record<string, string>) {
        return { 'Authorization': `Bearer ${creds.sentry_auth_token || creds.token}` }
    }

    private org(creds: Record<string, string>) {
        return creds.sentry_org || creds.org || ''
    }

    async deploy(opts: DeployOptions): Promise<DeployResult> {
        // "Deploying" to Sentry means creating a release
        const h = this.headers(opts.credentials)
        const org = this.org(opts.credentials)
        const project = opts.credentials.sentry_project || opts.projectId

        try {
            const res = await fetch(`${this.base}/organizations/${org}/releases/`, {
                method: 'POST',
                headers: { ...h, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    version: opts.commit || `release-${Date.now()}`,
                    projects: [project],
                    ref: opts.commit,
                    refs: [{ repository: opts.repoUrl, commit: opts.commit }],
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.detail || 'Failed to create Sentry release')

            return {
                success: true,
                deploymentId: data.version,
                metadata: { releaseUrl: data.url, dateCreated: data.dateCreated, newGroups: data.newGroups },
                estimatedDuration: 2,
            }
        } catch (err) {
            return { success: false, deploymentId: '', error: (err as Error).message, metadata: {}, estimatedDuration: 0 }
        }
    }

    async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
        return { status: 'success', progress: 100, message: 'Sentry release active', logs: [] }
    }

    async generatePreviewUrl(opts: PreviewOptions): Promise<string> { return '' }

    async forecastPreDeploy(opts: CostOptions): Promise<CostEstimate> {
        // Sentry pricing is event-based
        return { hourlyRate: 0, monthlyEstimate: 26, breakdown: { errors: 26 } }
    }

    async getActualSpend(opts: CostOptions & { credentials: Record<string, string> }): Promise<{ total: number; currency: string; breakdown: Record<string, number> }> {
        // Sentry doesn't expose billing API publicly — return estimate
        return { total: 26, currency: 'USD', breakdown: { plan: 26 } }
    }

    /**
     * Discover all Sentry projects in the organization
     */
    async discoverResources(opts: DiscoverOptions): Promise<DiscoveredResource[]> {
        const h = this.headers(opts.credentials)
        const org = this.org(opts.credentials)
        try {
            const res = await fetch(`${this.base}/organizations/${org}/projects/`, { headers: h })
            if (!res.ok) return []
            const projects: any[] = await res.json()
            return projects.map(p => ({
                id: p.id,
                name: p.name,
                type: `sentry:project:${p.platform || 'unknown'}`,
                status: p.status === 'active' ? 'active' : p.status,
                region: p.organization?.slug || org,
                metadata: {
                    slug: p.slug,
                    platform: p.platform,
                    dateCreated: p.dateCreated,
                    firstEvent: p.firstEvent,
                    hasAccess: p.hasAccess,
                    features: p.features,
                }
            }))
        } catch { return [] }
    }

    async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
        return [{ name: 'production', status: 'active' }]
    }

    /**
     * Fetch recent issues/errors from Sentry — the core value
     * Each issue becomes a log entry with severity, stack trace info, users affected, etc.
     */
    async getLogs(opts: GetLogsOptions): Promise<LogEntry[]> {
        const h = this.headers(opts.credentials)
        const org = this.org(opts.credentials)
        const project = opts.credentials.sentry_project || opts.projectId

        try {
            const res = await fetch(
                `${this.base}/projects/${org}/${project}/issues/?query=is:unresolved&sort=date&limit=${opts.limit || 50}`,
                { headers: h }
            )
            if (!res.ok) return []
            const issues: any[] = await res.json()

            return issues.map(issue => {
                const level = issue.level || 'error'
                const severity = level === 'fatal' ? 'critical' :
                    level === 'error' ? 'high' :
                        level === 'warning' ? 'medium' : 'low'

                return {
                    timestamp: issue.lastSeen || issue.firstSeen,
                    message: `[${issue.shortId}] ${issue.title} — ${issue.culprit || 'unknown'}`,
                    level: level as any,
                    severity,
                    service: project,
                    provider: 'sentry',
                    category: 'error',
                    source: issue.culprit,
                    url: issue.permalink,
                    metadata: {
                        issueId: issue.id,
                        shortId: issue.shortId,
                        count: issue.count,
                        userCount: issue.userCount,
                        firstSeen: issue.firstSeen,
                        lastSeen: issue.lastSeen,
                        isUnhandled: issue.isUnhandled,
                        platform: issue.platform,
                        type: issue.type,
                        status: issue.status,
                        assignedTo: issue.assignedTo?.name,
                    }
                }
            })
        } catch { return [] }
    }

    /**
     * Fetch account-wide events (latest events across all projects)
     */
    async getAccountLogs(opts: { credentials: Record<string, string>; resourceId?: string; limit?: number }): Promise<LogEntry[]> {
        const h = this.headers(opts.credentials)
        const org = this.org(opts.credentials)

        try {
            // Get organization's recent events
            const res = await fetch(
                `${this.base}/organizations/${org}/issues/?query=is:unresolved&sort=date&limit=${opts.limit || 25}`,
                { headers: h }
            )
            if (!res.ok) return []
            const issues: any[] = await res.json()
            return issues.map(issue => ({
                timestamp: issue.lastSeen,
                message: `${issue.metadata?.type || issue.type}: ${issue.title}`,
                level: issue.level as any,
                severity: issue.level === 'fatal' ? 'critical' : issue.level === 'error' ? 'high' : 'medium',
                provider: 'sentry',
                category: 'error',
                metadata: { count: issue.count, userCount: issue.userCount, project: issue.project?.slug }
            }))
        } catch { return [] }
    }

    /**
     * Fetch project stats — events per hour, errors, transactions
     */
    async getAccountMetrics(opts: { credentials: Record<string, string>; resourceId?: string; timeRange: string }): Promise<ProviderMetric[]> {
        const h = this.headers(opts.credentials)
        const org = this.org(opts.credentials)

        try {
            // Get org stats
            const res = await fetch(
                `${this.base}/organizations/${org}/stats_v2/?field=sum(quantity)&groupBy=category&interval=1h&statsPeriod=${opts.timeRange || '24h'}`,
                { headers: h }
            )
            if (!res.ok) return []
            const data = await res.json()

            const metrics: ProviderMetric[] = []
            for (const group of (data.groups || [])) {
                const category = group.by?.category || 'unknown'
                const totals = group.totals?.['sum(quantity)'] || 0
                metrics.push({
                    name: `sentry_${category}_events`,
                    value: totals,
                    unit: 'events',
                    timestamp: new Date().toISOString(),
                    labels: { category, org }
                })
            }
            return metrics
        } catch { return [] }
    }

    async getSecurityAlerts(opts: { credentials: Record<string, string> }): Promise<SecurityFinding[]> {
        // Sentry doesn't have security alerts per se, but unhandled fatal errors are security-relevant
        const logs = await this.getAccountLogs({ credentials: opts.credentials, limit: 10 })
        return logs
            .filter(l => l.severity === 'critical' || l.level === 'fatal')
            .map((l, i) => ({
                id: `sentry-sec-${i}`,
                severity: 'high' as const,
                title: `Unhandled Fatal Error`,
                description: l.message,
                timestamp: l.timestamp,
                resourceId: l.metadata?.issueId
            }))
    }

    async getAuditLogs(opts: { credentials: Record<string, string>; limit?: number }): Promise<LogEntry[]> {
        const h = this.headers(opts.credentials)
        const org = this.org(opts.credentials)
        try {
            const res = await fetch(`${this.base}/organizations/${org}/audit-logs/?limit=${opts.limit || 20}`, { headers: h })
            if (!res.ok) return []
            const data = await res.json()
            return (data.rows || []).map((row: any) => ({
                timestamp: row.dateCreated,
                message: `${row.event}: ${row.data?.slug || row.targetObject || ''}`,
                level: 'info' as const,
                provider: 'sentry',
                category: 'audit',
                metadata: { actor: row.actor?.name, event: row.event, ip: row.ipAddress }
            }))
        } catch { return [] }
    }

    async getDomains(opts: { credentials: Record<string, string> }): Promise<DomainInfo[]> { return [] }
    async getStorage(opts: { credentials: Record<string, string> }): Promise<StorageInfo[]> { return [] }
    async getFirewall(opts: { credentials: Record<string, string> }): Promise<FirewallInfo[]> { return [] }

    async getDetailedUsage(opts: { credentials: Record<string, string> }): Promise<UsageRecord[]> {
        const metrics = await this.getAccountMetrics({ credentials: opts.credentials, timeRange: '24h' })
        return metrics.map(m => ({
            metric: m.name.replace('sentry_', '').replace('_events', ' events'),
            current: m.value,
            limit: 50000, // Sentry plan limits vary
            unit: m.unit,
            resetDate: new Date(new Date().setDate(1)).toISOString(), // 1st of next month
        }))
    }

    async getAnalytics(opts: { credentials: Record<string, string> }): Promise<AnalyticsData[]> {
        const metrics = await this.getAccountMetrics({ credentials: opts.credentials, timeRange: '24h' })
        return metrics.map(m => ({
            name: m.name.replace('sentry_', '').replace(/_/g, ' '),
            value: m.value,
            unit: m.unit,
            timeRange: '24h',
        }))
    }
}
