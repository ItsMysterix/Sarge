/**
 * Log Aggregator Service
 * 
 * Aggregates logs from multiple providers into a unified stream.
 * Correlates logs by project, environment, and timestamp.
 */

import { getProvider } from '../api/lib/providers'
import { getProviderCredentials } from '../api/lib/credentials'
import { LogEntry } from '../api/lib/providers/types'
import logger from '../lib/logger'

const aggregatorLogger = logger.child({ module: 'log-aggregator' })

export interface AggregatedLogLine extends LogEntry {
    provider: string
}

export class LogAggregator {
    /**
     * Get a unified stream of logs from multiple environment/provider pairs
     */
    async getUnifiedLogs(
        deployments: { deploymentId: string, providerId: string }[],
        db: any,
        userId: string,
        opts: { startTime?: number, limit?: number } = {}
    ): Promise<AggregatedLogLine[]> {
        const allLogs: AggregatedLogLine[] = []

        await Promise.all(deployments.map(async (d) => {
            const provider = getProvider(d.providerId)
            if (!provider) return

            try {
                const credentials = await getProviderCredentials(d.providerId, db, userId)
                const logs = await provider.getLogs({
                    deploymentId: d.deploymentId,
                    credentials,
                    startTime: opts.startTime,
                    limit: opts.limit || 50
                })

                allLogs.push(...logs.map(l => ({ ...l, provider: d.providerId })))
            } catch (err) {
                aggregatorLogger.warn({ deploymentId: d.deploymentId, providerId: d.providerId, err }, `[LogAggregator] Failed to fetch logs`)
            }
        }))

        // Sort by timestamp
        return allLogs.sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return timeA - timeB;
        })
    }
}
