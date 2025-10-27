export interface SnapshotOptions {
    dataRoot: string;
    s3?: S3Adapter;
    dynamo?: DynamoAdapter;
    lambda?: LambdaAdapter;
    logs?: LogsAdapter;
    metrics?: MetricsAdapter;
}
export interface S3Adapter {
    listBuckets(): Promise<string[]>;
    listObjects(bucket: string): Promise<{
        key: string;
    }[]>;
    getObject(bucket: string, key: string): Promise<{
        body: Buffer;
        contentType?: string;
    }>;
    putObject(bucket: string, key: string, body: Buffer, contentType?: string): Promise<void>;
    createBucket(name: string): Promise<void>;
}
export interface DynamoAdapter {
    listTables(): Promise<string[]>;
    describeTable(name: string): Promise<{
        TableName: string;
        KeySchema: any;
        AttributeDefinitions: any;
    }>;
    scanAll(name: string): Promise<any[]>;
    createTable(desc: {
        TableName: string;
        KeySchema: any;
        AttributeDefinitions: any;
    }): Promise<void>;
    putItem(name: string, item: any): Promise<void>;
}
export interface LambdaAdapter {
    listFunctions(): Promise<Array<{
        functionName: string;
        codeHash: string;
    }>>;
}
export interface LogsAdapter {
    getWindow(startTime: number, endTime: number): Promise<Array<{
        timestamp: number;
        message: string;
    }>>;
}
export interface MetricsAdapter {
    scrape(): Promise<string>;
}
export interface SnapshotSpec {
    name: string;
    createdAt: string;
    s3?: {
        buckets: Array<{
            name: string;
            objects: Array<{
                key: string;
                contentType?: string;
                bodyB64: string;
            }>;
        }>;
    };
    dynamo?: {
        tables: Array<{
            name: string;
            schema: {
                KeySchema: any;
                AttributeDefinitions: any;
            };
            items: any[];
        }>;
    };
    lambda?: {
        functions: Array<{
            functionName: string;
            codeHash: string;
        }>;
    };
    logs?: {
        startTime: number;
        endTime: number;
        events: Array<{
            timestamp: number;
            message: string;
        }>;
    };
    metrics?: {
        scrape: string;
    };
}
export declare class SnapshotManager {
    private opts;
    private root;
    constructor(opts: SnapshotOptions);
    create(name: string, windowMs?: number): Promise<SnapshotSpec>;
    replay(name: string): Promise<void>;
    private specPath;
    private writeSpec;
    private readSpec;
}
