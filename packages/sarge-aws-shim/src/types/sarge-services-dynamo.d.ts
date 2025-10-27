declare module 'sarge-services-dynamo' {
  export type AttributeValue = { S?: string; N?: string; B?: string }
  export type Item = Record<string, AttributeValue>
  export interface KeySchemaElement { AttributeName: string; KeyType: 'HASH' | 'RANGE' }
  export interface AttributeDefinition { AttributeName: string; AttributeType: 'S' | 'N' | 'B' }
  export interface CreateTableInput { TableName: string; KeySchema: KeySchemaElement[]; AttributeDefinitions: AttributeDefinition[] }
  export interface DescribeTableOutput { Table: { TableName: string; KeySchema: KeySchemaElement[]; AttributeDefinitions: AttributeDefinition[]; ItemCount: number } }
  export interface PutItemInput { TableName: string; Item: Item }
  export interface GetItemInput { TableName: string; Key: Item }
  export interface GetItemOutput { Item?: Item }
  export interface QueryInput {
    TableName: string
    KeyConditionExpression: string
    ExpressionAttributeValues: Record<string, AttributeValue>
    Limit?: number
    ExclusiveStartKey?: Item
  }
  export interface QueryOutput { Items: Item[]; Count: number; ScannedCount: number; LastEvaluatedKey?: Item }
  export interface ScanInput { TableName: string; Limit?: number; ExclusiveStartKey?: Item }
  export interface ScanOutput { Items: Item[]; Count: number; ScannedCount: number; LastEvaluatedKey?: Item }
  export interface DynamoServiceOptions { dataRoot: string }
  export class DynamoService {
    constructor(opts: DynamoServiceOptions)
    listTables(): Promise<{ TableNames: string[] }>
    createTable(input: CreateTableInput): Promise<DescribeTableOutput>
    describeTable(TableName: string): Promise<DescribeTableOutput>
    putItem(input: PutItemInput): Promise<{}>
    getItem(input: GetItemInput): Promise<GetItemOutput>
    query(input: QueryInput): Promise<QueryOutput>
    scan(input: ScanInput): Promise<ScanOutput>
  }
}
