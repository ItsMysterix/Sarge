import { IProvider, DeployOptions, DeployResult, StatusOptions, DeploymentStatus, PreviewOptions, CostOptions, CostEstimate, ListEnvOptions, Environment, GetLogsOptions, LogEntry } from './types'

export class RenderProvider implements IProvider {
    id = 'render'
    name = 'Render'
    kind: 'containers' = 'containers'

    async deploy(opts: DeployOptions): Promise<DeployResult> {
        const token = opts.credentials.render_token
        if (!token) throw new Error('Render token required')

        // Render: deploy container via API
        // URLs: https://project-name.onrender.com

        const res = await fetch('https://api.render.com/v1/services', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'web_service',
                name: `sarge-${opts.projectId}-${opts.environmentName}`,
                repo: opts.repoUrl,
                branch: opts.branch,
                buildCommand: opts.buildCommand,
                startCommand: opts.startCommand,
                envVars: Object.entries(opts.env || {}).map(([key, value]) => ({ key, value })),
            }),
        })

        if (!res.ok) {
            throw new Error(`Render deploy failed: ${res.statusText}`)
        }

        const data = await res.json() as any

        return {
            success: true,
            deploymentId: data.service.id,
            previewUrl: `https://${data.service.name}.onrender.com`,
            productionUrl: opts.environmentName === 'production' ? `https://${data.service.name}.onrender.com` : undefined,
            metadata: { renderServiceId: data.service.id },
            estimatedDuration: 180,
        }
    }

    async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
        const token = opts.credentials.render_token
        const res = await fetch(`https://api.render.com/v1/services/${opts.deploymentId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
        const data = await res.json() as any
        return {
            status: data.service.status === 'available' ? 'success' : 'deploying',
            progress: data.service.status === 'available' ? 100 : 50,
            message: `Render service: ${data.service.status}`,
        }
    }

    async generatePreviewUrl(opts: PreviewOptions): Promise<string> {
        return `https://sarge-${opts.projectId}-${opts.environmentName}.onrender.com`
    }

    async estimateCost(opts: CostOptions): Promise<CostEstimate> {
        // Render: Free + $7/mo starter tier + pay-go
        const baseCost = 7
        const computeCost = opts.resourceConfig?.cpu ? opts.resourceConfig.cpu * 5 : 0
        return {
            hourlyRate: (baseCost + computeCost) / 730,
            monthlyEstimate: baseCost + computeCost,
            breakdown: { base: baseCost, compute: computeCost },
        }
    }

    async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
        return [
            { name: 'preview', status: 'active' },
            { name: 'staging', status: 'active' },
            { name: 'production', status: 'active' },
        ]
    }
    async getLogs(opts: GetLogsOptions): Promise<LogEntry[]> {
        const token = opts.credentials.render_token
        // Assuming opts.deploymentId is the SERVICE ID as per Render API structure for 'deploys'
        // But usually we want logs for a specific deploy: /v1/services/{serviceId}/deploys/{deployId}/logs
        // However, we might just have the service ID in deploymentId from deploy() return.

        let url = `https://api.render.com/v1/services/${opts.deploymentId}/logs`
        if (opts.limit) url += `?limit=${opts.limit}`

        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
        })

        if (!res.ok) return []
        const data = await res.json() as any

        // Render returns stream of logs, or array. Assuming array for this endpoint.
        const logs = Array.isArray(data) ? data : (data.logs || [])

        return logs.map((l: any) => ({
            timestamp: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString(),
            message: l.message || '',
            level: 'info', // Render logs don't explicit log level often
        }))
    }
}
