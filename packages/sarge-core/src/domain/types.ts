export type ID = string

export type LifecycleState =
  | 'init'
  | 'starting'
  | 'healthy'
  | 'stopping'
  | 'stopped'
  | 'error'

export interface TelemetrySpec {
  logs: {
    structuredJson: boolean
  }
  metrics: {
    prometheusExport: boolean
  }
  traces?: {
    enabled: boolean
  }
}

export interface Resource {
  id: ID
  name: string
  type: string
  serviceId: ID
  dependsOn?: ID[]
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

export interface Snapshot {
  id: ID
  workspaceId: ID
  createdAt: Date
  label?: string
  description?: string
  filePath: string
}

export interface Workspace {
  id: ID
  name: string
  stacks: Stack[]
  telemetry: TelemetrySpec
  dataRoot: string // e.g., ./data/sarge/workspaces/default
}
