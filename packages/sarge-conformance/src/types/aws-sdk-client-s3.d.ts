declare module '@aws-sdk/client-s3' {
  export class S3Client {
    constructor(opts: any)
    send(cmd: any): Promise<any>
  }
  export class CreateBucketCommand { constructor(input: any) }
  export class PutObjectCommand { constructor(input: any) }
  export class GetObjectCommand { constructor(input: any) }
  export class HeadObjectCommand { constructor(input: any) }
  export class DeleteObjectCommand { constructor(input: any) }
  export class DeleteBucketCommand { constructor(input: any) }
  export class ListObjectsV2Command { constructor(input: any) }
}
