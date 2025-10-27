export interface ServiceTelemetry {
    up: Map<string, number>;
    restarts: Map<string, number>;
}
export declare function createTelemetry(): ServiceTelemetry;
export declare function markUp(t: ServiceTelemetry, name: string, up: boolean): void;
export declare function markRestart(t: ServiceTelemetry, name: string): void;
export declare function renderPrometheus(t: ServiceTelemetry): string;
export declare function ensureDashboards(dataRoot: string): void;
