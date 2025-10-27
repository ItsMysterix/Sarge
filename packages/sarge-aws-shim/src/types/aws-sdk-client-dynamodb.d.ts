declare module '@aws-sdk/client-dynamodb' {
  export class DynamoDBClient { constructor(opts: any); send(cmd: any): Promise<any> }
  export class ListTablesCommand { constructor(input: any) }
}
