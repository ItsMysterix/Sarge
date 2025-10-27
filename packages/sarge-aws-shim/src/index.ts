export const SARGE_AWS_SHIM_VERSION = '0.0.1'

export interface ShimOptions {
	port?: number
	insecure?: boolean // allow unsigned/no auth in local mode
	strictIam?: boolean // enforce IAM evaluation when true
}

export interface LastRequestRecord {
	service: string
	operation: string
	receivedShape: unknown
	headers: Record<string, string | string[] | undefined>
	path: string
	method: string
}
