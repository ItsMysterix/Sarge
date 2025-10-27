import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { type ApplyPlan } from '../planner/schema'
import { formatLog } from '../apply/logging'
import { createTelemetry, markUp } from '../telemetry/attach'

export interface ExportComposeOptions {
  outDir?: string
  fileName?: string
  write?: boolean
}

export interface ExportComposeResult {
  filePath: string
  yaml: string
}

export function exportCompose(plan: ApplyPlan, options: ExportComposeOptions = {}): ExportComposeResult {
  const outDir = options.outDir ?? process.cwd()
  const fileName = options.fileName ?? 'docker-compose.sarge.yml'
  const filePath = path.join(outDir, fileName)

  const portsMap = new Map<string, number>()
  for (const ap of plan.assignedPorts) {
    if (ap.assigned[0]) portsMap.set(ap.service, ap.assigned[0])
  }

  const needLocalstack =
    plan.blueprint.resources.s3Buckets.length > 0 ||
    plan.blueprint.resources.dynamoTables.length > 0 ||
    plan.blueprint.resources.lambdaFunctions.length > 0

  const servicesYaml: string[] = []

  // localstack first if needed for determinism
  if (needLocalstack) {
    const svc = [
      '  localstack:',
      '    image: localstack/localstack:2.3',
      '    container_name: sarge-localstack',
      '    environment:',
      `      - SERVICES=${servicesList(plan)}`,
      '    ports:',
      '      - "4566:4566"',
      '    networks:',
      '      - sarge'
    ]
    servicesYaml.push(svc.join('\n'))
  }

  for (const op of plan.serviceOps) {
    if (op.op !== 'start') continue
    const svc = plan.blueprint.services.find((s) => s.name === op.name)
    if (!svc) continue
    const assigned = portsMap.get(svc.name)
    const cwdRel = svc.cwd ? `/workspace/${svc.cwd}` : '/workspace'
    const lines: string[] = []
    lines.push(`  ${svc.name}:`)
    lines.push('    image: node:18-alpine')
    lines.push(`    container_name: sarge-${svc.name}`)
    lines.push('    working_dir: ' + cwdRel)
    lines.push('    command: ' + JSON.stringify(svc.startCommand || 'node server.js'))
    lines.push('    environment:')
    if (assigned) lines.push(`      - PORT=${assigned}`)
    for (const key of svc.envKeys || []) lines.push(`      - ${key}=
`)
    if (assigned) {
      lines.push('    ports:')
      lines.push(`      - "${assigned}:${assigned}"`)
    }
    lines.push('    volumes:')
    lines.push('      - .:/workspace')
    lines.push('    networks:')
    lines.push('      - sarge')
    if (needLocalstack) {
      lines.push('    depends_on:')
      lines.push('      - localstack')
    }
    servicesYaml.push(lines.join('\n'))
  }

  const yaml = [
    'version: "3.9"',
    'services:',
    servicesYaml.join('\n'),
    'networks:',
    '  sarge: {}'
  ].join('\n') + '\n'

  if (options.write !== false) {
    fs.writeFileSync(filePath, yaml)
  }
  return { filePath, yaml }
}

function servicesList(plan: ApplyPlan): string {
  const set = new Set<string>()
  if (plan.blueprint.resources.s3Buckets.length) set.add('s3')
  if (plan.blueprint.resources.dynamoTables.length) set.add('dynamodb')
  if (plan.blueprint.resources.lambdaFunctions.length) set.add('lambda')
  const list = Array.from(set).sort().join(',')
  return list || ''
}

export interface RunComposeOptions {
  cwd?: string
  composeFile?: string
  dataRoot?: string
  telemetryEnabled?: boolean
}

export interface RunComposeResult {
  ok: boolean
  errors: string[]
  stop: () => Promise<void>
}

export async function runCompose(plan: ApplyPlan, options: RunComposeOptions = {}): Promise<RunComposeResult> {
  const errors: string[] = []
  if (process.env.DOCKER_MODE !== 'true') {
    return { ok: false, errors: ['docker mode disabled'], stop: async () => {} }
  }
  const cwd = options.cwd ?? process.cwd()
  const { filePath } = exportCompose(plan, { outDir: cwd })
  const logsDir = path.join(options.dataRoot ?? path.resolve(process.cwd(), 'data/sarge'), 'logs')
  fs.mkdirSync(logsDir, { recursive: true })

  // bring up compose
  await new Promise<void>((resolve, reject) => {
    const p = spawn(`docker compose -f ${filePath} up -d`, { cwd, shell: true })
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('docker compose up failed'))))
  })

  // tail logs for each service to bridge into sarge logs
  const tails: Array<{ name: string; proc: any; stream: fs.WriteStream }> = []
  const telemetry = options.telemetryEnabled ? createTelemetry() : undefined
  for (const op of plan.serviceOps) {
    if (op.op !== 'start') continue
    const name = op.name
    const container = `sarge-${name}`
    const logFile = path.join(logsDir, `${name}.log`)
    const out = fs.createWriteStream(logFile, { flags: 'a' })
    const t = spawn(`docker logs -f ${container}`, { cwd, shell: true })
    t.stdout?.on('data', (d) => out.write(formatLog(name, 'stdout', d)))
    t.stderr?.on('data', (d) => out.write(formatLog(name, 'stderr', d)))
    tails.push({ name, proc: t, stream: out })
    if (telemetry) markUp(telemetry, name, true)
  }

  const stop = async () => {
    // stop tails first
    for (const t of tails) {
      try { t.proc.kill() } catch {}
      try { t.stream.end() } catch {}
      if (telemetry) markUp(telemetry, t.name, false)
    }
    await new Promise<void>((resolve) => {
      const p = spawn(`docker compose -f ${filePath} down`, { cwd, shell: true })
      p.on('exit', () => resolve())
    })
  }

  return { ok: true, errors, stop }
}
