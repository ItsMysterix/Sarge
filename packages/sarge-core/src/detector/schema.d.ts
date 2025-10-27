import { z } from 'zod';
export declare const HealthProbeSchema: z.ZodObject<{
    http: z.ZodOptional<z.ZodObject<{
        path: z.ZodDefault<z.ZodString>;
        port: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    tcp: z.ZodOptional<z.ZodObject<{
        port: z.ZodNumber;
    }, z.core.$strip>>;
    command: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ServiceSchema: z.ZodObject<{
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
}, z.core.$strip>;
export declare const ResourceSchema: z.ZodObject<{
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
export declare const StackBlueprintSchema: z.ZodObject<{
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
export type HealthProbe = z.infer<typeof HealthProbeSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type ResourceSummary = z.infer<typeof ResourceSchema>;
export type StackBlueprint = z.infer<typeof StackBlueprintSchema>;
