import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3'

async function main() {
  const s3 = new S3Client({})
  await s3.send(new ListBucketsCommand({}))
}

main().catch(() => {})
