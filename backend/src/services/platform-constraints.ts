/**
 * Platform Constraints Database
 * 
 * Defines the capabilities and limitations of each supported platform
 * to inform the selection engine.
 */

export interface PlatformCapabilities {
    id: string
    name: string
    kind: 'containers' | 'functions' | 'static'
    metrics: {
        maxTimeout: number | null // seconds, null = unlimited
        websockets: boolean
        longRunning: boolean
        ephemeralStorageOnly: boolean
        managedDatabases: string[]
        regions: string[]
        hasNativeSsl: boolean
        hasCustomDomains: boolean
        maxReplicas: number | null
        horizontalScaling: boolean
        verticalScaling: boolean
    }
    pricing: {
        freeTier: boolean
        model: 'usage' | 'resource' | 'hybrid'
    }
}

export const PLATFORM_CONSTRAINTS: Record<string, PlatformCapabilities> = {
    vercel: {
        id: 'vercel',
        name: 'Vercel',
        kind: 'static',
        metrics: {
            maxTimeout: 300,
            websockets: false,
            longRunning: false,
            ephemeralStorageOnly: true,
            managedDatabases: ['postgres', 'redis', 'kv', 'blob'],
            regions: ['global'],
            hasNativeSsl: true,
            hasCustomDomains: true,
            maxReplicas: null,
            horizontalScaling: true,
            verticalScaling: false,
        },
        pricing: { freeTier: true, model: 'usage' },
    },
    railway: {
        id: 'railway',
        name: 'Railway',
        kind: 'containers',
        metrics: {
            maxTimeout: null,
            websockets: true,
            longRunning: true,
            ephemeralStorageOnly: false,
            managedDatabases: ['postgres', 'mysql', 'redis', 'mongodb'],
            regions: ['us-east', 'eu-west'],
            hasNativeSsl: true,
            hasCustomDomains: true,
            maxReplicas: null,
            horizontalScaling: true,
            verticalScaling: true,
        },
        pricing: { freeTier: true, model: 'resource' },
    },
    render: {
        id: 'render',
        name: 'Render',
        kind: 'containers',
        metrics: {
            maxTimeout: null,
            websockets: true,
            longRunning: true,
            ephemeralStorageOnly: false,
            managedDatabases: ['postgres', 'redis'],
            regions: ['us-east', 'us-west', 'eu-central', 'ap-southeast'],
            hasNativeSsl: true,
            hasCustomDomains: true,
            maxReplicas: null,
            horizontalScaling: true,
            verticalScaling: true,
        },
        pricing: { freeTier: true, model: 'resource' },
    },
    cloudflare: {
        id: 'cloudflare',
        name: 'Cloudflare Pages',
        kind: 'static',
        metrics: {
            maxTimeout: 30, // workers 10-30s
            websockets: true, // via durable objects/workers
            longRunning: false,
            ephemeralStorageOnly: true,
            managedDatabases: ['d1', 'kv', 'r2', 'durable-objects'],
            regions: ['global'],
            hasNativeSsl: true,
            hasCustomDomains: true,
            maxReplicas: null,
            horizontalScaling: true,
            verticalScaling: false,
        },
        pricing: { freeTier: true, model: 'usage' },
    },
    'aws-lambda': {
        id: 'aws-lambda',
        name: 'AWS Lambda',
        kind: 'functions',
        metrics: {
            maxTimeout: 900,
            websockets: false, // native lambda doesn't support persistent WS
            longRunning: false,
            ephemeralStorageOnly: true,
            managedDatabases: ['rds', 'dynamodb', 'elasticache'],
            regions: ['global'],
            hasNativeSsl: true,
            hasCustomDomains: true,
            maxReplicas: null,
            horizontalScaling: true,
            verticalScaling: true,
        },
        pricing: { freeTier: true, model: 'usage' },
    },
    kubernetes: {
        id: 'kubernetes',
        name: 'Kubernetes (BYOK)',
        kind: 'containers',
        metrics: {
            maxTimeout: null,
            websockets: true,
            longRunning: true,
            ephemeralStorageOnly: false,
            managedDatabases: [], // user-managed
            regions: ['user-defined'],
            hasNativeSsl: true, // via cert-manager
            hasCustomDomains: true,
            maxReplicas: 1000,
            horizontalScaling: true,
            verticalScaling: true,
        },
        pricing: { freeTier: true, model: 'resource' },
    },
    'fly-io': {
        id: 'fly-io',
        name: 'Fly.io',
        kind: 'containers',
        metrics: {
            maxTimeout: null,
            websockets: true,
            longRunning: true,
            ephemeralStorageOnly: false,
            managedDatabases: ['postgres', 'redis'],
            regions: ['global'],
            hasNativeSsl: true,
            hasCustomDomains: true,
            maxReplicas: null,
            horizontalScaling: true,
            verticalScaling: true,
        },
        pricing: { freeTier: true, model: 'usage' },
    },
}
