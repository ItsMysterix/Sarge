import * as fs from 'fs'
import * as path from 'path'

export const SARGE_CLOUDWATCH_VERSION = '0.1.0'

export interface CloudWatchOptions { dataRoot: string }

export interface LogEvent { timestamp: number; message: string; level?: string; fields?: Record<string, unknown> }

export class CloudWatchLogsService {
	private root: string
	private logsRoot: string
	constructor(opts: CloudWatchOptions) {
		this.root = opts.dataRoot
		this.logsRoot = path.join(this.root, 'logs')
		fs.mkdirSync(this.logsRoot, { recursive: true })
	}

	private groupDir(groupName: string) {
		return path.join(this.logsRoot, encode(groupName))
	}
	private streamFile(groupName: string, streamName: string) {
		return path.join(this.groupDir(groupName), encode(streamName) + '.log')
	}

	async createLogGroup(groupName: string) {
		fs.mkdirSync(this.groupDir(groupName), { recursive: true })
	}

	async createLogStream(groupName: string, streamName: string) {
		const f = this.streamFile(groupName, streamName)
		fs.mkdirSync(path.dirname(f), { recursive: true })
		if (!fs.existsSync(f)) fs.writeFileSync(f, '')
	}

	async describeLogGroups(): Promise<{ logGroupNames: string[] }> {
		const entries = fs.readdirSync(this.logsRoot, { withFileTypes: true })
		const logGroupNames = entries.filter((e) => e.isDirectory()).map((e) => decode(e.name))
		return { logGroupNames }
	}

	async putLogEvents(groupName: string, streamName: string, events: LogEvent[]): Promise<void> {
		await this.createLogGroup(groupName)
		await this.createLogStream(groupName, streamName)
		const f = this.streamFile(groupName, streamName)
		const lines = events
			.map((e) => JSON.stringify({ timestamp: e.timestamp ?? Date.now(), message: e.message, level: e.level, fields: e.fields }))
			.join('\n')
		fs.appendFileSync(f, (fs.readFileSync(f).length ? '\n' : '') + lines)
	}

	async getLogEvents(groupName: string, streamName: string, startTime?: number, endTime?: number): Promise<{ events: LogEvent[] }> {
		const f = this.streamFile(groupName, streamName)
		if (!fs.existsSync(f)) return { events: [] }
		const text = fs.readFileSync(f, 'utf-8')
		const events = text
			.split('\n')
			.filter(Boolean)
			.map((l) => JSON.parse(l) as LogEvent)
			.filter((e) => (startTime ? e.timestamp >= startTime : true) && (endTime ? e.timestamp <= endTime : true))
		return { events }
	}
}

function encode(s: string) {
	return Buffer.from(s, 'utf-8').toString('base64url')
}
function decode(s: string) {
	return Buffer.from(s, 'base64url').toString('utf-8')
}

