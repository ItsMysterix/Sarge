import { IProvider, DeployOptions, DeployResult, StatusOptions, DeploymentStatus, PreviewOptions, CostOptions, CostEstimate, ListEnvOptions, Environment, GetLogsOptions, LogEntry } from './types'

export class RailwayProvider implements IProvider {
    id = 'railway'
    name = 'Railway'
    kind: 'containers' = 'containers'
    valid = true
    errors: string[] = []

    async deploy(opts: DeployOptions): Promise<DeployResult> {
        const token = opts.credentials.railway_token
        if (!token) throw new Error('Railway token required')

        // Railway: deploy via API with GitHub integration
        // Generates URLs like: https://project-env.railway.app

        const res = await fetch('https://api.railway.app/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
          mutation CreateDeployment($input: DeploymentInput!) {
            createDeployment(input: $input) {
              id
              status
              url
            }
          }
        `,
                variables: {
                    input: {
                        projectId: opts.projectId,
                        branch: opts.branch,
                        buildCommand: opts.buildCommand,
                        startCommand: opts.startCommand,
                        env: opts.env,
                    },
                },
            }),
        })

        const data = await res.json() as any

        if (data.errors) {
            throw new Error(`Railway deploy failed: ${data.errors[0].message}`)
        }

        const deployment = data.data.createDeployment

        return {
            success: true,
            deploymentId: deployment.id,
            previewUrl: deployment.url,
            productionUrl: opts.environmentName === 'production' ? deployment.url : undefined,
            metadata: { railwayProjectId: opts.projectId },
            estimatedDuration: 300,
        }
    }

    async getStatus(opts: StatusOptions): Promise<DeploymentStatus> {
        const token = opts.credentials.railway_token
        const res = await fetch('https://api.railway.app/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
          query {
            deployment(id: "${opts.deploymentId}") {
              status
            }
          }
        `,
            }),
        })

        const data = await res.json() as any
        const status = data.data.deployment.status

        return {
            status: status === 'SUCCESS' ? 'success' : status === 'FAILED' ? 'failed' : 'deploying',
            progress: status === 'SUCCESS' ? 100 : 50,
            message: `Railway deployment: ${status}`,
        }
    }

    async generatePreviewUrl(opts: PreviewOptions): Promise<string> {
        return `https://sarge-${opts.projectId}-${opts.environmentName}.railway.app`
    }

    async estimateCost(opts: CostOptions): Promise<CostEstimate> {
        // Railway: Free tier (5GB/mo) + pay-go
        const cpu = opts.resourceConfig?.cpu || 0.5
        const memory = opts.resourceConfig?.memory || 512
        const monthlyComputeCost = cpu * 10 + (memory / 1024) * 5 // rough estimate
        return {
            hourlyRate: monthlyComputeCost / 730,
            monthlyEstimate: monthlyComputeCost,
            breakdown: { compute: monthlyComputeCost },
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
        const token = opts.credentials.railway_token
        const res = await fetch('https://api.railway.app/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
          query DeploymentLogs($deploymentId: String!) {
            deploymentLogs(deploymentId: $deploymentId) {
              message
              severity
              timestamp
            }
          }
        `,
                variables: {
                    deploymentId: opts.deploymentId,
                },
            }),
        })

        if (!res.ok) return []
        const data = await res.json() as any
        const logs = data.data?.deploymentLogs || []

        return logs.map((l: any) => ({
            timestamp: l.timestamp,
            message: l.message,
            level: l.severity ? l.severity.toLowerCase() : 'info',
        }))
    }
}
