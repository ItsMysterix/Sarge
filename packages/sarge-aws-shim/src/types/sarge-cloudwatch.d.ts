declare module 'sarge-cloudwatch' {
  export interface CloudWatchOptions { dataRoot: string }
  export interface LogEvent { timestamp: number; message: string; level?: string; fields?: Record<string, unknown> }
  export class CloudWatchLogsService {
    constructor(opts: CloudWatchOptions)
    createLogGroup(groupName: string): Promise<void>
    createLogStream(groupName: string, streamName: string): Promise<void>
    describeLogGroups(): Promise<{ logGroupNames: string[] }>
    putLogEvents(groupName: string, streamName: string, events: LogEvent[]): Promise<void>
    getLogEvents(groupName: string, streamName: string, startTime?: number, endTime?: number): Promise<{ events: LogEvent[] }>
  }
}
