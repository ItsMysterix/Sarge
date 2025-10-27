import * as http from 'http'
import * as path from 'path'
import type { ListObjectsV2Output, ObjectMeta } from 'sarge-services-s3'
import { S3Service } from 'sarge-services-s3'
import * as fs from 'fs'
import * as crypto from 'crypto'
import { CloudWatchLogsService } from 'sarge-cloudwatch'
import { DynamoService } from 'sarge-services-dynamo'
import { evaluate as evaluateIam, Effect, Statement } from 'sarge-iam'
import { URL } from 'url'
import type { ShimOptions, LastRequestRecord } from './index.js'
import { SqsService } from 'sarge-services-sqs'
import { SnsService } from 'sarge-services-sns'
import { EventBridgeService } from 'sarge-services-eventbridge'
import { LambdaService } from 'sarge-services-lambda'

export function createServer(opts: ShimOptions = {}) {
  let last: LastRequestRecord | null = null
  const insecure = opts.insecure ?? process.env.SARGE_AWS_INSECURE === '1'
  const dataRoot = process.env.SARGE_DATA_DIR ? path.resolve(process.cwd(), process.env.SARGE_DATA_DIR) : path.resolve(process.cwd(), 'data/sarge/workspaces/default')
  const s3 = new S3Service({ dataRoot })
  const cw = new CloudWatchLogsService({ dataRoot })
  const dynamo = new DynamoService({ dataRoot })
  const sqs = new SqsService({ dataRoot })
  const lambda = new LambdaService({ dataRoot })
  const sns = new SnsService({}, { sqs, lambda })
  const events = new EventBridgeService({}, { sqs, lambda })

  const server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
    try {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    await new Promise<void>((resolve) => req.on('end', () => resolve()))
    const rawBuffer = Buffer.concat(chunks)
    const rawBody = rawBuffer.toString('utf-8')
    ;(req as any).__rawBuffer = rawBuffer

      // debug snapshot
      try {
        fs.mkdirSync(dataRoot, { recursive: true })
        fs.writeFileSync(path.join(dataRoot, 'last-request.json'), JSON.stringify({
          method: req.method,
          url: url.pathname + (url.search || ''),
          headers: req.headers,
          body: rawBody,
        }, null, 2))
      } catch {}

      // Health/debug endpoint
      if (url.pathname === '/__sarge/last') {
        json(res, 200, { last })
        return
      }

      const service = detectService(url, req, rawBody)
      const operation = detectOperation(service, req, url)
      const receivedShape = parseShape(service, req, rawBody, url)

      last = {
        service,
        operation,
        receivedShape,
        headers: req.headers as Record<string, string | string[] | undefined>,
        path: url.pathname + (url.search || ''),
        method: req.method || 'GET',
      }

      // Auth: allow local creds or insecure
      const authorization = req.headers['authorization']
      const amzDate = req.headers['x-amz-date']
      const haveLocalCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      if (!insecure) {
        if (!authorization || !amzDate || !haveLocalCreds) {
          json(res, 401, { error: 'unauthorized', insecureAllowed: false })
          return
        }
      }

      // Stubbed responses per service/operation to satisfy SDK parsers where feasible
      if (service === 'dynamodb') {
        // IAM enforcement in strict mode
        if (!insecure && (process.env.SARGE_STRICT_IAM === '1' || opts.strictIam)) {
          const ok = evaluateIam({
            principal: 'local',
            action: `dynamodb:${operation}`,
            resource: `arn:aws:dynamodb:local:000000000000:table/${(receivedShape as any)?.TableName || '*'}`,
            statements: loadLocalPolicy(),
          })
          if (!ok.allowed) {
            json(res, 403, { __type: 'AccessDeniedException', message: ok.reason || 'Access denied' })
            return
          }
        }
        // JSON protocol via X-Amz-Target
        if (operation === 'ListTables') {
          const out = await dynamo.listTables()
          json(res, 200, out, { 'x-amzn-requestid': 'sarge' })
          return
        }
        if (operation === 'CreateTable') {
          const { TableName, KeySchema, AttributeDefinitions } = receivedShape as any
          const out = await dynamo.createTable({ TableName, KeySchema, AttributeDefinitions })
          json(res, 200, { TableDescription: out.Table }, { 'x-amzn-requestid': 'sarge' })
          return
        }
        if (operation === 'DescribeTable') {
          const { TableName } = receivedShape as any
          const out = await dynamo.describeTable(TableName)
          json(res, 200, { Table: out.Table }, { 'x-amzn-requestid': 'sarge' })
          return
        }
        if (operation === 'PutItem') {
          const { TableName, Item } = receivedShape as any
          await dynamo.putItem({ TableName, Item })
          json(res, 200, {}, { 'x-amzn-requestid': 'sarge' })
          return
        }
        if (operation === 'GetItem') {
          const { TableName, Key } = receivedShape as any
          const out = await dynamo.getItem({ TableName, Key })
          json(res, 200, out, { 'x-amzn-requestid': 'sarge' })
          return
        }
        if (operation === 'Query') {
          const out = await dynamo.query(receivedShape as any)
          json(res, 200, out, { 'x-amzn-requestid': 'sarge' })
          return
        }
        if (operation === 'Scan') {
          const out = await dynamo.scan(receivedShape as any)
          json(res, 200, out, { 'x-amzn-requestid': 'sarge' })
          return
        }
        json(res, 400, { error: 'unsupported_operation', operation })
        return
      }

      if (service === 'lambda') {
        // REST-JSON
        // Support ListFunctions and Invoke
        if (operation === 'ListFunctions') {
          json(res, 200, { Functions: [] })
          return
        }
        // Invoke: /2015-03-31/functions/{name}/invocations
        const match = url.pathname.match(/^\/2015-03-31\/functions\/([^/]+)\/invocations$/)
        if (req.method === 'POST' && match) {
          const functionName = decodeURIComponent(match[1])
          let event: any = {}
          try { event = rawBody ? JSON.parse(rawBody) : {} } catch {}
          const out = await lambda.invoke(functionName, { payload: event })
          if (out.ok) {
            // Return raw payload body as JSON per AWS Lambda Invoke semantics
            res.statusCode = 200
            res.setHeader('content-type', 'application/json')
            res.setHeader('x-amz-executed-version', '$LATEST')
            res.end(JSON.stringify(out.payload))
          } else {
            res.statusCode = 200
            res.setHeader('x-amz-function-error', 'Unhandled')
            res.end(JSON.stringify({ errorMessage: out.error.message, errorType: out.error.type }))
          }
          return
        }
        json(res, 400, { error: 'unsupported_operation', operation })
        return
      }

      if (service === 'cloudwatch-logs') {
        // JSON protocol via X-Amz-Target
        if (operation === 'DescribeLogGroups') {
          const { logGroupNames } = await cw.describeLogGroups()
          json(res, 200, { logGroups: logGroupNames.map((n: string) => ({ logGroupName: n })) })
          return
        }
        if (operation === 'PutLogEvents') {
          const group = (receivedShape as any).logGroupName
          const stream = (receivedShape as any).logStreamName
          const events = (receivedShape as any).logEvents as Array<{ timestamp: number; message: string }>
          await cw.putLogEvents(group, stream, events)
          json(res, 200, { nextSequenceToken: 'sarge' })
          return
        }
        if (operation === 'GetLogEvents') {
          const group = (receivedShape as any).logGroupName
          const stream = (receivedShape as any).logStreamName
          const start = (receivedShape as any).startTime as number | undefined
          const end = (receivedShape as any).endTime as number | undefined
          const out = await cw.getLogEvents(group, stream, start, end)
          json(res, 200, { events: out.events.map((e: { timestamp: number; message: string }) => ({ timestamp: e.timestamp, message: e.message })) })
          return
        }
        json(res, 400, { error: 'unsupported_operation', operation })
        return
      }

      if (service === 's3') {
            // IAM enforcement helper
            const check = (action: string, resource: string): boolean => {
              if (!(process.env.SARGE_STRICT_IAM === '1' || opts.strictIam)) return true
              const ok = evaluateIam({ principal: 'local', action, resource, statements: loadLocalPolicy() })
              if (!ok.allowed) {
                json(res, 403, { __type: 'AccessDeniedException', message: ok.reason || 'Access denied' })
                return false
              }
              return true
            }
        // S3 path-style routing
  const seg = url.pathname.split('/').filter(Boolean)
  const offset = seg[0] === 's3' ? 1 : 0
  const bucket = seg[offset]
  const key = seg.slice(offset + 1).join('/')
        const aclHeader = (req.headers['x-amz-acl'] as string | undefined) || 'private'
        const acl = (aclHeader === 'public-read' ? 'public-read' : 'private') as 'private' | 'public-read'
        if (req.method === 'GET' && url.pathname === '/') {
          // Minimal ListBuckets XML
          const xml =
            '<?xml version="1.0" encoding="UTF-8"?>' +
            '<ListAllMyBucketsResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">' +
            '<Owner><ID>local</ID><DisplayName>local</DisplayName></Owner>' +
            '<Buckets></Buckets>' +
            '</ListAllMyBucketsResult>'
          res.statusCode = 200
          res.setHeader('content-type', 'application/xml')
          res.end(xml)
          return
        }
        if (bucket && !key && req.method === 'PUT') {
          if (!check('s3:CreateBucket', `arn:aws:s3:::${bucket}`)) return
          await s3.createBucket(bucket, acl)
          res.statusCode = 200
          res.end('')
          return
        }
        if (bucket && !key && req.method === 'DELETE') {
          if (!check('s3:DeleteBucket', `arn:aws:s3:::${bucket}`)) return
          await s3.deleteBucket(bucket)
          res.statusCode = 204
          res.end('')
          return
        }
        if (bucket && key) {
          if (req.method === 'PUT') {
            if (!check('s3:PutObject', `arn:aws:s3:::${bucket}/${key}`)) return
            const contentType = (req.headers['content-type'] as string | undefined) || undefined
            const data: Buffer = ((req as any).__rawBuffer as Buffer) || Buffer.from('')
            const meta = await s3.putObject(bucket, key, data, contentType, acl)
            res.statusCode = 200
            res.setHeader('etag', `"${meta.etag}"`)
            res.end('')
            return
          }
          if (req.method === 'GET') {
            const listType = url.searchParams.get('list-type')
            if (!listType) {
              if (!check('s3:GetObject', `arn:aws:s3:::${bucket}/${key}`)) return
              const { body, meta } = await s3.getObject(bucket, key)
              res.statusCode = 200
              res.setHeader('content-type', meta.contentType)
              res.setHeader('etag', `"${meta.etag}"`)
              res.end(body)
              return
            }
          }
          if (req.method === 'HEAD') {
            if (!check('s3:GetObject', `arn:aws:s3:::${bucket}/${key}`)) return
            const meta = await s3.headObject(bucket, key)
            res.statusCode = 200
            res.setHeader('content-type', meta.contentType)
            res.setHeader('etag', `"${meta.etag}"`)
            res.end('')
            return
          }
          if (req.method === 'DELETE') {
            if (!check('s3:DeleteObject', `arn:aws:s3:::${bucket}/${key}`)) return
            await s3.deleteObject(bucket, key)
            res.statusCode = 204
            res.end('')
            return
          }
        }
        // ListObjectsV2 on bucket root with query
        if (bucket && !key && req.method === 'GET' && url.searchParams.get('list-type') === '2') {
          if (!check('s3:ListBucket', `arn:aws:s3:::${bucket}`)) return
          const prefix = url.searchParams.get('prefix') || undefined
          const delimiter = url.searchParams.get('delimiter') || undefined
          const out = await s3.listObjectsV2(bucket, { prefix, delimiter })
          // Return minimal XML with Contents and CommonPrefixes
          const contentsXml = (out.contents as ListObjectsV2Output['contents'])
            .map((o: ObjectMeta) => `<Contents><Key>${xmlEscape(o.key)}</Key><ETag>"${o.etag}"</ETag><Size>${o.size}</Size><LastModified>${o.lastModified}</LastModified><StorageClass>STANDARD</StorageClass></Contents>`)
            .join('')
          const prefixesXml = out.commonPrefixes.map((p: string) => `<CommonPrefixes><Prefix>${xmlEscape(p)}</Prefix></CommonPrefixes>`).join('')
          const xmlBody =
            '<?xml version="1.0" encoding="UTF-8"?>' +
            `<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>${bucket}</Name>` +
            `<Prefix>${prefix || ''}</Prefix>` +
            `<Delimiter>${delimiter || ''}</Delimiter>` +
            `${contentsXml}${prefixesXml}</ListBucketResult>`
          res.statusCode = 200
          res.setHeader('content-type', 'application/xml')
          res.end(xmlBody)
          return
        }
        json(res, 404, { error: 's3_unknown', path: url.pathname, method: req.method })
        return
      }

      if (service === 'sqs') {
        // SQS supports both AWS Query (XML) and JSON 1.0 protocols (via X-Amz-Target)
        const form = typeof receivedShape === 'object' ? (receivedShape as any) : {}
        const ct = ((req.headers['content-type'] as string | undefined) || '').toLowerCase()
        const target = (req.headers['x-amz-target'] as string | undefined) || ''
        const jsonMode = ct.includes('application/x-amz-json-1.0') || target.startsWith('AmazonSQS')
        const act = (operation as string) || (form.Action as string)
        const queueFromUrl = (u?: string): string | undefined => {
          if (!u) return undefined
          try {
            const p = new URL(u)
            const seg = p.pathname.split('/').filter(Boolean)
            return seg.pop()
          } catch { return u.split('/').filter(Boolean).pop() }
        }
        const queueName = () => (form.QueueName as string) || queueFromUrl(form.QueueUrl)
        if (act === 'CreateQueue') {
          const name = form.QueueName as string
          await sqs.createQueue(name, { fifo: name.endsWith('.fifo') })
          const qurl = buildQueueUrl(name)
          if (jsonMode) {
            json(res, 200, { QueueUrl: qurl }, { 'content-type': 'application/x-amz-json-1.0' })
          } else {
            const xml = `<?xml version="1.0"?><CreateQueueResponse><CreateQueueResult><QueueUrl>${xmlEscape(qurl)}</QueueUrl></CreateQueueResult><ResponseMetadata><RequestId>sarge</RequestId></ResponseMetadata></CreateQueueResponse>`
            xmlOut(res, 200, xml)
          }
          return
        }
        if (act === 'GetQueueUrl') {
          const name = form.QueueName as string
          const qurl = buildQueueUrl(name)
          if (jsonMode) {
            json(res, 200, { QueueUrl: qurl }, { 'content-type': 'application/x-amz-json-1.0' })
          } else {
            const xml = `<?xml version="1.0"?><GetQueueUrlResponse><GetQueueUrlResult><QueueUrl>${xmlEscape(qurl)}</QueueUrl></GetQueueUrlResult><ResponseMetadata><RequestId>sarge</RequestId></ResponseMetadata></GetQueueUrlResponse>`
            xmlOut(res, 200, xml)
          }
          return
        }
        if (act === 'SendMessage') {
          const name = queueName() as string
          const body = form.MessageBody as string
          const groupId = form.MessageGroupId as string | undefined
          const dedupId = form.MessageDeduplicationId as string | undefined
          const out = await sqs.sendMessage(name, body, { groupId, dedupId })
          const md5 = crypto.createHash('md5').update(body || '', 'utf8').digest('hex')
          if (jsonMode) {
            json(res, 200, { MD5OfMessageBody: md5, MessageId: out.messageId }, { 'content-type': 'application/x-amz-json-1.0' })
          } else {
            const xml = `<?xml version="1.0"?><SendMessageResponse><SendMessageResult><MD5OfMessageBody>${md5}</MD5OfMessageBody><MessageId>${out.messageId}</MessageId></SendMessageResult><ResponseMetadata><RequestId>sarge</RequestId></ResponseMetadata></SendMessageResponse>`
            xmlOut(res, 200, xml)
          }
          return
        }
        if (act === 'ReceiveMessage') {
          const name = queueName() as string
          const max = form.MaxNumberOfMessages ? parseInt(form.MaxNumberOfMessages) : 1
          const out = await sqs.receiveMessage(name, { maxNumber: max })
          if (jsonMode) {
            const Messages = out.messages.map((m) => ({
              MessageId: m.messageId,
              ReceiptHandle: m.receiptHandle,
              MD5OfBody: crypto.createHash('md5').update(m.body || '', 'utf8').digest('hex'),
              Body: m.body,
            }))
            json(res, 200, { Messages }, { 'content-type': 'application/x-amz-json-1.0' })
          } else {
            const msgsXml = out.messages
              .map((m) => `<Message><MessageId>${m.messageId}</MessageId><ReceiptHandle>${m.receiptHandle}</ReceiptHandle><MD5OfBody>${crypto.createHash('md5').update(m.body || '', 'utf8').digest('hex')}</MD5OfBody><Body>${xmlEscape(m.body)}</Body></Message>`)
              .join('')
            const xml = `<?xml version="1.0"?><ReceiveMessageResponse><ReceiveMessageResult>${msgsXml}</ReceiveMessageResult><ResponseMetadata><RequestId>sarge</RequestId></ResponseMetadata></ReceiveMessageResponse>`
            xmlOut(res, 200, xml)
          }
          return
        }
        if (act === 'DeleteMessage') {
          const name = queueName() as string
          const rh = form.ReceiptHandle as string
          await sqs.deleteMessage(name, rh)
          if (jsonMode) {
            json(res, 200, {}, { 'content-type': 'application/x-amz-json-1.0' })
          } else {
            const xml = `<?xml version="1.0"?><DeleteMessageResponse><ResponseMetadata><RequestId>sarge</RequestId></ResponseMetadata></DeleteMessageResponse>`
            xmlOut(res, 200, xml)
          }
          return
        }
        if (jsonMode) {
          json(res, 400, { __type: 'InvalidAction', message: String(act || 'Unknown') }, { 'content-type': 'application/x-amz-json-1.0' })
        } else {
          xmlOut(res, 400, `<?xml version="1.0"?><ErrorResponse><Error><Type>Sender</Type><Code>InvalidAction</Code><Message>${xmlEscape(act || 'Unknown')}</Message></Error><RequestId>sarge</RequestId></ErrorResponse>`)
        }
        return
      }

      if (service === 'sns') {
        // AWS Query protocol (form-url-encoded)
        const form = typeof receivedShape === 'object' ? (receivedShape as any) : {}
        const act = (form.Action as string) || operation
        const topicFromArn = (arn: string) => arn.split(':').pop() as string
        const queueFromArn = (arn: string) => arn.split(':').pop() as string
        const lambdaFromArn = (arn: string) => arn.split(':').pop()?.split('/').pop() as string
        if (act === 'CreateTopic') {
          const name = form.Name as string
          await sns.createTopic(name)
          const arn = `arn:aws:sns:local:000000000000:${name}`
          const xml = `<?xml version="1.0"?><CreateTopicResponse><CreateTopicResult><TopicArn>${arn}</TopicArn></CreateTopicResult><ResponseMetadata><RequestId>sarge</RequestId></ResponseMetadata></CreateTopicResponse>`
          xmlOut(res, 200, xml)
          return
        }
        if (act === 'Subscribe') {
          const topicArn = form.TopicArn as string
          const protocol = (form.Protocol as string)?.toLowerCase()
          const endpoint = form.Endpoint as string
          const topic = topicFromArn(topicArn)
          if (protocol === 'sqs') await sns.subscribe(topic, { type: 'sqs', queueName: queueFromArn(endpoint) })
          else if (protocol === 'lambda') await sns.subscribe(topic, { type: 'lambda', functionName: lambdaFromArn(endpoint) })
          const subArn = `arn:aws:sns:local:000000000000:${topic}:sub-${Date.now()}`
          const xml = `<?xml version="1.0"?><SubscribeResponse><SubscribeResult><SubscriptionArn>${subArn}</SubscriptionArn></SubscribeResult><ResponseMetadata><RequestId>sarge</RequestId></ResponseMetadata></SubscribeResponse>`
          xmlOut(res, 200, xml)
          return
        }
        if (act === 'Publish') {
          const topicArn = form.TopicArn as string
          const message = form.Message as string
          await sns.publish(topicFromArn(topicArn), message)
          const mid = `m-${Date.now()}`
          const xml = `<?xml version="1.0"?><PublishResponse><PublishResult><MessageId>${mid}</MessageId></PublishResult><ResponseMetadata><RequestId>sarge</RequestId></ResponseMetadata></PublishResponse>`
          xmlOut(res, 200, xml)
          return
        }
        xmlOut(res, 400, `<?xml version=\"1.0\"?><ErrorResponse><Error><Type>Sender</Type><Code>InvalidAction</Code><Message>${xmlEscape(act || 'Unknown')}</Message></Error><RequestId>sarge</RequestId></ErrorResponse>`)
        return
      }

      if (service === 'events') {
        // EventBridge uses JSON protocol via X-Amz-Target
        if (operation === 'PutRule') {
          const Name = (receivedShape as any).Name as string
          const Pattern = (receivedShape as any).EventPattern
          let parsed: any = undefined
          try { parsed = Pattern ? JSON.parse(Pattern) : undefined } catch {}
          await events.putRule(Name, parsed)
          json(res, 200, { RuleArn: `arn:aws:events:local:000000000000:rule/${Name}` })
          return
        }
        if (operation === 'PutTargets') {
          const Rule = (receivedShape as any).Rule as string
          const Targets = ((receivedShape as any).Targets as any[]) || []
          const mapped = Targets.map((t: any) => {
            const arn = String(t.Arn || '')
            if (arn.includes(':sqs:')) return { type: 'sqs', queueName: arn.split(':').pop() as string } as const
            if (arn.includes(':lambda:')) return { type: 'lambda', functionName: arn.split(':').pop()?.split('/').pop() as string } as const
            return null
          }).filter(Boolean) as Array<{ type: 'sqs'; queueName: string } | { type: 'lambda'; functionName: string }>
          await events.putTargets(Rule, mapped)
          json(res, 200, { FailedEntryCount: 0, FailedEntries: [] })
          return
        }
        if (operation === 'PutEvents') {
          const Entries = ((receivedShape as any).Entries as any[]) || []
          const mapped = Entries.map((e: any) => ({
            detail: typeof e.Detail === 'string' ? safeJsonParse(e.Detail) : e.Detail,
            source: e.Source,
            detailType: e.DetailType,
          }))
          await events.putEvents(mapped)
          json(res, 200, { Entries: mapped.map((_e, i) => ({ EventId: `e-${i}` })) })
          return
        }
        json(res, 400, { error: 'unsupported_operation', operation })
        return
      }

      if (service === 'iam') {
        // Query protocol often expects XML; return a generic success with sarge header
        res.statusCode = 200
        res.setHeader('content-type', 'text/xml')
        res.setHeader('x-sarge', JSON.stringify({ service, operation }))
        res.end('<SargeIAMStub/>')
        return
      }

      json(res, 404, { error: 'unknown_service', service, operation })
    } catch (err: any) {
      json(res, 500, { error: 'internal', message: err?.message })
    }
  })

  // Track sockets to allow fast shutdown without hanging on keep-alive
  const sockets = new Set<import('net').Socket>()
  server.on('connection', (socket: import('net').Socket) => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
  })

  // Wrap close to destroy open sockets first (prevents test hangs)
  const _close = server.close.bind(server)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(server as any).close = ((cb?: (err?: Error) => void) => {
    for (const s of sockets) {
      try { s.destroy() } catch {}
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return _close(cb as any)
  })

  function listen(port = opts.port ?? 0): Promise<number> {
    return new Promise((resolve) => {
      server.listen(port, () => {
        const address = server.address()
        resolve(typeof address === 'object' && address ? address.port : port)
      })
    })
  }

  function getLast() {
    return last
  }

  return { server, listen, getLast }
}

