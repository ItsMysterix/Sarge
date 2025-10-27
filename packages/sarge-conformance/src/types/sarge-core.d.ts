declare module 'sarge-core' {
  export interface SnapshotOptions { dataRoot: string; s3?: any; dynamo?: any; lambda?: any; logs?: any; metrics?: any }
  export class SnapshotManager {
    constructor(opts: SnapshotOptions)
    create(name: string, windowMs?: number): Promise<any>
    replay(name: string): Promise<void>
  }
}
