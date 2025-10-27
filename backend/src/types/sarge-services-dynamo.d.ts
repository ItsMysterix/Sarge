declare module 'sarge-services-dynamo' {
  export class DynamoService {
    constructor(opts: { dataRoot: string })
    listTables(): Promise<{ TableNames: string[] }>
    createTable(input: any): Promise<any>
    describeTable(name: string): Promise<{ Table: { KeySchema: any[]; AttributeDefinitions: any[] } }>
    scan(input: { TableName: string; Limit?: number; ExclusiveStartKey?: any }): Promise<{ Items: any[] }>
    putItem(input: { TableName: string; Item: any }): Promise<any>
  }
}
