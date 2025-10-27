import { type ApplyPlan } from '../planner/schema';
import type { EventBus } from '../domain/events';
import { SnapshotManager } from '../snapshot/index';
export interface ApplyOptions {
    repoPath?: string;
    dataRoot?: string;
    eventBus?: EventBus;
    serviceStartTimeoutMs?: number;
    healthRetries?: number;
    rollback?: () => Promise<void> | void;
    snapshot?: {
        manager: SnapshotManager;
        name?: string;
    };
}
export interface ApplyResult {
    ok: boolean;
    startedServices: string[];
    errors: Array<string | {
        category: 'detector' | 'planner' | 'runtime' | 'telemetry';
        message: string;
        hints?: string[];
    }>;
    stop: () => Promise<void>;
}
export declare function apply(plan: ApplyPlan, options?: ApplyOptions): Promise<ApplyResult>;
