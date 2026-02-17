declare module '@aws-sdk/client-cloudwatch-logs' {
  export class CloudWatchLogsClient { constructor(opts: any); send(cmd: any): Promise<any> }
  export class DescribeLogGroupsCommand { constructor(input: any) }
  export class DescribeLogStreamsCommand { constructor(input: any) }
  export class GetLogEventsCommand { constructor(input: any) }
}
