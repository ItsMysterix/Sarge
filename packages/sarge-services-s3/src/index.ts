import * as fs from 'fs'
import * as path from 'path'
import { createHash } from 'crypto'
import mime from 'mime-types'
import type { Resource } from 'sarge-core'

export const SARGE_SERVICES_S3_VERSION = '0.1.0'

export type ACL = 'private' | 'public-read'

export interface S3ServiceOptions {
	dataRoot: string // e.g., ./data/sarge/workspaces/default
	onResourceChange?: (resource: Resource, action: 'create' | 'delete') => void
}

export interface BucketInfo {
	name: string
	createdAt: string
}

export interface ObjectMeta {
	key: string
	size: number
	etag: string
	contentType: string
	lastModified: string
	acl: ACL
}

export interface ListObjectsV2Input {
	prefix?: string
	delimiter?: string
}

export interface ListObjectsV2Output {
	contents: ObjectMeta[]
	commonPrefixes: string[]
}

export class S3Service {
	private opts: S3ServiceOptions
	private root: string
	private s3root: string
	constructor(opts: S3ServiceOptions) {
		this.opts = opts
		this.root = opts.dataRoot
		this.s3root = path.join(this.root, 's3')
		fs.mkdirSync(this.s3root, { recursive: true })
	}

	private bucketDir(name: string) {
		return path.join(this.s3root, name)
	}
	private objectPath(bucket: string, key: string) {
		const safeKey = key.split('/').join(path.sep)
		return path.join(this.bucketDir(bucket), safeKey)
	}
	private metaPath(bucket: string, key: string) {
		return this.objectPath(bucket, key) + '.meta.json'
	}

	private writeMeta(bucket: string, key: string, meta: ObjectMeta) {
		const p = this.metaPath(bucket, key)
		fs.mkdirSync(path.dirname(p), { recursive: true })
		fs.writeFileSync(p, JSON.stringify(meta, null, 2))
	}
	private readMeta(bucket: string, key: string): ObjectMeta | null {
		const p = this.metaPath(bucket, key)
		if (!fs.existsSync(p)) return null
		return JSON.parse(fs.readFileSync(p, 'utf-8')) as ObjectMeta
	}

		async createBucket(name: string, acl: ACL = 'private'): Promise<BucketInfo> {
		const dir = this.bucketDir(name)
		if (fs.existsSync(dir)) throw new Error('BucketAlreadyOwnedByYou')
		fs.mkdirSync(dir, { recursive: true })
		const info: BucketInfo = { name, createdAt: new Date().toISOString() }
		fs.writeFileSync(path.join(dir, 'bucket.json'), JSON.stringify({ ...info, acl }, null, 2))
			// emit resource
			this.opts.onResourceChange?.({ id: `s3:bucket:${name}`, name, type: 's3.bucket', serviceId: 's3', dependsOn: [] }, 'create')
			return info
	}

		async deleteBucket(name: string): Promise<void> {
			const dir = this.bucketDir(name)
			if (!fs.existsSync(dir)) throw new Error('NoSuchBucket')
			// ensure no object/meta files remain (ignore empty subdirectories)
			let hasObjects = false
			const visit = (d: string) => {
				for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
					if (entry.name === 'bucket.json') continue
					const full = path.join(d, entry.name)
					if (entry.isDirectory()) visit(full)
					else { hasObjects = true; return }
				}
			}
			visit(dir)
			if (hasObjects) throw new Error('BucketNotEmpty')
			fs.rmSync(dir, { recursive: true, force: true })
			this.opts.onResourceChange?.({ id: `s3:bucket:${name}`, name, type: 's3.bucket', serviceId: 's3', dependsOn: [] }, 'delete')
		}

		async putObject(bucket: string, key: string, body: Buffer | string, contentType?: string, acl: ACL = 'private'): Promise<ObjectMeta> {
		const bdir = this.bucketDir(bucket)
		if (!fs.existsSync(bdir)) throw new Error('NoSuchBucket')
		const data = Buffer.isBuffer(body) ? body : Buffer.from(body)
		const etag = createHash('md5').update(data).digest('hex')
		const objPath = this.objectPath(bucket, key)
		fs.mkdirSync(path.dirname(objPath), { recursive: true })
		fs.writeFileSync(objPath, data)
		const ct = contentType || (mime.lookup(key) || 'application/octet-stream').toString()
		const meta: ObjectMeta = {
			key,
			size: data.length,
			etag,
			contentType: ct,
			lastModified: new Date().toISOString(),
			acl,
		}
			this.writeMeta(bucket, key, meta)
			this.opts.onResourceChange?.({ id: `s3:object:${bucket}/${key}`, name: key, type: 's3.object', serviceId: 's3', dependsOn: [`s3:bucket:${bucket}`] }, 'create')
		return meta
	}

	async getObject(bucket: string, key: string): Promise<{ body: Buffer; meta: ObjectMeta }> {
		const p = this.objectPath(bucket, key)
		if (!fs.existsSync(p)) throw new Error('NoSuchKey')
		const body = fs.readFileSync(p)
		const meta = this.readMeta(bucket, key)
		if (!meta) throw new Error('NoSuchKey')
		return { body, meta }
	}

	async headObject(bucket: string, key: string): Promise<ObjectMeta> {
		const meta = this.readMeta(bucket, key)
		if (!meta) throw new Error('NoSuchKey')
		return meta
	}

		async deleteObject(bucket: string, key: string): Promise<void> {
		const p = this.objectPath(bucket, key)
		if (!fs.existsSync(p)) return
		fs.rmSync(p)
		const mp = this.metaPath(bucket, key)
			if (fs.existsSync(mp)) fs.rmSync(mp)
			this.opts.onResourceChange?.({ id: `s3:object:${bucket}/${key}`, name: key, type: 's3.object', serviceId: 's3', dependsOn: [`s3:bucket:${bucket}`] }, 'delete')
	}

	async listObjectsV2(bucket: string, input: ListObjectsV2Input = {}): Promise<ListObjectsV2Output> {
		const bdir = this.bucketDir(bucket)
		if (!fs.existsSync(bdir)) throw new Error('NoSuchBucket')
		const prefix = input.prefix || ''
		const delimiter = input.delimiter
		const contents: ObjectMeta[] = []
		const commonPrefixesSet = new Set<string>()

		const walk = (dir: string, baseKey: string) => {
			const entries = fs.readdirSync(dir, { withFileTypes: true })
			for (const e of entries) {
				const full = path.join(dir, e.name)
				if (e.isDirectory()) {
					walk(full, baseKey ? baseKey + e.name + '/' : e.name + '/')
				} else if (e.isFile() && e.name.endsWith('.meta.json')) {
					const key = (baseKey + e.name).slice(0, -('.meta.json'.length))
					if (!key.startsWith(prefix)) continue
					if (delimiter) {
						const rest = key.slice(prefix.length)
						const idx = rest.indexOf(delimiter)
						if (idx >= 0) {
							const cp = key.slice(0, prefix.length + idx + 1)
							commonPrefixesSet.add(cp)
							continue
						}
					}
					const meta = JSON.parse(fs.readFileSync(full, 'utf-8')) as ObjectMeta
					contents.push(meta)
				}
			}
		}
		walk(bdir, '')
		// If a prefix is requested and there are matching contents, include the prefix itself as a CommonPrefix
		if (input.prefix && contents.length > 0 && input.delimiter) {
			commonPrefixesSet.add(input.prefix.endsWith(input.delimiter) ? input.prefix : input.prefix + input.delimiter)
		}
		return { contents, commonPrefixes: Array.from(commonPrefixesSet) }
	}
}

