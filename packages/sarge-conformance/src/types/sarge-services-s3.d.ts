declare module 'sarge-services-s3' {
  export class S3Service {
    constructor(opts: { dataRoot: string })
    createBucket(name: string): Promise<any>
    putObject(bucket: string, key: string, body: Buffer | string, contentType?: string): Promise<any>
    getObject(bucket: string, key: string): Promise<{ body: Buffer; meta: { contentType: string } }>
    listObjectsV2(bucket: string, input?: { prefix?: string; delimiter?: string }): Promise<{ contents: Array<{ key: string }>; commonPrefixes: string[] }>
  }
}