function json(res: http.ServerResponse, code: number, body: unknown, headers: Record<string, string> = {}) {
  res.statusCode = code
  res.setHeader('content-type', 'application/json')
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)
  res.end(JSON.stringify(body))
  try {
    const out = { code, type: 'application/json' as const, body }
    fs.mkdirSync(path.join(process.cwd(), 'data/sarge/workspaces/default'), { recursive: true })
    fs.writeFileSync(path.join(process.cwd(), 'data/sarge/workspaces/default/last-response.json'), JSON.stringify(out, null, 2))
  } catch {}
}

function detectService(url: URL, req?: http.IncomingMessage, raw?: string): string {
  const seg = url.pathname.split('/').filter(Boolean)
  // Support endpoints like http://host:port/dynamodb/... by prefixing service name
  const first = seg[0]?.toLowerCase()
  if (first && ['s3', 'dynamodb', 'lambda', 'iam', 'cloudwatch', 'cloudwatch-logs', 'sqs', 'sns', 'events'].includes(first)) {
    return first === 'cloudwatch' ? 'cloudwatch-logs' : first
  }
  // Try to infer from path patterns
  if (url.pathname.startsWith('/2015-03-31')) return 'lambda'
  // Infer from X-Amz-Target header
  const target = (req?.headers['x-amz-target'] as string | undefined) || ''
  if (target.startsWith('DynamoDB_')) return 'dynamodb'
  if (target.startsWith('Logs_')) return 'cloudwatch-logs'
  if (target.startsWith('AWSEvents')) return 'events'
  if (target.startsWith('AmazonSQS')) return 'sqs'
  if (target.startsWith('AmazonSNS')) return 'sns'
  // Infer from Query protocol Action in body
  const body = raw || ''
  if (body.includes('Action=')) {
    const params = new URLSearchParams(body)
    const action = (params.get('Action') || '').toLowerCase()
    const sqsActions = ['createqueue', 'sendmessage', 'receivemessage', 'deletemessage', 'getqueueurl']
    if (sqsActions.includes(action)) return 'sqs'
    const snsActions = ['createtopic', 'subscribe', 'publish']
    if (snsActions.includes(action)) return 'sns'
  }
  // Infer from Query protocol Action in URL
  const qsAction = url.searchParams.get('Action')
  if (qsAction) {
    const action = qsAction.toLowerCase()
    const sqsActions = ['createqueue', 'sendmessage', 'receivemessage', 'deletemessage', 'getqueueurl']
    if (sqsActions.includes(action)) return 'sqs'
    const snsActions = ['createtopic', 'subscribe', 'publish']
    if (snsActions.includes(action)) return 'sns'
  }
  return 'unknown'
}

