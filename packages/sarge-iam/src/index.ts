export const SARGE_IAM_VERSION = '0.1.0'

export type Effect = 'Allow' | 'Deny'

export interface Statement {
	Effect: Effect
	Action: string[]
	Resource: string[]
	Condition?: Record<string, unknown>
}

export interface EvaluationInput {
	principal: string
	action: string
	resource: string
	context?: Record<string, unknown>
	statements: Statement[]
}

export interface EvaluationResult { allowed: boolean; reason?: string }

export function evaluate(input: EvaluationInput): EvaluationResult {
	const { action, resource, statements } = input
	let explicitDeny = false
	let allow = false
	let reason = ''
	for (const s of statements) {
		const actionMatch = s.Action.some((a) => matchArnLike(a, action))
		const resourceMatch = s.Resource.some((r) => matchArnLike(r, resource))
		if (!actionMatch || !resourceMatch) continue
		if (s.Condition && !evalConditions(s.Condition, input.context || {})) {
			continue
		}
		if (s.Effect === 'Deny') {
			explicitDeny = true
			reason = `Denied by statement`
		}
		if (s.Effect === 'Allow') {
			allow = true
		}
	}
	if (explicitDeny) return { allowed: false, reason }
	return { allowed: allow, reason: allow ? undefined : 'No matching allow' }
}

function matchArnLike(pattern: string, value: string): boolean {
	if (pattern === '*' || pattern === value) return true
	// Very small glob support: * matches any sequence
	const re = new RegExp('^' + pattern.split('*').map(escapeReg).join('.*') + '$')
	return re.test(value)
}

function escapeReg(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function evalConditions(cond: Record<string, unknown>, ctx: Record<string, unknown>): boolean {
	// Support a subset: StringEquals, ArnLike, IpAddress
	for (const [op, body] of Object.entries(cond)) {
		if (op === 'StringEquals') {
			if (!objectMatch(body, ctx, (a, b) => asArray(a).some(v => String(v) === String(b)))) return false
		} else if (op === 'ArnLike') {
			if (!objectMatch(body, ctx, (a, b) => asArray(a).some(v => matchArnLike(String(v), String(b))))) return false
		} else if (op === 'IpAddress') {
			if (!objectMatch(body, ctx, (a, b) => asArray(a).some(v => ipInCidr(String(b), String(v))))) return false
		} else {
			// Unknown operator => fail closed
			return false
		}
	}
	return true
}

function objectMatch(spec: unknown, ctx: Record<string, unknown>, cmp: (expected: unknown, actual: unknown) => boolean): boolean {
	if (typeof spec !== 'object' || spec === null) return false
	for (const [k, v] of Object.entries(spec as Record<string, unknown>)) {
		const actual = ctx[k]
		if (!cmp(v, actual)) return false
	}
	return true
}

function asArray<T>(v: unknown): T[] { return Array.isArray(v) ? v as T[] : [v as T] }

function ipInCidr(ip: string, cidr: string): boolean {
	try {
		const net = require('node:net') as typeof import('node:net')
		const [base, maskStr] = cidr.split('/')
		const mask = Number(maskStr)
		if (net.isIP(ip) !== net.isIP(base)) return false
		if (net.isIP(ip) === 4) {
			const ipNum = ipv4ToInt(ip)
			const baseNum = ipv4ToInt(base)
			const maskNum = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0
			return (ipNum & maskNum) === (baseNum & maskNum)
		} else if (net.isIP(ip) === 6) {
			// Minimal IPv6 CIDR: compare prefix bits
			const ipBuf = ipv6ToBuf(ip)
			const baseBuf = ipv6ToBuf(base)
			const fullBytes = Math.floor(mask / 8)
			const remBits = mask % 8
			for (let i = 0; i < fullBytes; i++) if (ipBuf[i] !== baseBuf[i]) return false
			if (remBits > 0) {
				const maskByte = 0xff << (8 - remBits)
				if ((ipBuf[fullBytes] & maskByte) !== (baseBuf[fullBytes] & maskByte)) return false
			}
			return true
		}
	} catch {}
	return false
}

function ipv4ToInt(ip: string): number { return ip.split('.').reduce((a, o) => (a << 8) + Number(o), 0) >>> 0 }
function ipv6ToBuf(ip: string): Uint8Array {
	const { parse } = require('node:net') as any
	// Node doesn't expose IPv6 parse; quick fallback using URL
	const norm = ip.includes('::') ? expandIpv6(ip) : ip
	const parts = norm.split(':').map((h: string) => parseInt(h, 16))
	const buf = new Uint8Array(16)
	for (let i = 0; i < 8; i++) { buf[i * 2] = (parts[i] >> 8) & 0xff; buf[i * 2 + 1] = parts[i] & 0xff }
	return buf
}
function expandIpv6(ip: string): string {
	const parts = ip.split('::')
	const left = parts[0] ? parts[0].split(':') : []
	const right = parts[1] ? parts[1].split(':') : []
	const missing = 8 - (left.length + right.length)
	return [...left, ...Array(missing).fill('0'), ...right].map(x => x || '0').join(':')
}
