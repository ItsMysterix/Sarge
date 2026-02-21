import { IProvider, DeployOptions, DeployResult, StatusOptions, DeploymentStatus, PreviewOptions, CostOptions, CostEstimate, ListEnvOptions, Environment, GetLogsOptions, LogEntry, DiscoverOptions, DiscoveredResource, ProviderMetric, SecurityFinding, DomainInfo, StorageInfo, FirewallInfo, UsageRecord, AnalyticsData } from './types'

/**
 * Stripe Provider — Real API integration
 * Pulls: Balance, charges, disputes, webhook endpoints, events, payouts
 * Docs: https://stripe.com/docs/api
 */
export class StripeProvider implements IProvider {
    id = 'stripe'
    name = 'Stripe'
    kind: 'static' = 'static'
    valid = true
    errors: string[] = []

    private base = 'https://api.stripe.com/v1'

    private headers(creds: Record<string, string>) {
        const key = creds.stripe_secret_key || creds.stripe_key || creds.token
        return { 'Authorization': `Bearer ${key}` }
    }

    async deploy(opts: DeployOptions): Promise<DeployResult> {
        // "Deploying" Stripe = creating/updating a webhook endpoint
        const h = this.headers(opts.credentials)
        try {
            const body = new URLSearchParams({
                url: `https://${opts.projectId}.sarge.dev/api/webhooks/stripe`,
                'enabled_events[]': '*',
                description: `Sarge webhook for ${opts.projectId}`,
            })
            const res = await fetch(`${this.base}/webhook_endpoints`, { method: 'POST', headers: h, body })
            const data = await res.json()
            if (data.error) throw new Error(data.error.message)

            return {
                success: true,
                deploymentId: data.id,
                metadata: { webhookId: data.id, secret: data.secret, url: data.url, status: data.status },
                estimatedDuration: 1,
            }
        } catch (err) {
            return { success: false, deploymentId: '', error: (err as Error).message, metadata: {}, estimatedDuration: 0 }
        }
    }

