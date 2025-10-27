export interface EventBridgeOptions {}
export interface Rule { name: string; pattern?: any; targets: Array<{ type: 'sqs'; queueName: string } | { type: 'lambda'; functionName: string }> }

export class EventBridgeService {
  private rules = new Map<string, Rule>()
  private sqs?: { sendMessage: (q: string, body: string) => Promise<void> }
  private lambda?: { invoke: (name: string, opts: { payload: any }) => Promise<void> }
  constructor(_opts: EventBridgeOptions = {}, deps?: { sqs?: any; lambda?: any }) {
    if (deps?.sqs) this.sqs = { sendMessage: async (q, body) => { await deps.sqs.sendMessage(q, body) } }
    if (deps?.lambda) this.lambda = { invoke: async (n, o) => { await deps.lambda.invoke(n, o) } }
  }
  async putRule(name: string, pattern?: any) { this.rules.set(name, { name, pattern, targets: [] }) }
  async putTargets(ruleName: string, targets: Rule['targets']) {
    const r = this.rules.get(ruleName)
    if (!r) throw new Error('rule not found')
    r.targets = targets
  }
  async putEvents(entries: Array<{ detail: any; source?: string; detailType?: string }>) {
    for (const e of entries) {
      const body = JSON.stringify(e)
      for (const r of this.rules.values()) {
        for (const t of r.targets) {
          if (t.type === 'sqs' && this.sqs) await this.sqs.sendMessage(t.queueName, body)
          if (t.type === 'lambda' && this.lambda) await this.lambda.invoke(t.functionName, { payload: e })
        }
      }
    }
  }
}
