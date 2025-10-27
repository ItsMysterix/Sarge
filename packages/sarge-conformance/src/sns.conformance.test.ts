import { describe, expect, test } from 'vitest'
import { SqsService } from 'sarge-services-sqs'
import { SnsService } from 'sarge-services-sns'
import path from 'node:path'

const dataRoot = path.resolve(process.cwd(), 'data/sarge/workspaces/default')

describe('SNS conformance', () => {
  test('publish to SQS subscription', async () => {
    const sqs = new SqsService({ dataRoot })
    const sns = new SnsService({}, { sqs })
    await sqs.createQueue('q1')
    await sns.createTopic('t1')
    await sns.subscribe('t1', { type: 'sqs', queueName: 'q1' })
    await sns.publish('t1', JSON.stringify({ hello: 'world' }))
    const r = await sqs.receiveMessage('q1')
    expect(r.messages.length).toBe(1)
    expect(r.messages[0].body).toContain('hello')
  })
})