function detectOperation(service: string, req: http.IncomingMessage, url: URL): string {
  if (service === 'dynamodb') {
    const target = req.headers['x-amz-target'] as string | undefined
    if (target) return target.split('.').pop() || 'Unknown'
  }
  if (service === 'cloudwatch-logs') {
    const target = req.headers['x-amz-target'] as string | undefined
    if (target) return target.split('.').pop() || 'Unknown'
  }
  if (service === 'lambda') {
    const p = url.pathname
    if (req.method === 'GET' && p.startsWith('/2015-03-31/functions')) return 'ListFunctions'
    if (req.method === 'POST' && /^\/2015-03-31\/functions\/.+\/invocations$/.test(p)) return 'Invoke'
  }
  if (service === 'events') {
    const target = req.headers['x-amz-target'] as string | undefined
    if (target) return target.split('.').pop() || 'Unknown'
  }
  if (service === 'sqs' || service === 'sns') {
    // Prefer X-Amz-Target for JSON 1.0 mode
    const target = req.headers['x-amz-target'] as string | undefined
    if (target) return target.split('.').pop() || 'Unknown'
    // Query protocol uses Action param in form body
    const ct = (req.headers['content-type'] as string | undefined) || ''
    if (ct.includes('application/x-www-form-urlencoded') && (req as any).__rawBody) {
      const params = new URLSearchParams((req as any).__rawBody as string)
      const a = params.get('Action')
      if (a) return a
    }
    const a2 = url.searchParams.get('Action')
    if (a2) return a2
  }
  if (service === 's3') {
    if (req.method === 'GET' && url.pathname === '/') return 'ListBuckets'
  }
  return 'Unknown'
}

