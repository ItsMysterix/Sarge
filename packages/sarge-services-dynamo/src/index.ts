import * as fs from 'fs'
import * as path from 'path'
// Local copy of Resource shape to avoid hard dependency during compilation
export interface Resource { id: string; name: string; type: string; serviceId: string; dependsOn: string[] }

export const SARGE_SERVICES_DYNAMO_VERSION = '0.1.0'

// Minimal Dynamo-like attribute value shape
export type AttributeValue = { S?: string; N?: string; B?: string }
export type Item = Record<string, AttributeValue>

export interface KeySchemaElement {
	AttributeName: string
	KeyType: 'HASH' | 'RANGE'
}

export interface AttributeDefinition {
	AttributeName: string
	AttributeType: 'S' | 'N' | 'B'
}

export interface TableDescription {
	TableName: string
	KeySchema: KeySchemaElement[]
	AttributeDefinitions: AttributeDefinition[]
	ItemCount: number
}

export interface CreateTableInput {
	TableName: string
	KeySchema: KeySchemaElement[]
	AttributeDefinitions: AttributeDefinition[]
}

export interface DescribeTableOutput {
	Table: TableDescription
}

export interface PutItemInput {
	TableName: string
	Item: Item
}

export interface GetItemInput {
	TableName: string
	Key: Item
}

export interface GetItemOutput {
	Item?: Item
}

export interface QueryInput {
	TableName: string
	KeyConditionExpression: string
	ExpressionAttributeValues: Record<string, AttributeValue>
	Limit?: number
	ExclusiveStartKey?: Item
}

export interface ScanInput {
	TableName: string
	Limit?: number
	ExclusiveStartKey?: Item
}

export interface QueryOutput {
	Items: Item[]
	Count: number
	ScannedCount: number
	LastEvaluatedKey?: Item
}

export interface ScanOutput {
	Items: Item[]
	Count: number
	ScannedCount: number
	LastEvaluatedKey?: Item
}

export interface DynamoServiceOptions {
	dataRoot: string
	onResourceChange?: (resource: Resource, action: 'create' | 'delete') => void
}

export class DynamoService {
	private opts?: DynamoServiceOptions
	private root: string

	constructor(opts: DynamoServiceOptions) {
		this.opts = opts
		this.root = path.join(opts.dataRoot, 'dynamo')
		fs.mkdirSync(this.root, { recursive: true })
	}

	async createTable(input: CreateTableInput): Promise<DescribeTableOutput> {
		const dir = this.tableDir(input.TableName)
		fs.mkdirSync(dir, { recursive: true })
		const metaPath = path.join(dir, 'table.json')
			const meta = {
			TableName: input.TableName,
			KeySchema: input.KeySchema,
			AttributeDefinitions: input.AttributeDefinitions,
			ItemCount: 0,
		}
		fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
		fs.mkdirSync(path.join(dir, 'data'), { recursive: true })
			this.opts?.onResourceChange?.({ id: `dynamo:table:${input.TableName}`, name: input.TableName, type: 'dynamo.table', serviceId: 'dynamodb', dependsOn: [] }, 'create')
		return { Table: meta }
	}

		async listTables(): Promise<{ TableNames: string[] }> {
			if (!fs.existsSync(this.root)) return { TableNames: [] }
			const names = fs
				.readdirSync(this.root, { withFileTypes: true })
				.filter((d) => d.isDirectory())
				.map((d) => d.name)
			return { TableNames: names }
		}

	async describeTable(TableName: string): Promise<DescribeTableOutput> {
		const meta = this.readTableMeta(TableName)
		meta.ItemCount = this.countItems(TableName)
		return { Table: meta }
	}

