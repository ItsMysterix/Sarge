declare module 'sarge-services-s3' {
  export type ACL = 'private' | 'public-read'
  export interface ObjectMeta {
    key: string
    size: number
    etag: string
    contentType: string
    lastModified: string
    acl: ACL
  }
  export interface ListObjectsV2Input {
    prefix?: string
    delimiter?: string
  }
  export interface ListObjectsV2Output {
    contents: ObjectMeta[]
    commonPrefixes: string[]
  }
  export interface S3ServiceOptions { dataRoot: string }
  export class S3Service {
    constructor(opts: S3ServiceOptions)
    createBucket(name: string, acl?: ACL): Promise<{ name: string; createdAt: string }>
    deleteBucket(name: string): Promise<void>
    putObject(bucket: string, key: string, body: Buffer | string, contentType?: string, acl?: ACL): Promise<ObjectMeta>
    getObject(bucket: string, key: string): Promise<{ body: Buffer; meta: ObjectMeta }>
    headObject(bucket: string, key: string): Promise<ObjectMeta>
    deleteObject(bucket: string, key: string): Promise<void>
    listObjectsV2(bucket: string, input?: ListObjectsV2Input): Promise<ListObjectsV2Output>
  }
}
