declare module 'sarge-core' {
  export type ID = string
  export interface Resource {
    id: ID
    name: string
    type: string
    serviceId: ID
    dependsOn?: ID[]
  }
}
