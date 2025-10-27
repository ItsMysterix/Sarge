export interface ServicePluginManifest {
  name: string
  kind: string // e.g., s3 | dynamo | lambda | custom
  version: string
  deps?: string[] // kinds or names this plugin requires
  ports?: number[] // local ports this service uses
}

export interface ServicePluginContext {
  workspaceDataRoot: string
  env: Record<string, string | undefined>
}

export interface ServicePlugin {
  manifest: ServicePluginManifest
  init(ctx: ServicePluginContext): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>
  health(): Promise<'healthy' | 'degraded' | 'stopped'>
}
