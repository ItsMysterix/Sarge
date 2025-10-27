import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import { CloudWatchLogsService } from 'sarge-cloudwatch'

export const SARGE_SERVICES_LAMBDA_VERSION = '0.1.0'

export type LambdaRuntime = 'nodejs18.x' | 'python3.11' | 'go1.x'

export interface LambdaFunctionConfig {
	name: string
	runtime: LambdaRuntime
	handler: string // e.g. file.handler for Python/Node; for Go, binary path or name
	codePath?: string // base directory; defaults to process.cwd()
	env?: Record<string, string>
	timeoutMs?: number
	memoryMb?: number
	logGroup?: string // defaults to /aws/lambda/<name>
}

export interface InvokeOptions { payload?: any; context?: Record<string, any> }
export type InvokeResult = { ok: true; payload: any; logsFile: string } | { ok: false; error: LambdaError; logsFile: string }
export interface LambdaError { type: string; message: string; details?: any }

export interface LambdaAdapterOptions { dataRoot: string }

export class LambdaService {
	private cw: CloudWatchLogsService
	private dataRoot: string
	private functions = new Map<string, LambdaFunctionConfig>()

	constructor(opts: LambdaAdapterOptions) {
		this.dataRoot = opts.dataRoot
		this.cw = new CloudWatchLogsService({ dataRoot: this.dataRoot })
	}

	register(fn: LambdaFunctionConfig) {
		this.functions.set(fn.name, fn)
	}

	async invoke(name: string, opts: InvokeOptions = {}): Promise<InvokeResult> {
		const fn = this.functions.get(name)
		if (!fn) return { ok: false, error: { type: 'NotFound', message: `Function ${name} not registered` }, logsFile: '' }
		const group = fn.logGroup || `/aws/lambda/${name}`
		const stream = 'local'
		await this.cw.createLogGroup(group)
		await this.cw.createLogStream(group, stream)

		const log = async (message: string, level?: string, fields?: Record<string, unknown>) => {
			await this.cw.putLogEvents(group, stream, [{ timestamp: Date.now(), message, level, fields }])
		}

		const logsDir = path.join(this.dataRoot, 'logs')
		const logsFile = path.join(logsDir, Buffer.from(`${group}/${stream}`, 'utf-8').toString('base64url') + '.log')

		try {
			let res: any
			if (fn.runtime.startsWith('nodejs')) {
				res = await invokeNode(fn, opts, log)
			} else if (fn.runtime.startsWith('python')) {
				res = await invokePython(fn, opts, log)
			} else if (fn.runtime.startsWith('go')) {
				res = await invokeGo(fn, opts, log)
			} else {
				throw new Error(`Unsupported runtime: ${fn.runtime}`)
			}
			await log('END RequestId: local')
			return { ok: true, payload: res, logsFile }
		} catch (e: any) {
			const err: LambdaError = { type: 'RuntimeError', message: e?.message || String(e) }
			await log('ERROR ' + err.message, 'error')
			return { ok: false, error: err, logsFile }
		}
	}
}

async function invokeNode(fn: LambdaFunctionConfig, opts: InvokeOptions, log: (m: string) => Promise<void>) {
	const [file, handler] = splitHandler(fn.handler)
	const base = path.resolve(fn.codePath || process.cwd())
	const abs = path.join(base, ensureExt(file, '.js'))
	await log(`START local node ${file}.${handler}`)
	const mod = await import(pathToFileUrl(abs))
	const h = mod[handler]
	if (typeof h !== 'function') throw new Error(`Handler ${handler} not found in ${abs}`)
	const ctx = buildContext(fn, opts)
	const result = await withTimeout(fn.timeoutMs ?? 3000, () => Promise.resolve(h(opts.payload, ctx)))
	return result
}

async function invokePython(fn: LambdaFunctionConfig, opts: InvokeOptions, log: (m: string) => Promise<void>) {
	const [file, handler] = splitHandler(fn.handler)
	const base = path.resolve(fn.codePath || process.cwd())
	const abs = path.join(base, ensureExt(file, '.py'))
	await log(`START local python ${file}.${handler}`)
	const runner = path.join(__dirname, 'py_runner.py')
	const payload = JSON.stringify({ module: abs, handler, payload: opts.payload || {}, context: buildContext(fn, opts) })
	const env = { ...process.env, ...(fn.env || {}) }
	const out = await execSpawn('python3', [runner, payload], { cwd: base, env, timeoutMs: fn.timeoutMs ?? 3000 })
	const parsed = JSON.parse(out)
	if (parsed.ok) return parsed.result
	throw new Error(parsed.error?.message || 'python runtime error')
}

async function invokeGo(fn: LambdaFunctionConfig, opts: InvokeOptions, log: (m: string) => Promise<void>) {
	// For go1.x: handler is a binary path or basename; we prefer explicit binary path under codePath
	const base = path.resolve(fn.codePath || process.cwd())
	const bin = fn.handler.includes('/') ? path.resolve(base, fn.handler) : path.join(base, fn.handler)
	await log(`START local go ${path.basename(bin)}`)
	const env = { ...process.env, ...(fn.env || {}) }
	const payload = JSON.stringify({ payload: opts.payload || {}, context: buildContext(fn, opts) })
	const out = await execSpawn(bin, [], { cwd: base, env, timeoutMs: fn.timeoutMs ?? 3000, stdin: payload })
	// Expect the binary to print JSON result to stdout
	const parsed = JSON.parse(out)
	return parsed
}

function buildContext(fn: LambdaFunctionConfig, opts: InvokeOptions) {
	return {
		functionName: fn.name,
		memoryLimitInMB: fn.memoryMb ?? 128,
		timeoutMs: fn.timeoutMs ?? 3000,
		...opts.context,
	}
}

function splitHandler(h: string): [string, string] {
	const i = h.lastIndexOf('.')
	if (i < 0) return [h, 'handler']
	return [h.slice(0, i), h.slice(i + 1)]
}
function ensureExt(file: string, ext: string) {
	return file.endsWith(ext) ? file : file + ext
}
function pathToFileUrl(p: string) {
	const { pathToFileURL } = require('url')
	return pathToFileURL(p).href
}

async function withTimeout<T>(ms: number, f: () => Promise<T>): Promise<T> {
	let to: any
	return await Promise.race([
		new Promise<T>((_r, rej) => (to = setTimeout(() => rej(new Error(`timeout ${ms}ms`)), ms))),
		f().finally(() => clearTimeout(to)),
	])
}

async function execSpawn(cmd: string, args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number; stdin?: string }): Promise<string> {
	return await new Promise((resolve, reject) => {
		const p = spawn(cmd, args, { cwd: opts.cwd, env: opts.env })
		let out = ''
		let err = ''
		let killed = false
		if (opts.stdin) p.stdin.write(opts.stdin)
		if (opts.stdin) p.stdin.end()
		p.stdout.setEncoding('utf8')
		p.stderr.setEncoding('utf8')
		p.stdout.on('data', (d) => (out += String(d)))
		p.stderr.on('data', (d) => (err += String(d)))
		let to: any
		if (opts.timeoutMs) {
			to = setTimeout(() => {
				killed = true
				p.kill()
				reject(new Error(`timeout ${opts.timeoutMs}ms`))
			}, opts.timeoutMs)
		}
		p.on('error', reject)
		p.on('close', (code) => {
			if (to) clearTimeout(to)
			if (killed) return
			if (code === 0) resolve(out.trim())
			else reject(new Error(err.trim() || `exit ${code}`))
		})
	})
}

