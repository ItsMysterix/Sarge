import { IProvider, DeployOptions, DeployResult, StatusOptions, DeploymentStatus, PreviewOptions, CostOptions, CostEstimate, ListEnvOptions, Environment, GetLogsOptions, LogEntry } from './types'

export class VercelProvider implements IProvider {
    id = 'vercel'
    name = 'Vercel'
    kind: 'static' = 'static'

    async deploy(opts: DeployOptions): Promise<DeployResult> {
        const token = opts.credentials.vercel_token
        if (!token) throw new Error('Vercel token required')

        // Vercel auto-connects GitHub and deploys on push
        // For preview: it auto-creates PR preview URLs
        // For production: deploy to main/production branch

        // API call to create deployment
        const res = await fetch(
            'https://api.vercel.com/v13/deployments',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: `sarge-${opts.projectId}`,
                    gitSource: {
                        type: 'github',
                        repo: opts.repoUrl,
                        ref: opts.branch,
                    },
                    env: opts.env || {},
                    buildCommand: opts.buildCommand,
                }),
            }
        )

        if (!res.ok) {
            throw new Error(`Vercel deploy failed: ${res.statusText}`)
        }

        const data = await res.json() as any

        return {
            success: true,
            deploymentId: data.id,
            previewUrl: data.url,
            productionUrl: opts.environmentName === 'production' ? data.url : undefined,
            metadata: { vercelProjectId: data.projectId },
            estimatedDuration: 120,
        }
    }

    async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
        const token = opts.credentials.vercel_token
        const res = await fetch(`https://api.vercel.com/v13/deployments/${opts.deploymentId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
        const data = await res.json() as any
        return {
            status: data.state === 'READY' ? 'success' : data.state === 'ERROR' ? 'failed' : 'deploying',
            progress: data.state === 'READY' ? 100 : 50,
            message: `Vercel deployment: ${data.state}`,
        }
    }

    async generatePreviewUrl(opts: PreviewOptions): Promise<string> {
        // Vercel auto-generates: https://<project>-<random>.vercel.app
        return `https://sarge-${opts.projectId}-preview.vercel.app`
    }

    async estimateCost(opts: CostOptions): Promise<CostEstimate> {
        // Vercel pro: $20/month + additional usage
        return {
            hourlyRate: 0.83, // ~$20/month
            monthlyEstimate: 20,
            breakdown: { compute: 20 },
        }
    }

    async listEnvironments(opts: ListEnvOptions): Promise<Environment[]> {
        return [
            { name: 'preview', status: 'active' },
            { name: 'production', status: 'active' },
        ]
    }

    async getLogs(opts: GetLogsOptions): Promise<LogEntry[]> {
        const token = opts.credentials.vercel_token
        const res = await fetch(`https://api.vercel.com/v2/deployments/${opts.deploymentId}/events`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!res.ok) return []
        const events = await res.json() as any[]
        return events.map((e: any) => ({
            timestamp: new Date(e.created).toISOString(),
            message: e.text || '',
            level: e.type === 'error' ? 'error' : 'info'
        }))
    }
}
