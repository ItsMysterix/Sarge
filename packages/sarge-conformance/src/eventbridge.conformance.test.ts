import { describe, expect, test } from 'vitest'
import { SqsService } from 'sarge-services-sqs'
import { EventBridgeService } from 'sarge-services-eventbridge'

const dataRoot = process.cwd() + '/data/sarge/workspaces/default'

describe('EventBridge conformance', () => {
  test('rule routes to SQS', async () => {
    const sqs = new SqsService({ dataRoot })
    const eb = new EventBridgeService({}, { sqs })
    await sqs.createQueue('q1')
    await eb.putRule('r1')
    await eb.putTargets('r1', [{ type: 'sqs', queueName: 'q1' }])
    await eb.putEvents([{ detail: { a: 1 }, source: 'app', detailType: 't' }])
    const r = await sqs.receiveMessage('q1')
    expect(r.messages.length).toBe(1)
  })
})
