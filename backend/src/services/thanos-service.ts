/**
 * Thanos Metrics Service
 * 
 * Provides long-term metrics storage and multi-cluster querying
 * by interacting with Thanos Query.
 */

import axios from 'axios';
import logger from '../lib/logger';

const thanosLogger = logger.child({ module: 'thanos' });

export interface ThanosMetric {
    target: string;
    datapoints: [number, number][]; // [value, timestamp]
}

export class ThanosService {
    private queryUrl: string;

    constructor(queryUrl: string = process.env.THANOS_QUERY_URL || 'http://thanos-query:10901') {
        this.queryUrl = queryUrl;
    }

    /**
     * Query long-term metrics from Thanos
     */
    async queryRange(prometheusQuery: string, start: number, end: number, step: string = '5m'): Promise<ThanosMetric[]> {
        try {
            const response = await axios.get(`${this.queryUrl}/api/v1/query_range`, {
                params: {
                    query: prometheusQuery,
                    start,
                    end,
                    step,
                }
            });

            if (response.data.status !== 'success') {
                throw new Error(`Thanos query failed: ${JSON.stringify(response.data.error)}`);
            }

            return response.data.data.result.map((r: any) => ({
                target: JSON.stringify(r.metric),
                datapoints: r.values.map((v: any) => [parseFloat(v[1]), v[0]])
            }));
        } catch (error) {
            thanosLogger.error({ msg: '[ThanosService] Query error', err: error });
            throw error;
        }
    }

    /**
     * Get global view of resource usage across all clusters
     */
    async getGlobalResourceUsage(projectId: string): Promise<any> {
        const query = `sum(container_cpu_usage_seconds_total{sarge_project="${projectId}"}) by (cluster)`;
        return this.queryRange(query, Date.now() / 1000 - 3600, Date.now() / 1000);
    }
}