	async putItem({ TableName, Item }: PutItemInput): Promise<{}> {
		const { pkName, skName } = this.keyNames(TableName)
		const pk = this.attrToString(Item[pkName])
		if (!pk) throw this.err('ValidationException', `Missing partition key ${pkName}`)
		const sk = skName ? this.attrToString(Item[skName]) : ''
		const dir = path.join(this.tableDir(TableName), 'data', safe(pk))
		fs.mkdirSync(dir, { recursive: true })
			const file = path.join(dir, (sk ? safe(sk) : '_') + '.json')
		fs.writeFileSync(file, JSON.stringify(Item))
			const deps = [`dynamo:table:${TableName}`]
			this.opts?.onResourceChange?.({ id: `dynamo:item:${TableName}/${pk}${sk ? '/' + sk : ''}`, name: `${pk}${sk ? '/' + sk : ''}`, type: 'dynamo.item', serviceId: 'dynamodb', dependsOn: deps }, 'create')
		return {}
	}

	async getItem({ TableName, Key }: GetItemInput): Promise<GetItemOutput> {
		const { pkName, skName } = this.keyNames(TableName)
		const pk = this.attrToString(Key[pkName])
		if (!pk) throw this.err('ValidationException', `Missing partition key ${pkName}`)
		const sk = skName ? this.attrToString(Key[skName]) : ''
		const file = path.join(this.tableDir(TableName), 'data', safe(pk), (sk ? safe(sk) : '_') + '.json')
		if (!fs.existsSync(file)) return {}
		const raw = fs.readFileSync(file, 'utf-8')
		return { Item: JSON.parse(raw) }
	}

	async query(input: QueryInput): Promise<QueryOutput> {
		const { TableName, KeyConditionExpression, ExpressionAttributeValues, Limit, ExclusiveStartKey } = input
		const { pkName, skName } = this.keyNames(TableName)
		// Support forms: "pk = :v" and optionally "AND begins_with(sk, :p)"
		const mEq = new RegExp(`^\\s*${escapeReg(pkName)}\\s*=\\s*(:[a-zA-Z0-9_]+)\\s*(?:AND\\s*begins_with\\(\\s*${escapeReg(skName || 'sk')}\\s*,\\s*(:[a-zA-Z0-9_]+)\\s*\\)\\s*)?$`, 'i')
		const match = KeyConditionExpression.match(mEq)
		if (!match) throw this.err('ValidationException', 'Unsupported KeyConditionExpression')
		const pkToken = match[1]
		const skToken = match[2]
		const pkVal = this.attrToString(ExpressionAttributeValues[pkToken as keyof typeof ExpressionAttributeValues])
		if (!pkVal) throw this.err('ValidationException', 'Missing ExpressionAttributeValues for pk')
		const skPrefix = skToken ? this.attrToString(ExpressionAttributeValues[skToken as keyof typeof ExpressionAttributeValues]) || '' : ''
		const items = this.listPartition(TableName, pkVal)
		let startIndex = 0
		if (ExclusiveStartKey) {
			const esk = this.attrToString(ExclusiveStartKey[skName || '']) || ''
			startIndex = items.findIndex((it) => this.attrToString(it[skName || '']) === esk) + 1
			if (startIndex < 0) startIndex = 0
		}
		const filtered = items.filter((it) => {
			const skv = skName ? this.attrToString(it[skName]) || '' : ''
			return skToken ? skv.startsWith(skPrefix) : true
		})
		const page = typeof Limit === 'number' ? filtered.slice(startIndex, startIndex + Limit) : filtered.slice(startIndex)
		const last = page.length && (startIndex + page.length) < filtered.length ? page[page.length - 1] : undefined
		const LastEvaluatedKey = last ? { [pkName]: { S: pkVal }, ...(skName ? { [skName]: last[skName] } : {}) } : undefined
		return { Items: page, Count: page.length, ScannedCount: filtered.length, LastEvaluatedKey }
	}

