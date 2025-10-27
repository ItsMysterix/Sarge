declare module 'sarge-core' {
  export type ID = string
  export type LifecycleState = 'init' | 'starting' | 'healthy' | 'stopping' | 'stopped' | 'error'
  export interface Resource {
    id: ID
    name: string
    type: string
    serviceId: ID
    dependsOn?: ID[]
  }
    export interface SnapshotOptions { dataRoot: string; s3?: any; dynamo?: any; lambda?: any; logs?: any; metrics?: any }
    export class SnapshotManager {
      constructor(opts: SnapshotOptions)
      create(name: string, windowMs?: number): Promise<any>
      replay(name: string): Promise<void>
    }
  export interface Service {
    id: ID
    name: string
    kind: string
    version: string
    dependsOn?: ID[]
    state: LifecycleState
  }
  export interface Stack {
    id: ID
    name: string
    services: Service[]
    resources: Resource[]
  }
  export interface TelemetrySpec {
    logs: { structuredJson: boolean }
    metrics: { prometheusExport: boolean }
    traces?: { enabled: boolean }
  }
  export interface Workspace {
    id: ID
    name: string
    stacks: Stack[]
    telemetry: TelemetrySpec
    dataRoot: string
  }
}
