import { describe, expect, test } from 'vitest'
import { SqsService } from 'sarge-services-sqs'
import path from 'node:path'
import fs from 'node:fs'

const dataRoot = path.resolve(process.cwd(), 'data/sarge/workspaces/default')

describe('SQS conformance', () => {
  test('create, send, receive', async () => {
    const svc = new SqsService({ dataRoot })
    await svc.createQueue('q1')
    const s = await svc.sendMessage('q1', 'hello')
    expect(s.messageId).toMatch(/^m-/)
    const r1 = await svc.receiveMessage('q1', { maxNumber: 1 })
    expect(r1.messages.length).toBe(1)
    expect(r1.messages[0].body).toBe('hello')
  })
})
