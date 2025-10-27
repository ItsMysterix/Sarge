import { type ApplyPlan } from '../planner/schema';
export interface ExportComposeOptions {
    outDir?: string;
    fileName?: string;
    write?: boolean;
}
export interface ExportComposeResult {
    filePath: string;
    yaml: string;
}
export declare function exportCompose(plan: ApplyPlan, options?: ExportComposeOptions): ExportComposeResult;
export interface RunComposeOptions {
    cwd?: string;
    composeFile?: string;
    dataRoot?: string;
    telemetryEnabled?: boolean;
}
export interface RunComposeResult {
    ok: boolean;
    errors: string[];
    stop: () => Promise<void>;
}
export declare function runCompose(plan: ApplyPlan, options?: RunComposeOptions): Promise<RunComposeResult>;
