import * as fs from 'fs'
import * as path from 'path'
import { StackBlueprint } from '../../detector/schema'

type ExportOptions = {
  outDir: string
  region?: string
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function toTfIdentifier(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'resource'
}

function sortKeys<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {}
  for (const k of Object.keys(obj).sort()) out[k] = obj[k]
  return out as T
}

function writeJson(file: string, data: any) {
  const text = JSON.stringify(data, null, 2) + '\n'
  fs.writeFileSync(file, text)
}

export function generateTerraformJson(bp: StackBlueprint, region = 'us-east-1') {
  // Split into logical files for determinism and readability
  const provider = {
    terraform: {
      required_providers: {
        aws: { source: 'hashicorp/aws', version: '>= 4.0.0' },
      },
    },
    provider: {
      aws: [{ region }],
    },
  }

  const s3: any = { resource: { aws_s3_bucket: {} as Record<string, any> } }
  for (const name of [...(bp.resources?.s3Buckets ?? [])].sort()) {
    const id = toTfIdentifier(name)
    s3.resource.aws_s3_bucket[id] = { bucket: name }
  }

  const dynamo: any = { resource: { aws_dynamodb_table: {} as Record<string, any> } }
  for (const t of [...(bp.resources?.dynamoTables ?? [])].sort((a, b) => a.name.localeCompare(b.name))) {
    const id = toTfIdentifier(t.name)
    const attrs: Array<{ name: string; type: 'S' | 'N' | 'B' }> = [{ name: t.partitionKey || 'id', type: 'S' }]
    const keySchema: Array<{ attribute_name: string; key_type: 'HASH' | 'RANGE' }> = [
      { attribute_name: t.partitionKey || 'id', key_type: 'HASH' },
    ]
    if (t.sortKey) {
      attrs.push({ name: t.sortKey, type: 'S' })
      keySchema.push({ attribute_name: t.sortKey, key_type: 'RANGE' })
    }
    dynamo.resource.aws_dynamodb_table[id] = {
      name: t.name,
      billing_mode: 'PAY_PER_REQUEST',
      attribute: attrs.map((a) => ({ name: a.name, type: a.type })),
      hash_key: t.partitionKey || 'id',
      ...(t.sortKey ? { range_key: t.sortKey } : {}),
      key_schema: keySchema.map((k) => ({ attribute_name: k.attribute_name, key_type: k.key_type })),
    }
  }

  const lambda: any = { resource: { aws_lambda_function: {} as Record<string, any> } }
  for (const f of [...(bp.resources?.lambdaFunctions ?? [])].sort((a, b) => a.name.localeCompare(b.name))) {
    const id = toTfIdentifier(f.name)
    lambda.resource.aws_lambda_function[id] = {
      function_name: f.name,
      handler: f.handler || 'index.handler',
      runtime: f.runtime || 'nodejs20.x',
      // Note: zip file/source code wiring is intentionally omitted (documented in CONFORMANCE)
      filename: 'FUNCTION_ZIP_PLACEHOLDER',
      source_code_hash: 'HASH_PLACEHOLDER',
      role: 'ROLE_ARN_PLACEHOLDER',
    }
  }

  const services: any = { resource: { null_resource: {} as Record<string, any> } }
  for (const s of [...(bp.services ?? [])].sort((a, b) => a.name.localeCompare(b.name))) {
    const id = toTfIdentifier(`svc_${s.name}`)
    services.resource.null_resource[id] = { triggers: sortKeys({ name: s.name, type: s.type }) }
  }

  return { provider, s3, dynamo, lambda, services }
}

export async function exportTerraform(bp: StackBlueprint, opts: ExportOptions) {
  const outRoot = path.resolve(opts.outDir)
  const tfDir = path.join(outRoot, 'terraform')
  ensureDir(tfDir)
  const files: string[] = []
  const { provider, s3, dynamo, lambda, services } = generateTerraformJson(bp, opts.region)
  const mapping: Array<[string, any]> = [
    ['providers.tf.json', provider],
    ['s3.tf.json', s3],
    ['dynamo.tf.json', dynamo],
    ['lambda.tf.json', lambda],
    ['services.tf.json', services],
  ]
  for (const [name, json] of mapping) {
    const file = path.join(tfDir, name)
    writeJson(file, json)
    files.push(file)
  }
  return { files }
}
