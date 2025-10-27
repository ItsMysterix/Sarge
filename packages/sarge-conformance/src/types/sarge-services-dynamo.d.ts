declare module 'sarge-services-dynamo' {
  export type AttributeValue = { S?: string; N?: string; B?: string }
  export class DynamoService {
    constructor(opts: { dataRoot: string })
    listTables(): Promise<{ TableNames: string[] }>
    createTable(input: any): Promise<any>
    describeTable(name: string): Promise<{ Table: { KeySchema: any[]; AttributeDefinitions: any[] } }>
    putItem(input: { TableName: string; Item: any }): Promise<any>
    getItem(input: { TableName: string; Key: any }): Promise<{ Item?: any }>
    scan(input: { TableName: string; Limit?: number; ExclusiveStartKey?: any }): Promise<{ Items: any[]; LastEvaluatedKey?: any }>
  }
}
