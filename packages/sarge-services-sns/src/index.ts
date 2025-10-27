export interface SnsOptions {}
export interface Topic { name: string }
export type Target = { type: 'sqs'; queueName: string } | { type: 'lambda'; functionName: string }

export class SnsService {
  private topics = new Map<string, Topic>()
  private subs = new Map<string, Target[]>()
  private sqs?: { sendMessage: (q: string, body: string) => Promise<void> }
  private lambda?: { invoke: (name: string, opts: { payload: any }) => Promise<void> }
  constructor(_opts: SnsOptions = {}, deps?: { sqs?: any; lambda?: any }) {
    if (deps?.sqs) this.sqs = { sendMessage: async (q, body) => { await deps.sqs.sendMessage(q, body) } }
    if (deps?.lambda) this.lambda = { invoke: async (n, o) => { await deps.lambda.invoke(n, o) } }
  }
  async createTopic(name: string) { this.topics.set(name, { name }) }
  async subscribe(topic: string, target: Target) {
    const arr = this.subs.get(topic) || []
    arr.push(target)
    this.subs.set(topic, arr)
  }
  async publish(topic: string, message: string) {
    const targets = this.subs.get(topic) || []
    // Local delivery (best-effort sync for MVP)
    for (const t of targets) {
      if (t.type === 'sqs' && this.sqs) await this.sqs.sendMessage(t.queueName, message)
      if (t.type === 'lambda' && this.lambda) await this.lambda.invoke(t.functionName, { payload: JSON.parse(message) })
    }
  }
}
