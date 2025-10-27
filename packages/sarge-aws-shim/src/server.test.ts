import { describe, it, expect } from 'vitest'
import { createServer } from './server.js'
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb'
import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda'
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs'
import { SQSClient, CreateQueueCommand, SendMessageCommand, ReceiveMessageCommand, GetQueueUrlCommand } from '@aws-sdk/client-sqs'
import { SNSClient, CreateTopicCommand, SubscribeCommand, PublishCommand } from '@aws-sdk/client-sns'
import { EventBridgeClient, PutRuleCommand, PutTargetsCommand, PutEventsCommand } from '@aws-sdk/client-eventbridge'

function localCreds() {
  process.env.AWS_ACCESS_KEY_ID = 'local'
  process.env.AWS_SECRET_ACCESS_KEY = 'local'
}

function makeEndpoint(port: number, base: string) {
  return `http://127.0.0.1:${port}/${base}`
}

async function getLast(port: number) {
  const res = await fetch(`http://127.0.0.1:${port}/__sarge/last`)
  return res.json() as Promise<{ last: any }>
}

describe('sarge-aws-shim stubs', () => {
  it('routes DynamoDB ListTables and records request', async () => {
    localCreds()
    const { listen } = createServer({ insecure: true })
    const port = await listen(0)
    const client = new DynamoDBClient({
      region: 'us-east-1',
      endpoint: makeEndpoint(port, 'dynamodb'),
      credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
    })
    const out = await client.send(new ListTablesCommand({}))
    expect(out.TableNames).toEqual([])
    const { last } = await getLast(port)
    expect(last.service).toBe('dynamodb')
    expect(last.operation).toBe('ListTables')
  })

  it('routes Lambda ListFunctions and records request', async () => {
    localCreds()
    const { listen } = createServer({ insecure: true })
    const port = await listen(0)
    const client = new LambdaClient({
      region: 'us-east-1',
      endpoint: makeEndpoint(port, ''), // lambda uses absolute paths
      credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
    })
    const out = await client.send(new ListFunctionsCommand({}))
    expect(out.Functions).toEqual([])
    const { last } = await getLast(port)
    expect(last.service).toBe('lambda')
    expect(last.operation).toBe('ListFunctions')
  })

  it('routes CloudWatch Logs DescribeLogGroups and records request', async () => {
    localCreds()
    const { listen } = createServer({ insecure: true })
    const port = await listen(0)
    const client = new CloudWatchLogsClient({
      region: 'us-east-1',
      endpoint: makeEndpoint(port, 'cloudwatch-logs'),
      credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
    })
    const out = await client.send(new DescribeLogGroupsCommand({}))
    expect(out.logGroups).toEqual([])
    const { last } = await getLast(port)
    expect(last.service).toBe('cloudwatch-logs')
    expect(last.operation).toBe('DescribeLogGroups')
  })

  it('routes SQS Create/Send/Receive', async () => {
    localCreds()
    const { listen } = createServer({ insecure: true })
    const port = await listen(0)
    const endpoint = makeEndpoint(port, 'sqs')
    const client = new SQSClient({ region: 'us-east-1', endpoint, credentials: { accessKeyId: 'local', secretAccessKey: 'local' } })
  const q = await client.send(new CreateQueueCommand({ QueueName: 'q1' }))
  const lastAfterCreate = await getLast(port)
  expect(lastAfterCreate.last.service).toBe('sqs')
    const qurl = q.QueueUrl!
    await client.send(new SendMessageCommand({ QueueUrl: qurl, MessageBody: 'hello' }))
    const out = await client.send(new ReceiveMessageCommand({ QueueUrl: qurl, MaxNumberOfMessages: 1 }))
    expect(out.Messages?.[0]?.Body).toBe('hello')
  })

  it('routes SNS CreateTopic/Subscribe/Publish to SQS', async () => {
    localCreds()
    const { listen } = createServer({ insecure: true })
    const port = await listen(0)
    const sqsEndpoint = makeEndpoint(port, 'sqs')
    const snsEndpoint = makeEndpoint(port, 'sns')
    const sqs = new SQSClient({ region: 'us-east-1', endpoint: sqsEndpoint, credentials: { accessKeyId: 'local', secretAccessKey: 'local' } })
    const sns = new SNSClient({ region: 'us-east-1', endpoint: snsEndpoint, credentials: { accessKeyId: 'local', secretAccessKey: 'local' } })
  const q = await sqs.send(new CreateQueueCommand({ QueueName: 'q2' }))
  const lastAfterCreate = await getLast(port)
  expect(lastAfterCreate.last.service).toBe('sqs')
    const qurl = q.QueueUrl!
    const qname = 'q2'
    const t = await sns.send(new CreateTopicCommand({ Name: 't1' }))
    const topicArn = t.TopicArn!
    // Subscribe SQS queue via ARN
    const queueArn = `arn:aws:sqs:local:000000000000:${qname}`
    await sns.send(new SubscribeCommand({ TopicArn: topicArn, Protocol: 'sqs', Endpoint: queueArn }))
    await sns.send(new PublishCommand({ TopicArn: topicArn, Message: 'hi' }))
    const out = await sqs.send(new ReceiveMessageCommand({ QueueUrl: qurl, MaxNumberOfMessages: 1 }))
    expect(out.Messages?.[0]?.Body).toBe('hi')
  })

  it('routes EventBridge PutRule/PutTargets/PutEvents to SQS', async () => {
    localCreds()
    const { listen } = createServer({ insecure: true })
    const port = await listen(0)
    const sqsEndpoint = makeEndpoint(port, 'sqs')
    const evEndpoint = makeEndpoint(port, 'events')
    const sqs = new SQSClient({ region: 'us-east-1', endpoint: sqsEndpoint, credentials: { accessKeyId: 'local', secretAccessKey: 'local' } })
    const ev = new EventBridgeClient({ region: 'us-east-1', endpoint: evEndpoint, credentials: { accessKeyId: 'local', secretAccessKey: 'local' } })
  const q = await sqs.send(new CreateQueueCommand({ QueueName: 'q3' }))
  const lastAfterCreate = await getLast(port)
  expect(lastAfterCreate.last.service).toBe('sqs')
    const qurl = q.QueueUrl!
    const qname = 'q3'
    await ev.send(new PutRuleCommand({ Name: 'r1', EventPattern: JSON.stringify({}) }))
    const queueArn = `arn:aws:sqs:local:000000000000:${qname}`
    await ev.send(new PutTargetsCommand({ Rule: 'r1', Targets: [{ Id: 't1', Arn: queueArn }] }))
    await ev.send(new PutEventsCommand({ Entries: [{ Source: 'local', DetailType: 'test', Detail: JSON.stringify({ foo: 'bar' }) }] }))
    const out = await sqs.send(new ReceiveMessageCommand({ QueueUrl: qurl, MaxNumberOfMessages: 1 }))
    expect(out.Messages?.[0]?.Body).toContain('"foo":"bar"')
  })
})
