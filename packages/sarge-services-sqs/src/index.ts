import * as fs from 'fs'
import * as path from 'path'

export interface SqsOptions { dataRoot: string }
export interface QueueAttributes { fifo?: boolean }
export interface Message { messageId: string; body: string; timestamp: number; receiptHandle?: string; groupId?: string; dedupId?: string }

export class SqsService {
  private root: string
  private dirQueues: string
  constructor(opts: SqsOptions) {
    this.root = opts.dataRoot
    this.dirQueues = path.join(this.root, 'sqs')
    fs.mkdirSync(this.dirQueues, { recursive: true })
  }
  private qfile(name: string) { return path.join(this.dirQueues, encode(name) + '.json') }
  private load(name: string): { attrs: QueueAttributes; messages: Message[] } {
    const f = this.qfile(name)
    if (!fs.existsSync(f)) return { attrs: {}, messages: [] }
    return JSON.parse(fs.readFileSync(f, 'utf8'))
  }
  private save(name: string, data: { attrs: QueueAttributes; messages: Message[] }) {
    fs.writeFileSync(this.qfile(name), JSON.stringify(data, null, 2))
  }

  async createQueue(name: string, attrs: QueueAttributes = {}) { this.save(name, { attrs, messages: [] }) }
  async sendMessage(name: string, body: string, opts?: { groupId?: string; dedupId?: string }): Promise<{ messageId: string }> {
    const q = this.load(name)
    const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const msg: Message = { messageId: id, body, timestamp: Date.now(), groupId: opts?.groupId, dedupId: opts?.dedupId }
    q.messages.push(msg)
    // Deterministic ordering: sort by timestamp then id
    q.messages.sort((a, b) => (a.timestamp - b.timestamp) || a.messageId.localeCompare(b.messageId))
    this.save(name, q)
    return { messageId: id }
  }
  async receiveMessage(name: string, opts?: { maxNumber?: number; waitTimeSeconds?: number }): Promise<{ messages: Message[] }> {
    const q = this.load(name)
    const n = Math.min(opts?.maxNumber ?? 1, q.messages.length)
    const out = q.messages.slice(0, n).map((m) => ({ ...m, receiptHandle: `r-${m.messageId}` }))
    this.save(name, { ...q, messages: q.messages.slice(n) })
    return { messages: out }
  }
  async deleteMessage(name: string, receiptHandle: string): Promise<void> {
    // No-op deletion since we pop on receive; kept for API symmetry
    void name; void receiptHandle
  }
}

function encode(s: string) { return Buffer.from(s, 'utf-8').toString('base64url') }