	async scan(input: ScanInput): Promise<ScanOutput> {
		const { TableName, Limit, ExclusiveStartKey } = input
		const { pkName, skName } = this.keyNames(TableName)
		const all = this.listAll(TableName)
		let start = 0
		if (ExclusiveStartKey) {
			const pk = this.attrToString(ExclusiveStartKey[pkName])
			const sk = skName ? this.attrToString(ExclusiveStartKey[skName]) : ''
			start = all.findIndex((it) => this.attrToString(it[pkName]) === pk && (skName ? this.attrToString(it[skName]) === sk : true)) + 1
			if (start < 0) start = 0
		}
		const page = typeof Limit === 'number' ? all.slice(start, start + Limit) : all.slice(start)
		const last = page.length && (start + page.length) < all.length ? page[page.length - 1] : undefined
		const LastEvaluatedKey = last ? { [pkName]: last[pkName], ...(skName ? { [skName]: last[skName] } : {}) } : undefined
		return { Items: page, Count: page.length, ScannedCount: all.length, LastEvaluatedKey }
	}

	// Helpers
	private tableDir(name: string): string {
		return path.join(this.root, safe(name))
	}

	private readTableMeta(TableName: string): TableDescription {
		const metaPath = path.join(this.tableDir(TableName), 'table.json')
		if (!fs.existsSync(metaPath)) throw this.err('ResourceNotFoundException', `Table ${TableName} not found`)
		const raw = fs.readFileSync(metaPath, 'utf-8')
		return JSON.parse(raw)
	}

	private keyNames(TableName: string): { pkName: string; skName?: string } {
		const meta = this.readTableMeta(TableName)
		const pk = meta.KeySchema.find((k) => k.KeyType === 'HASH')
		if (!pk) throw this.err('ValidationException', 'No HASH key in schema')
		const sk = meta.KeySchema.find((k) => k.KeyType === 'RANGE')
		return { pkName: pk.AttributeName, skName: sk?.AttributeName }
	}

	private countItems(TableName: string): number {
		const dir = path.join(this.tableDir(TableName), 'data')
		if (!fs.existsSync(dir)) return 0
		let count = 0
		for (const pk of fs.readdirSync(dir)) {
			const pkDir = path.join(dir, pk)
			for (const f of fs.readdirSync(pkDir)) if (f.endsWith('.json')) count++
		}
		return count
	}

	private listPartition(TableName: string, pk: string): Item[] {
		const dir = path.join(this.tableDir(TableName), 'data', safe(pk))
		if (!fs.existsSync(dir)) return []
		const items: Item[] = []
		for (const f of fs.readdirSync(dir)) {
			if (!f.endsWith('.json')) continue
			const raw = fs.readFileSync(path.join(dir, f), 'utf-8')
			items.push(JSON.parse(raw))
		}
		// Sort by sort key if present
		const { skName } = this.keyNames(TableName)
		if (skName) items.sort((a, b) => (this.attrToString(a[skName]) || '').localeCompare(this.attrToString(b[skName]) || ''))
		return items
	}

	private listAll(TableName: string): Item[] {
		const dir = path.join(this.tableDir(TableName), 'data')
		if (!fs.existsSync(dir)) return []
		const items: Item[] = []
		for (const pk of fs.readdirSync(dir)) {
			const pkDir = path.join(dir, pk)
			for (const f of fs.readdirSync(pkDir)) {
				if (!f.endsWith('.json')) continue
				const raw = fs.readFileSync(path.join(pkDir, f), 'utf-8')
				items.push(JSON.parse(raw))
			}
		}
		// Sort by pk then sk for stable pagination
		const { pkName, skName } = this.keyNames(TableName)
		items.sort((a, b) => {
			const ap = this.attrToString(a[pkName]) || ''
			const bp = this.attrToString(b[pkName]) || ''
			const c = ap.localeCompare(bp)
			if (c !== 0) return c
			if (!skName) return 0
			const as = this.attrToString(a[skName]) || ''
			const bs = this.attrToString(b[skName]) || ''
			return as.localeCompare(bs)
		})
		return items
	}

	private attrToString(av?: AttributeValue): string | undefined {
		if (!av) return undefined
		if (typeof av.S === 'string') return av.S
		if (typeof av.N === 'string') return av.N
		if (typeof av.B === 'string') return av.B
		return undefined
	}

	private err(code: string, message: string): any {
		const e: any = new Error(message)
		e.name = code
		return e
	}
}

function safe(s: string): string {
	return s.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function escapeReg(s?: string): string {
	if (!s) return ''
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
