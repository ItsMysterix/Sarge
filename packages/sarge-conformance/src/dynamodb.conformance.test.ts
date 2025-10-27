import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from 'sarge-aws-shim/dist/server.js'
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  ScanCommand,
  AttributeValue,
} from '@aws-sdk/client-dynamodb'

let port: number
let stop: () => Promise<void>

function endpoint() {
  return `http://127.0.0.1:${port}/dynamodb`
}

function makeClient() {
  return new DynamoDBClient({
    region: 'us-east-1',
    endpoint: endpoint(),
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  })
}

beforeAll(async () => {
  process.env.SARGE_AWS_INSECURE = '1'
  const srv = createServer({ insecure: true })
  port = await srv.listen(0)
  stop = () => new Promise((resolve) => srv.server.close(() => resolve()))
})

afterAll(async () => {
  await stop()
})

describe('Dynamo MVP conformance', () => {
  it('CreateTable, Put/Get, Query begins_with, Scan pagination', async () => {
    const ddb = makeClient()
    const TableName = 'Users'
    const KeySchema = [
      { AttributeName: 'pk', KeyType: 'HASH' },
      { AttributeName: 'sk', KeyType: 'RANGE' },
    ]
    const AttributeDefinitions = [
      { AttributeName: 'pk', AttributeType: 'S' },
      { AttributeName: 'sk', AttributeType: 'S' },
    ]
    await ddb.send(new CreateTableCommand({ TableName, KeySchema, AttributeDefinitions }))
    const desc = await ddb.send(new DescribeTableCommand({ TableName }))
    expect(desc.Table.TableName).toBe(TableName)

    function avS(s: string): AttributeValue { return { S: s } }
    const items = [
      { pk: avS('u#1'), sk: avS('p#2023'), name: avS('Ada') },
      { pk: avS('u#1'), sk: avS('p#2024'), name: avS('Ada') },
      { pk: avS('u#2'), sk: avS('p#2023'), name: avS('Bob') },
    ]
    for (const it of items) {
      await ddb.send(new PutItemCommand({ TableName, Item: it as any }))
    }

    const got = await ddb.send(new GetItemCommand({ TableName, Key: { pk: avS('u#1'), sk: avS('p#2023') } }))
    expect(got.Item?.name?.S).toBe('Ada')

    const q = await ddb.send(new QueryCommand({
      TableName,
      KeyConditionExpression: 'pk = :v AND begins_with(sk, :p)',
      ExpressionAttributeValues: { ':v': avS('u#1'), ':p': avS('p#') },
    }))
    expect(q.Count).toBe(2)

    const s1 = await ddb.send(new ScanCommand({ TableName, Limit: 2 }))
    expect(s1.Items.length).toBe(2)
    if (s1.LastEvaluatedKey) {
      const s2 = await ddb.send(new ScanCommand({ TableName, ExclusiveStartKey: s1.LastEvaluatedKey }))
      expect(s1.Items.length + s2.Items.length).toBeGreaterThanOrEqual(3)
    }
  })
})
