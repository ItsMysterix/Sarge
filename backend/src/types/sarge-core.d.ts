declare module 'sarge-core' {
  export class SnapshotManager {
    constructor(opts: any)
    create(name: string, windowMs?: number): Promise<{ name: string; createdAt: string }>
    replay(name: string): Promise<void>
  }
}
