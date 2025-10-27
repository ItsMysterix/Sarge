declare module '@aws-sdk/client-lambda' {
  export class LambdaClient { constructor(opts: any); send(cmd: any): Promise<any> }
  export class ListFunctionsCommand { constructor(input: any) }
}
