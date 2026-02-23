/**
 * Metric Aggregator Service
 * 
 * Aggregates resource metrics and calculates health scores.
 * Normalizes metrics across different cloud providers.
 */

import { getProvider } from '../api/lib/providers'
import { getProviderCredentials } from '../api/lib/credentials'
import { ProviderMetric } from '../api/lib/providers/types'
import logger from '../lib/logger'

const metricsLogger = logger.child({ module: 'metric-aggregator' })

export interface HealthScore {
    score: number // 0-100
    status: 'healthy' | 'warning' | 'critical'
    load: number // 0-1 normalized
    incidents: number
}

export class MetricAggregator {
    /**
     * Calculate a unified health score for a stack spread across providers
     */
    async getStackHealth(
        deployments: { deploymentId: string, providerId: string }[],
        db: any,
        userId: string
    ): Promise<HealthScore> {
        let totalCpu = 0
        let totalMemory = 0
        let deploymentCount = 0
        let issues = 0

        await Promise.all(deployments.map(async (d) => {
            const provider = getProvider(d.providerId)
            if (!provider || !provider.getMetrics) return

            try {
                const credentials = await getProviderCredentials(d.providerId, db, userId)
                const metrics = await provider.getMetrics({
                    deploymentId: d.deploymentId,
                    credentials
                })

                const cpu = metrics.find(m => m.name === 'cpu_usage')?.value || 0
                const mem = metrics.find(m => m.name === 'memory_usage')?.value || 0

                if (cpu > 0.8) issues++
                if (mem > 0.9) issues++

                totalCpu += cpu
                totalMemory += mem
                deploymentCount++
            } catch (err) {
                metricsLogger.warn({ deploymentId: d.deploymentId, providerId: d.providerId, err }, `[MetricAggregator] Failed to fetch metrics`)
                issues += 2 // Treat missing metrics as a warning
            }
        }))

        if (deploymentCount === 0) return { score: 0, status: 'critical', load: 0, incidents: 1 }

        const avgLoad = (totalCpu / deploymentCount + totalMemory / deploymentCount) / 2
        const score = Math.max(0, 100 - (issues * 10) - (avgLoad * 20))

        let status: HealthScore['status'] = 'healthy'
        if (score < 60) status = 'critical'
        else if (score < 85) status = 'warning'

        return {
            score: Math.round(score),
            status,
            load: avgLoad,
            incidents: issues
        }
    }
}
