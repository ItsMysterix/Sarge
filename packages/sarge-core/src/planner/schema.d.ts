import { z } from 'zod';
export declare const CurrentServiceSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<{
        web: "web";
        api: "api";
        worker: "worker";
    }>>;
    ports: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodString>>>;
}, z.core.$strip>;
export declare const CurrentResourcesSchema: z.ZodObject<{
    s3Buckets: z.ZodDefault<z.ZodArray<z.ZodString>>;
    dynamoTables: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        partitionKey: z.ZodDefault<z.ZodString>;
        sortKey: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    lambdaFunctions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        handler: z.ZodOptional<z.ZodString>;
        runtime: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const CurrentStackStateSchema: z.ZodObject<{
    services: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<{
            web: "web";
            api: "api";
            worker: "worker";
        }>>;
        ports: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
        env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodString>>>;
    }, z.core.$strip>>>;
    resources: z.ZodDefault<z.ZodObject<{
        s3Buckets: z.ZodDefault<z.ZodArray<z.ZodString>>;
        dynamoTables: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            partitionKey: z.ZodDefault<z.ZodString>;
            sortKey: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        lambdaFunctions: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            handler: z.ZodOptional<z.ZodString>;
            runtime: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CurrentStackState = z.infer<typeof CurrentStackStateSchema>;
export declare const ValidationIssueSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    kind: z.ZodLiteral<"port-conflict">;
    service: z.ZodString;
    requested: z.ZodNumber;
    assigned: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"reserved-port">;
    service: z.ZodString;
    requested: z.ZodNumber;
    assigned: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"missing-env">;
    key: z.ZodString;
    services: z.ZodArray<z.ZodString>;
}, z.core.$strip>], "kind">;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export declare const ResourceOpSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    op: z.ZodLiteral<"create">;
    resourceType: z.ZodEnum<{
        s3Bucket: "s3Bucket";
        dynamoTable: "dynamoTable";
        lambdaFunction: "lambdaFunction";
    }>;
    payload: z.ZodAny;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"update">;
    resourceType: z.ZodEnum<{
        s3Bucket: "s3Bucket";
        dynamoTable: "dynamoTable";
        lambdaFunction: "lambdaFunction";
    }>;
    payload: z.ZodAny;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"delete">;
    resourceType: z.ZodEnum<{
        s3Bucket: "s3Bucket";
        dynamoTable: "dynamoTable";
        lambdaFunction: "lambdaFunction";
    }>;
    payload: z.ZodAny;
}, z.core.$strip>], "op">;
export type ResourceOp = z.infer<typeof ResourceOpSchema>;
export declare const ServiceOpSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    op: z.ZodLiteral<"start">;
    name: z.ZodString;
    ports: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"restart">;
    name: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
    ports: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"stop">;
    name: z.ZodString;
}, z.core.$strip>], "op">;
export type ServiceOp = z.infer<typeof ServiceOpSchema>;
export declare const TelemetryAttachmentSchema: z.ZodObject<{
    prometheus: z.ZodDefault<z.ZodBoolean>;
    cloudwatchLogs: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ApplyPlanSchema: z.ZodObject<{
    blueprint: z.ZodObject<{
        services: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodDefault<z.ZodEnum<{
                web: "web";
                api: "api";
                worker: "worker";
            }>>;
            cwd: z.ZodOptional<z.ZodString>;
            startCommand: z.ZodOptional<z.ZodString>;
            ports: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
            envKeys: z.ZodDefault<z.ZodArray<z.ZodString>>;
            health: z.ZodOptional<z.ZodObject<{
                http: z.ZodOptional<z.ZodObject<{
                    path: z.ZodDefault<z.ZodString>;
                    port: z.ZodOptional<z.ZodNumber>;
                }, z.core.$strip>>;
                tcp: z.ZodOptional<z.ZodObject<{
                    port: z.ZodNumber;
                }, z.core.$strip>>;
                command: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>>>;
        resources: z.ZodDefault<z.ZodObject<{
            s3Buckets: z.ZodDefault<z.ZodArray<z.ZodString>>;
            dynamoTables: z.ZodDefault<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                partitionKey: z.ZodDefault<z.ZodString>;
                sortKey: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>>;
            lambdaFunctions: z.ZodDefault<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                handler: z.ZodOptional<z.ZodString>;
                runtime: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>;
        ports: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
        envKeys: z.ZodDefault<z.ZodArray<z.ZodString>>;
        docker: z.ZodDefault<z.ZodObject<{
            dockerfile: z.ZodDefault<z.ZodBoolean>;
            composeFiles: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
        awsSdks: z.ZodDefault<z.ZodArray<z.ZodEnum<{
            s3: "s3";
            dynamodb: "dynamodb";
            lambda: "lambda";
        }>>>;
    }, z.core.$strip>;
    assignedPorts: z.ZodDefault<z.ZodArray<z.ZodObject<{
        service: z.ZodString;
        requested: z.ZodArray<z.ZodNumber>;
        assigned: z.ZodArray<z.ZodNumber>;
    }, z.core.$strip>>>;
    issues: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        kind: z.ZodLiteral<"port-conflict">;
        service: z.ZodString;
        requested: z.ZodNumber;
        assigned: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"reserved-port">;
        service: z.ZodString;
        requested: z.ZodNumber;
        assigned: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"missing-env">;
        key: z.ZodString;
        services: z.ZodArray<z.ZodString>;
    }, z.core.$strip>], "kind">>>;
    resourceOps: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"create">;
        resourceType: z.ZodEnum<{
            s3Bucket: "s3Bucket";
            dynamoTable: "dynamoTable";
            lambdaFunction: "lambdaFunction";
        }>;
        payload: z.ZodAny;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"update">;
        resourceType: z.ZodEnum<{
            s3Bucket: "s3Bucket";
            dynamoTable: "dynamoTable";
            lambdaFunction: "lambdaFunction";
        }>;
        payload: z.ZodAny;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"delete">;
        resourceType: z.ZodEnum<{
            s3Bucket: "s3Bucket";
            dynamoTable: "dynamoTable";
            lambdaFunction: "lambdaFunction";
        }>;
        payload: z.ZodAny;
    }, z.core.$strip>], "op">>>;
    serviceOps: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"start">;
        name: z.ZodString;
        ports: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"restart">;
        name: z.ZodString;
        reason: z.ZodOptional<z.ZodString>;
        ports: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"stop">;
        name: z.ZodString;
    }, z.core.$strip>], "op">>>;
    telemetry: z.ZodDefault<z.ZodObject<{
        prometheus: z.ZodDefault<z.ZodBoolean>;
        cloudwatchLogs: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    rollbackPoints: z.ZodDefault<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
    }, z.core.$strip>>>;
    planText: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type ApplyPlan = z.infer<typeof ApplyPlanSchema>;
export declare const PlannerOptionsSchema: z.ZodObject<{
    reservedPorts: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    basePort: z.ZodDefault<z.ZodNumber>;
    providedEnv: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodString>>>;
}, z.core.$strip>;
export type PlannerOptions = z.infer<typeof PlannerOptionsSchema>;