    async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
        const h = this.headers(opts.credentials)
        try {
            const res = await fetch(`${this.base}/webhook_endpoints/${opts.deploymentId}`, { headers: h })
            const data = await res.json()
            return {
                status: data.status === 'enabled' ? 'success' : 'failed',
                progress: 100,
                message: `Webhook: ${data.status} | ${data.enabled_events?.length || 0} events`,
                logs: []
            }
        } catch {
            return { status: 'success', progress: 100, message: 'Stripe active', logs: [] }
        }
    }

    async generatePreviewUrl(opts: PreviewOptions): Promise<string> { return 'https://dashboard.stripe.com' }

    async forecastPreDeploy(opts: CostOptions): Promise<CostEstimate> {
        return { hourlyRate: 0, monthlyEstimate: 0, breakdown: { perTransaction: 0.029 } }
    }

    /**
     * Get actual revenue, fees, and balance from Stripe
     */
    async getActualSpend(opts: CostOptions & { credentials: Record<string, string> }): Promise<{ total: number; currency: string; breakdown: Record<string, number> }> {
        const h = this.headers(opts.credentials)
        try {
            // Fetch balance
            const balRes = await fetch(`${this.base}/balance`, { headers: h })
            const balance = await balRes.json()

            const available = (balance.available || []).reduce((sum: number, b: any) => sum + b.amount, 0) / 100
            const pending = (balance.pending || []).reduce((sum: number, b: any) => sum + b.amount, 0) / 100

            // Fetch recent charges to calculate fees
            const chargesRes = await fetch(`${this.base}/charges?limit=100`, { headers: h })
            const charges = await chargesRes.json()
            const totalFees = (charges.data || []).reduce((sum: number, c: any) =>
                sum + (c.balance_transaction?.fee || 0), 0) / 100

            return {
                total: totalFees,
                currency: balance.available?.[0]?.currency?.toUpperCase() || 'USD',
                breakdown: {
                    stripeFees: totalFees,
                    availableBalance: available,
                    pendingBalance: pending,
                }
            }
        } catch { return { total: 0, currency: 'USD', breakdown: {} } }
    }

    /**
     * Discover webhook endpoints, products, prices, subscriptions
     */
    async discoverResources(opts: DiscoverOptions): Promise<DiscoveredResource[]> {
        const h = this.headers(opts.credentials)
        const resources: DiscoveredResource[] = []

        // Products
        try {
            const res = await fetch(`${this.base}/products?limit=50&active=true`, { headers: h })
            const data = await res.json()
            for (const p of (data.data || [])) {
                resources.push({
                    id: p.id, name: p.name, type: 'stripe:product',
                    status: p.active ? 'active' : 'inactive', region: '',
                    metadata: { description: p.description, images: p.images, created: p.created, defaultPrice: p.default_price }
                })
            }
        } catch { }

        // Subscriptions
        try {
            const res = await fetch(`${this.base}/subscriptions?limit=50&status=active`, { headers: h })
            const data = await res.json()
            for (const sub of (data.data || [])) {
                resources.push({
                    id: sub.id, name: `Sub: ${sub.customer}`, type: 'stripe:subscription',
                    status: sub.status, region: '',
                    metadata: { customerId: sub.customer, currentPeriodEnd: sub.current_period_end, cancelAtPeriodEnd: sub.cancel_at_period_end, items: sub.items?.data?.length }
                })
            }
        } catch { }

        // Webhook endpoints
        try {
            const res = await fetch(`${this.base}/webhook_endpoints?limit=20`, { headers: h })
            const data = await res.json()
            for (const wh of (data.data || [])) {
                resources.push({
                    id: wh.id, name: wh.url, type: 'stripe:webhook',
                    status: wh.status, region: '',
                    metadata: { enabledEvents: wh.enabled_events, apiVersion: wh.api_version }
                })
            }
        } catch { }

        return resources
    }

    async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
        return [{ name: 'live', status: 'active' }, { name: 'test', status: 'active' }]
    }

    /**
     * Fetch recent Stripe events — charges, disputes, payouts, invoice events
     * Each event is categorized by type and severity
     */
    async getLogs(opts: GetLogsOptions): Promise<LogEntry[]> {
        const h = this.headers(opts.credentials)
        try {
            const res = await fetch(`${this.base}/events?limit=${opts.limit || 50}`, { headers: h })
            const data = await res.json()

            return (data.data || []).map((evt: any) => {
                const type = evt.type || ''
                const isFailure = type.includes('failed') || type.includes('dispute') || type.includes('refund')
                const isPayment = type.includes('charge') || type.includes('payment') || type.includes('invoice')

                let severity: 'critical' | 'high' | 'medium' | 'low' | 'info' = 'info'
                let level: 'error' | 'warn' | 'info' = 'info'
                if (type.includes('dispute.created')) { severity = 'critical'; level = 'error' }
                else if (type.includes('failed')) { severity = 'high'; level = 'error' }
                else if (type.includes('refund')) { severity = 'medium'; level = 'warn' }

                const obj = evt.data?.object || {}
                let msg = type.replace(/\./g, ' ')
                if (isPayment && obj.amount) msg += ` — $${(obj.amount / 100).toFixed(2)} ${(obj.currency || 'usd').toUpperCase()}`
                if (obj.customer) msg += ` | Customer: ${obj.customer}`

                return {
                    timestamp: new Date(evt.created * 1000).toISOString(),
                    message: msg,
                    level,
                    severity,
                    provider: 'stripe',
                    category: isPayment ? 'billing' : type.includes('customer') ? 'auth' : 'event',
                    source: type.split('.')[0],
                    metadata: {
                        eventId: evt.id,
                        type: evt.type,
                        objectId: obj.id,
                        amount: obj.amount ? obj.amount / 100 : undefined,
                        currency: obj.currency,
                        status: obj.status,
                        customer: obj.customer,
                        livemode: evt.livemode,
                    },
                    url: `https://dashboard.stripe.com/events/${evt.id}`,
                }
            })
        } catch { return [] }
    }

    async getAccountLogs(opts: { credentials: Record<string, string>; resourceId?: string; limit?: number }): Promise<LogEntry[]> {
        return this.getLogs({ deploymentId: '', credentials: opts.credentials, limit: opts.limit })
    }

    /**
     * Balance + MRR metrics
     */
    async getAccountMetrics(opts: { credentials: Record<string, string>; resourceId?: string; timeRange: string }): Promise<ProviderMetric[]> {
        const h = this.headers(opts.credentials)
        const metrics: ProviderMetric[] = []
        const now = new Date().toISOString()

        try {
            const balRes = await fetch(`${this.base}/balance`, { headers: h })
            const balance = await balRes.json()
            const available = (balance.available || []).reduce((sum: number, b: any) => sum + b.amount, 0) / 100
            const pending = (balance.pending || []).reduce((sum: number, b: any) => sum + b.amount, 0) / 100
            metrics.push({ name: 'available_balance', value: available, unit: 'USD', timestamp: now })
            metrics.push({ name: 'pending_balance', value: pending, unit: 'USD', timestamp: now })
        } catch { }

        try {
            // Count active subscriptions
            const subRes = await fetch(`${this.base}/subscriptions?status=active&limit=1`, { headers: h })
            const subData = await subRes.json()
            metrics.push({ name: 'active_subscriptions', value: subData.data?.length || 0, unit: 'subscriptions', timestamp: now })
        } catch { }

        try {
            // Count recent successful charges
            const chRes = await fetch(`${this.base}/charges?limit=100`, { headers: h })
            const chData = await chRes.json()
            const successCount = (chData.data || []).filter((c: any) => c.status === 'succeeded').length
            const totalRevenue = (chData.data || []).filter((c: any) => c.status === 'succeeded').reduce((sum: number, c: any) => sum + c.amount, 0) / 100
            metrics.push({ name: 'recent_charges', value: successCount, unit: 'charges', timestamp: now })
            metrics.push({ name: 'recent_revenue', value: totalRevenue, unit: 'USD', timestamp: now })
        } catch { }

        return metrics
    }

    /**
     * Disputes = critical security findings
     */
    async getSecurityAlerts(opts: { credentials: Record<string, string> }): Promise<SecurityFinding[]> {
        const h = this.headers(opts.credentials)
        try {
            const res = await fetch(`${this.base}/disputes?limit=10`, { headers: h })
            const data = await res.json()
            return (data.data || []).map((d: any) => ({
                id: d.id,
                severity: d.status === 'needs_response' ? 'critical' as const : 'high' as const,
                title: `Dispute: $${(d.amount / 100).toFixed(2)} ${d.currency.toUpperCase()}`,
                description: `Reason: ${d.reason} | Status: ${d.status} | Charge: ${d.charge}`,
                timestamp: new Date(d.created * 1000).toISOString(),
                resourceId: d.charge,
            }))
        } catch { return [] }
    }

    async getAuditLogs(opts: { credentials: Record<string, string>; limit?: number }): Promise<LogEntry[]> {
        return this.getLogs({ deploymentId: '', credentials: opts.credentials, limit: opts.limit || 20 })
    }

    async getDomains(opts: { credentials: Record<string, string> }): Promise<DomainInfo[]> { return [] }
    async getStorage(opts: { credentials: Record<string, string> }): Promise<StorageInfo[]> { return [] }
    async getFirewall(opts: { credentials: Record<string, string> }): Promise<FirewallInfo[]> { return [] }

    async getDetailedUsage(opts: { credentials: Record<string, string> }): Promise<UsageRecord[]> {
        const metrics = await this.getAccountMetrics({ credentials: opts.credentials, timeRange: '24h' })
        return metrics.map(m => ({
            metric: m.name.replace(/_/g, ' '),
            current: m.value,
            limit: 0,
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
