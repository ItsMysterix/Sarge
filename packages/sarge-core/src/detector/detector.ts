import fs from 'node:fs'
import path from 'node:path'
import { StackBlueprintSchema, type StackBlueprint, type Service } from './schema'

export interface DetectOptions {
  overrides?: Partial<StackBlueprint>
  maxFiles?: number
}

const DEFAULT_MAX_FILES = 500

export async function detectStack(repoPath: string, opts: DetectOptions = {}): Promise<StackBlueprint> {
  const maxFiles = opts.maxFiles ?? DEFAULT_MAX_FILES
  const files = await listFilesBounded(repoPath, maxFiles)

  // Base signals
  const hasDockerfile = files.some((f) => path.basename(f).toLowerCase() === 'dockerfile')
  const composeFiles = files.filter((f) => /docker-compose(\.[^/\\]+)?\.ya?ml$/i.test(f))
  const envFiles = files.filter((f) => /\/.env[.^/\\-]*/i.test('/' + f))

  // package.json and deps
  const pkgJsonPath = files.find((f) => path.basename(f) === 'package.json')
  const pkg = pkgJsonPath ? safeReadJson(pkgJsonPath) as any : undefined
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) }
  const scripts = pkg?.scripts || {}

  // Framework hints
  const isNext = !!deps['next']
  const isExpress = !!deps['express']

  // Ports and start command heuristics
  const startCmd = scripts['start'] || scripts['dev'] || undefined
  const ports = inferPortsFromScripts(scripts)

  // Services
  const services: Service[] = []
  if (isNext) {
    services.push({
      name: pkg?.name || 'web',
      type: 'web',
      startCommand: startCmd,
      ports: ports.length ? ports : [3000],
      envKeys: [],
      health: { http: { path: '/' } }
    })
  } else if (isExpress) {
    services.push({
      name: pkg?.name || 'api',
      type: 'api',
      startCommand: startCmd,
      ports: ports.length ? ports : [3000],
      envKeys: [],
      health: { http: { path: '/' } }
    })
  } else if (startCmd) {
    services.push({
      name: pkg?.name || 'service',
      type: 'worker',
      startCommand: startCmd,
      ports,
      envKeys: []
    })
  }

  // AWS SDK imports
  const codeFiles = files.filter((f) => /\.(t|j)sx?$/i.test(f))
  const { awsSdks, resourceHints } = scanAwsSdks(codeFiles)

  // ENV keys
  const envKeys = new Set<string>()
  for (const f of envFiles) {
    try {
      const txt = fs.readFileSync(f, 'utf8')
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^([A-Z0-9_]+)\s*=/)
        if (m) envKeys.add(m[1])
      }
    } catch { /* ignore */ }
  }
  services.forEach((s) => (s.envKeys = Array.from(envKeys)))

  // Blueprint assembly
  const blueprint: StackBlueprint = {
    services,
    resources: {
      s3Buckets: resourceHints.s3Buckets,
      dynamoTables: resourceHints.dynamoTables,
      lambdaFunctions: resourceHints.lambdaFunctions
    },
    ports: dedupeNumbers(services.flatMap((s) => s.ports || [])),
    envKeys: Array.from(envKeys),
    docker: { dockerfile: hasDockerfile, composeFiles },
    awsSdks
  }

  // Apply overrides and validate
  const merged = { ...blueprint, ...(opts.overrides || {}) }
  return StackBlueprintSchema.parse(merged)
}

function safeReadJson(p: string) {
  try {
    const raw = fs.readFileSync(p, 'utf8')
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

function dedupeNumbers(nums: number[]) {
  return Array.from(new Set(nums.filter((n) => Number.isFinite(n)))) as number[]
}

function inferPortsFromScripts(scripts: Record<string, string>): number[] {
  const candidates = [scripts['start'], scripts['dev'], scripts['serve']].filter(Boolean) as string[]
  const ports = new Set<number>()
  for (const cmd of candidates) {
    // -p 4000 or --port 4000
    const m1 = cmd.match(/(?:-p|--port)\s+(\d{2,5})/)
    if (m1) ports.add(parseInt(m1[1], 10))
    // PORT=4000
    const m2 = cmd.match(/PORT\s*=\s*(\d{2,5})/)
    if (m2) ports.add(parseInt(m2[1], 10))
  }
  return Array.from(ports)
}

function scanAwsSdks(files: string[]) {
  const sdks = new Set<'s3' | 'dynamodb' | 'lambda'>()
  const resourceHints = {
    s3Buckets: [] as string[],
    dynamoTables: [] as { name: string; partitionKey: string; sortKey?: string }[],
    lambdaFunctions: [] as { name: string; handler?: string; runtime?: string }[]
  }
  const s3Re = /@aws-sdk\/client-s3/ 
  const ddbRe = /@aws-sdk\/client-dynamodb/
  const lambdaRe = /@aws-sdk\/client-lambda/

  for (const f of files) {
    let content = ''
    try { content = fs.readFileSync(f, 'utf8') } catch { continue }
    if (s3Re.test(content)) sdks.add('s3')
    if (ddbRe.test(content)) sdks.add('dynamodb')
    if (lambdaRe.test(content)) sdks.add('lambda')

    // naive bucket/table name hints via strings in List/Put commands
    const bucketHints = [...content.matchAll(/Bucket:\s*['"]([a-z0-9-.]{3,63})['"]/gi)].map((m) => m[1])
    for (const b of bucketHints) if (!resourceHints.s3Buckets.includes(b)) resourceHints.s3Buckets.push(b)
    const tableHints = [...content.matchAll(/TableName:\s*['"]([A-Za-z0-9_.-]{3,255})['"]/g)].map((m) => m[1])
    for (const t of tableHints) if (!resourceHints.dynamoTables.find((x) => x.name === t)) resourceHints.dynamoTables.push({ name: t, partitionKey: 'id' })
  }

  return { awsSdks: Array.from(sdks), resourceHints }
}

async function listFilesBounded(root: string, maxFiles: number): Promise<string[]> {
  const out: string[] = []
  const queue: string[] = [root]
  const ignore = new Set(['node_modules', '.git', 'dist', 'build', '.next'])
  while (queue.length && out.length < maxFiles) {
    const dir = queue.shift()!
    let entries: fs.Dirent[] = []
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { continue }
    for (const e of entries) {
      const abs = path.join(dir, e.name)
      if (e.isDirectory()) {
        if (!ignore.has(e.name)) queue.push(abs)
      } else {
        out.push(abs)
        if (out.length >= maxFiles) break
      }
    }
  }
  return out
}
