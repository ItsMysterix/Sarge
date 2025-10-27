import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

export type LogSink = (line: string) => void

export interface TerraformRunner {
  run(args: string[], opts: { cwd: string; env?: NodeJS.ProcessEnv; onStdout?: LogSink; onStderr?: LogSink }): Promise<number>
}

export interface CloudExecOptions {
  dir: string
  env?: NodeJS.ProcessEnv
  redactKeys?: string[]
  onLog?: LogSink
}

export interface PlanSummary {
  toCreate: string[]
  toChange: string[]
  toDestroy: string[]
}

export interface CloudPlanResult {
  planFile: string
  planJsonFile: string
  plan: any
  summary: PlanSummary
}

export const defaultRunner: TerraformRunner = {
  run(args, opts) {
    return new Promise((resolve, reject) => {
      const p = spawn('terraform', args, { cwd: opts.cwd, env: opts.env, stdio: 'pipe' })
      p.stdout.setEncoding('utf8')
      p.stderr.setEncoding('utf8')
      p.stdout.on('data', (d: string) => opts.onStdout?.(String(d)))
      p.stderr.on('data', (d: string) => opts.onStderr?.(String(d)))
      p.on('error', reject)
      p.on('close', (code) => resolve(code ?? 1))
    })
  },
}

export function redactSecrets(line: string, keys: string[] = []): string {
  let out = line
  const patterns = [
    /AWS_SECRET_ACCESS_KEY\s*=\s*[^\s]+/g,
    /AWS_ACCESS_KEY_ID\s*=\s*[^\s]+/g,
    /AWS_SESSION_TOKEN\s*=\s*[^\s]+/g,
  ]
  for (const key of keys) patterns.push(new RegExp(`${key}\s*=\s*[^\s]+`, 'g'))
  for (const re of patterns) out = out.replace(re, (m) => m.replace(/=\s*.+$/, '= ****'))
  return out
}

function sorted<T>(arr: T[], by?: (x: T) => string): T[] {
  return [...arr].sort((a, b) => (by ? by(a).localeCompare(by(b)) : String(a).localeCompare(String(b))))
}

export function parsePlanJson(plan: any): PlanSummary {
  const create: string[] = []
  const change: string[] = []
  const destroy: string[] = []
  const resourceChanges = plan?.resource_changes ?? []
  for (const rc of resourceChanges) {
    const addr = rc.address || `${rc.type}.${rc.name}`
    const actions: string[] = rc.change?.actions ?? []
    if (actions.includes('create')) create.push(addr)
    if (actions.includes('update')) change.push(addr)
    if (actions.includes('delete')) destroy.push(addr)
    if (actions.includes('replace')) { change.push(addr) }
  }
  return {
    toCreate: sorted(create),
    toChange: sorted(change),
    toDestroy: sorted(destroy),
  }
}

export async function cloudPlan(opts: CloudExecOptions, runner: TerraformRunner = defaultRunner): Promise<CloudPlanResult> {
  const cwd = path.resolve(opts.dir)
  const planFile = path.join(cwd, 'tfplan')
  const planJsonFile = path.join(cwd, 'tfplan.json')
  const onLog = (line: string) => opts.onLog?.(redactSecrets(line, opts.redactKeys))
  // init
  await runner.run(['init', '-input=false', '-no-color'], { cwd, env: opts.env, onStdout: onLog, onStderr: onLog })
  // plan
  const code = await runner.run(['plan', '-input=false', '-lock=false', '-no-color', `-out=${planFile}`], { cwd, env: opts.env, onStdout: onLog, onStderr: onLog })
  if (code !== 0) throw new Error(`terraform plan failed with code ${code}`)
  // show json
  const code2 = await runner.run(['show', '-json', planFile], { cwd, env: opts.env, onStdout: (l) => fs.appendFileSync(planJsonFile, l), onStderr: onLog })
  if (code2 !== 0) throw new Error(`terraform show failed with code ${code2}`)
  const planRaw = fs.readFileSync(planJsonFile, 'utf8')
  const plan = JSON.parse(planRaw)
  const summary = parsePlanJson(plan)
  return { planFile, planJsonFile, plan, summary }
}

export interface CloudApplyDestroyResult {
  exitCode: number
}

export async function cloudApply(opts: CloudExecOptions, runner: TerraformRunner = defaultRunner): Promise<CloudApplyDestroyResult> {
  const cwd = path.resolve(opts.dir)
  const onLog = (line: string) => opts.onLog?.(redactSecrets(line, opts.redactKeys))
  await runner.run(['init', '-input=false', '-no-color'], { cwd, env: opts.env, onStdout: onLog, onStderr: onLog })
  const code = await runner.run(['apply', '-auto-approve', '-input=false', '-no-color'], { cwd, env: opts.env, onStdout: onLog, onStderr: onLog })
  return { exitCode: code }
}

export async function cloudDestroy(opts: CloudExecOptions, runner: TerraformRunner = defaultRunner): Promise<CloudApplyDestroyResult> {
  const cwd = path.resolve(opts.dir)
  const onLog = (line: string) => opts.onLog?.(redactSecrets(line, opts.redactKeys))
  await runner.run(['init', '-input=false', '-no-color'], { cwd, env: opts.env, onStdout: onLog, onStderr: onLog })
  const code = await runner.run(['destroy', '-auto-approve', '-input=false', '-no-color'], { cwd, env: opts.env, onStdout: onLog, onStderr: onLog })
  return { exitCode: code }
}
