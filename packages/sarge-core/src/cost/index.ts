import * as fs from 'fs'
import * as path from 'path'

export const CURRENT_PRICING_VERSION = '2025-10-01'

type S3Pricing = { storageGBMonth: number; putPer1k: number; getPer1k: number }
type DynamoPricing = { storageGBMonth: number; onDemandReadPerMillion: number; onDemandWritePerMillion: number }
type LambdaPricing = { requestPerMillion: number; gbSecond: number }
type SQSPricing = { requestPerMillion: number }
type SNSPricing = { requestPerMillion: number }

export type CostSource =
  | { kind: 'local'; dataRoot: string; usage?: UsageHints }
  | { kind: 'terraform'; terraform: any; usage?: UsageHints }

export type UsageHints = {
  s3?: { putRequests?: number; getRequests?: number }
  dynamo?: { readRequests?: number; writeRequests?: number }
  lambda?: { requests?: number; gbSeconds?: number }
  sqs?: { requests?: number }
  sns?: { requests?: number }
}

export type CostBreakdown = {
  s3: { storageGB: number; storageUSD: number; requestsUSD: number }
  dynamo: { storageGB: number; storageUSD: number; requestsUSD: number }
  lambda: { requestsUSD: number; computeUSD: number }
  sqs: { requestsUSD: number }
  sns: { requestsUSD: number }
}

export type CostEstimate = {
  pricingVersion: string
  totalMonthlyUSD: number
  breakdown: CostBreakdown
}

function loadJson<T>(file: string): T {
  const raw = fs.readFileSync(file, 'utf8')
  return JSON.parse(raw) as T
}

function pricingDir(): string {
  // Resolve relative to this file's package root
  const pkgRoot = path.resolve(__dirname, '..', '..')
  return path.join(pkgRoot, 'pricing', CURRENT_PRICING_VERSION)
}

function loadPricing() {
  const dir = pricingDir()
  const s3 = loadJson<S3Pricing>(path.join(dir, 's3.json'))
  const dynamo = loadJson<DynamoPricing>(path.join(dir, 'dynamo.json'))
  const lambda = loadJson<LambdaPricing>(path.join(dir, 'lambda.json'))
  const sqs = loadJson<SQSPricing>(path.join(dir, 'sqs.json'))
  const sns = loadJson<SNSPricing>(path.join(dir, 'sns.json'))
  return { s3, dynamo, lambda, sqs, sns }
}

export function estimate(source: CostSource): CostEstimate {
  const P = loadPricing()

  let s3StorageBytes = 0
  let dynamoStorageBytes = 0

  // Requests/usage from hints
  const s3Usage = source.kind === 'local' ? source.usage?.s3 : source.usage?.s3
  const dynamoUsage = source.kind === 'local' ? source.usage?.dynamo : source.usage?.dynamo
  const lambdaUsage = source.kind === 'local' ? source.usage?.lambda : source.usage?.lambda
  const sqsUsage = source.kind === 'local' ? source.usage?.sqs : source.usage?.sqs
  const snsUsage = source.kind === 'local' ? source.usage?.sns : source.usage?.sns

  if (source.kind === 'local') {
    const dataRoot = source.dataRoot
    // S3: sum object sizes from meta files
    const s3root = path.join(dataRoot, 's3')
    if (fs.existsSync(s3root)) {
      for (const bucket of fs.readdirSync(s3root)) {
        const bdir = path.join(s3root, bucket)
        if (!fs.statSync(bdir).isDirectory()) continue
        // Walk recursively for *.meta.json
        const walk = (dir: string) => {
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) walk(full)
            else if (entry.isFile() && entry.name.endsWith('.meta.json')) {
              const meta = JSON.parse(fs.readFileSync(full, 'utf8')) as { size: number }
              s3StorageBytes += meta.size || 0
            }
          }
        }
        walk(bdir)
      }
    }
    // Dynamo: sum item JSON file sizes
    const droot = path.join(dataRoot, 'dynamo')
    if (fs.existsSync(droot)) {
      for (const table of fs.readdirSync(droot)) {
        const tdir = path.join(droot, table)
        if (!fs.statSync(tdir).isDirectory()) continue
        const dataDir = path.join(tdir, 'data')
        const walk = (dir: string) => {
          if (!fs.existsSync(dir)) return
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) walk(full)
            else if (entry.isFile() && entry.name.endsWith('.json')) {
              dynamoStorageBytes += fs.statSync(full).size
            }
          }
        }
        walk(dataDir)
      }
    }
  } else if (source.kind === 'terraform') {
    // We can infer presence of resources but not sizes/usages; defaults remain 0 unless usage hints provided
    // Future: infer provisioned throughput when present
    void source.terraform
  }

  // Compute costs
  const gb = (bytes: number) => bytes / 1_000_000_000
  const s3StorageGB = gb(s3StorageBytes)
  const dynamoStorageGB = gb(dynamoStorageBytes)

  const s3StorageUSD = s3StorageGB * P.s3.storageGBMonth
  const s3RequestsUSD = ((s3Usage?.putRequests || 0) / 1000) * P.s3.putPer1k + ((s3Usage?.getRequests || 0) / 1000) * P.s3.getPer1k

  const dynamoStorageUSD = dynamoStorageGB * P.dynamo.storageGBMonth
  const dynamoReqUSD = ((dynamoUsage?.readRequests || 0) / 1_000_000) * P.dynamo.onDemandReadPerMillion +
    ((dynamoUsage?.writeRequests || 0) / 1_000_000) * P.dynamo.onDemandWritePerMillion

  const lambdaReqUSD = ((lambdaUsage?.requests || 0) / 1_000_000) * P.lambda.requestPerMillion
  const lambdaComputeUSD = (lambdaUsage?.gbSeconds || 0) * P.lambda.gbSecond

  const sqsReqUSD = ((sqsUsage?.requests || 0) / 1_000_000) * P.sqs.requestPerMillion
  const snsReqUSD = ((snsUsage?.requests || 0) / 1_000_000) * P.sns.requestPerMillion

  const breakdown: CostBreakdown = {
    s3: { storageGB: round2(s3StorageGB), storageUSD: round2(s3StorageUSD), requestsUSD: round2(s3RequestsUSD) },
    dynamo: { storageGB: round2(dynamoStorageGB), storageUSD: round2(dynamoStorageUSD), requestsUSD: round2(dynamoReqUSD) },
    lambda: { requestsUSD: round2(lambdaReqUSD), computeUSD: round4(lambdaComputeUSD) },
    sqs: { requestsUSD: round2(sqsReqUSD) },
    sns: { requestsUSD: round2(snsReqUSD) },
  }

  const totalMonthlyUSD = round2(
    breakdown.s3.storageUSD + breakdown.s3.requestsUSD +
    breakdown.dynamo.storageUSD + breakdown.dynamo.requestsUSD +
    breakdown.lambda.requestsUSD + breakdown.lambda.computeUSD +
    breakdown.sqs.requestsUSD + breakdown.sns.requestsUSD
  )

  return { pricingVersion: CURRENT_PRICING_VERSION, totalMonthlyUSD, breakdown }
}

function round2(n: number) { return Math.round(n * 100) / 100 }
function round4(n: number) { return Math.round(n * 10000) / 10000 }
