export interface ServicePluginManifest {
    name: string;
    kind: string;
    version: string;
    deps?: string[];
    ports?: number[];
}
export interface ServicePluginContext {
    workspaceDataRoot: string;
    env: Record<string, string | undefined>;
}
export interface ServicePlugin {
    manifest: ServicePluginManifest;
    init(ctx: ServicePluginContext): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    health(): Promise<'healthy' | 'degraded' | 'stopped'>;
}
