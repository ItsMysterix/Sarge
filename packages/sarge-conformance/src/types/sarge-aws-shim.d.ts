declare module 'sarge-aws-shim/dist/server.js' {
  import type { Server } from 'http'
  export function createServer(opts?: { insecure?: boolean; port?: number }): {
    server: Server
    listen(port?: number): Promise<number>
    getLast(): any
  }
}
