import axios from 'axios';
import logger from '../lib/logger';

const rustLogger = logger.child({ module: 'rust-bridge' });

const BRIDGE_URL = process.env.RUST_BRIDGE_URL || 'http://127.0.0.1:4000/rpc';

export interface RustBridgeResponse<T> {
    jsonrpc: string;
    result?: T;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
    id: number;
}

export class RustBridgeService {
    /**
     * Generic call to the Rust Bridge JSON-RPC 2.0 API
     */
    private async call<T>(method: string, params: any): Promise<T> {
        try {
            const response = await axios.post<RustBridgeResponse<T>>(BRIDGE_URL, {
                jsonrpc: "2.0",
                method,
                params,
                id: Math.floor(Math.random() * 1000)
            });

            if (response.data.error) {
                throw new Error(`[RustBridge] ${method} error: ${response.data.error.message}`);
            }

            return response.data.result!;
        } catch (e: any) {
            rustLogger.error({ method, err: e.message }, `[RustBridge] Failed to call ${method}`);
            throw e;
        }
    }

    // Vulnerability Scanning
    async scanVulnerabilities(target: string) {
        return this.call('scan.vulnerability', { target });
    }

    // IaC Generation & Drift Detection
    async generateIaC(target: 'kubernetes' | 'terraform', service: any): Promise<any> {
        return this.call('iac.generate', { target, service });
    }

    async detectDrift(deploymentId: string, expectedState: any, actualState: any): Promise<{ hasDrift: boolean; details: any }> {
        return this.call('drift.detect', { deploymentId, expectedState, actualState });
    }

    async fixDrift(deploymentId: string, remediations: any[]) {
        return this.call('drift.fix', { deploymentId, remediations });
    }

    // RBAC Enforcement
    async enforceRbac(userId: string, resource: any, action: any) {
        return this.call('rbac.enforce', { userId, resource, action });
    }

    // Secrets Management
    async getSecret(key: string) {
        return this.call('secrets.get', { key });
    }

    async setSecret(key: string, value: string) {
        return this.call('secrets.set', { key, value });
    }

    // GTM & Remediation
    async resolveGtm(context: any) {
        return this.call('gtm.resolve', context);
    }

    async planRemediation(incident: any) {
        return this.call('remediation.plan', incident);
    }
}

export const rustBridge = new RustBridgeService();