function parseShape(service: string, req: http.IncomingMessage, raw: string, url: URL): unknown {
  // cache raw for detectOperation
  ;(req as any).__rawBody = raw
  if (!raw) return {}
  try {
    if (service === 'dynamodb' || service === 'cloudwatch-logs' || service === 'lambda' || service === 'events' || service === 'sqs' || service === 'sns') {
      return JSON.parse(raw)
    }
  } catch {}
  // Query protocol (SQS/SNS)
  const ct = (req.headers['content-type'] as string | undefined) || ''
  if (service === 'sqs' || service === 'sns' || ct.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(raw)
    const out: Record<string, string> = {}
    params.forEach((v, k) => (out[k] = v))
    return out
  }
  // Query string fallbacks for IAM/CloudWatch
  const params: Record<string, string> = {}
  url.searchParams.forEach((v, k) => (params[k] = v))
  return params
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function loadLocalPolicy(): Statement[] {
  // Load a permissive default policy from disk in the future; for now allow all when present
  const s: Statement = { Effect: 'Allow', Action: ['*'], Resource: ['*'] }
  return [s]
}

function xmlOut(res: http.ServerResponse, code: number, xml: string) {
  res.statusCode = code
  res.setHeader('content-type', 'text/xml')
  res.end(xml)
  try {
    const out = { code, type: 'text/xml' as const }
    fs.mkdirSync(path.join(process.cwd(), 'data/sarge/workspaces/default'), { recursive: true })
    fs.writeFileSync(path.join(process.cwd(), 'data/sarge/workspaces/default/last-response.json'), JSON.stringify(out, null, 2))
  } catch {}
}

function buildQueueUrl(name: string): string {
  return `http://localhost/sqs/${name}`
}

function safeJsonParse(s: string): any {
  try { return JSON.parse(s) } catch { return s }
}
