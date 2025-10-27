declare module '@aws-sdk/client-dynamodb' {
  export class DynamoDBClient {
    constructor(opts: any)
    send(cmd: any): Promise<any>
  }
  export class CreateTableCommand { constructor(input: any) }
  export class DescribeTableCommand { constructor(input: any) }
  export class PutItemCommand { constructor(input: any) }
  export class GetItemCommand { constructor(input: any) }
  export class QueryCommand { constructor(input: any) }
  export class ScanCommand { constructor(input: any) }
  export type AttributeValue = { S?: string; N?: string; B?: string }
}
