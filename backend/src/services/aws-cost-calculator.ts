import { AWSService } from './aws-detector'

export interface CostEstimate {
  service: string
  serviceName: string
  monthlyCost: number
  breakdown: CostBreakdown[]
  assumptions: string[]
}

export interface CostBreakdown {
  item: string
  quantity: number
  unit: string
  unitCost: number
  totalCost: number
}

export interface TotalCostEstimate {
  totalMonthly: number
  totalAnnual: number
  byService: CostEstimate[]
  confidence: 'low' | 'medium' | 'high'
  notes: string[]
}

// AWS pricing as of 2024 (approximate, USD)
const PRICING = {
  s3: {
    storage: 0.023, // per GB/month (Standard)
    requests_get: 0.0004 / 1000, // per 1000 GET requests
    requests_put: 0.005 / 1000, // per 1000 PUT requests
  },
  lambda: {
    requests: 0.20 / 1_000_000, // per 1M requests
    compute_gb_second: 0.0000166667, // per GB-second
    free_requests: 1_000_000, // per month
    free_compute: 400_000, // GB-seconds per month
  },
  dynamodb: {
    storage: 0.25, // per GB/month
    write_unit: 0.00065 / 1_000_000, // per 1M write units (on-demand)
    read_unit: 0.00013 / 1_000_000, // per 1M read units (on-demand)
  },
  sqs: {
    requests: 0.40 / 1_000_000, // per 1M requests (after first 1M free)
    free_requests: 1_000_000, // per month
  },
  sns: {
    requests: 0.50 / 1_000_000, // per 1M requests (after first 1M free)
    free_requests: 1_000_000, // per month
  },
  eventbridge: {
    events: 1.00 / 1_000_000, // per 1M custom events
    free_events: 0, // No free tier for custom events
  },
  cloudwatch: {
    logs_ingestion: 0.50, // per GB ingested
    logs_storage: 0.03, // per GB/month
    metrics: 0.30, // per custom metric/month
  },
}

export class AWSCostCalculator {
  constructor() {}

  calculateCosts(services: AWSService[], usage?: UsageAssumptions): TotalCostEstimate {
    const byService: CostEstimate[] = []
    const notes: string[] = []

    // Use default assumptions if not provided
    const assumptions = usage || this.getDefaultAssumptions()
    
    notes.push('Costs are estimates based on typical usage patterns')
    notes.push('Actual costs may vary based on region and specific usage')
    notes.push('Free tier benefits are included where applicable')

    for (const service of services) {
      let estimate: CostEstimate | null = null

      switch (service.type) {
        case 'S3':
          estimate = this.calculateS3Cost(service, assumptions)
          break
        case 'Lambda':
          estimate = this.calculateLambdaCost(service, assumptions)
          break
        case 'DynamoDB':
          estimate = this.calculateDynamoDBCost(service, assumptions)
          break
        case 'SQS':
          estimate = this.calculateSQSCost(service, assumptions)
          break
        case 'SNS':
          estimate = this.calculateSNSCost(service, assumptions)
          break
        case 'EventBridge':
          estimate = this.calculateEventBridgeCost(service, assumptions)
          break
        case 'CloudWatch':
          estimate = this.calculateCloudWatchCost(service, assumptions)
          break
      }

      if (estimate) {
        byService.push(estimate)
      }
    }

    const totalMonthly = byService.reduce((sum, est) => sum + est.monthlyCost, 0)

    return {
      totalMonthly,
      totalAnnual: totalMonthly * 12,
      byService,
      confidence: usage ? 'high' : 'low',
      notes,
    }
  }

  private calculateS3Cost(service: AWSService, assumptions: UsageAssumptions): CostEstimate {
    const storage = assumptions.s3?.storageGB || 10
    const getRequests = assumptions.s3?.getRequestsPerMonth || 10_000
    const putRequests = assumptions.s3?.putRequestsPerMonth || 1_000

    const storageCost = storage * PRICING.s3.storage
    const getCost = getRequests * PRICING.s3.requests_get
    const putCost = putRequests * PRICING.s3.requests_put

    return {
      service: 'S3',
      serviceName: service.name,
      monthlyCost: storageCost + getCost + putCost,
      breakdown: [
        {
          item: 'Storage',
          quantity: storage,
          unit: 'GB',
          unitCost: PRICING.s3.storage,
          totalCost: storageCost,
        },
        {
          item: 'GET Requests',
          quantity: getRequests,
          unit: 'requests',
          unitCost: PRICING.s3.requests_get * 1000,
          totalCost: getCost,
        },
        {
          item: 'PUT Requests',
          quantity: putRequests,
          unit: 'requests',
          unitCost: PRICING.s3.requests_put * 1000,
          totalCost: putCost,
        },
      ],
      assumptions: [
        `Storage: ${storage} GB`,
        `GET requests: ${getRequests.toLocaleString()}/month`,
        `PUT requests: ${putRequests.toLocaleString()}/month`,
      ],
    }
  }

  private calculateLambdaCost(service: AWSService, assumptions: UsageAssumptions): CostEstimate {
    const invocations = assumptions.lambda?.invocationsPerMonth || 100_000
    const avgDurationMs = assumptions.lambda?.avgDurationMs || 200
    const memoryMB = assumptions.lambda?.memoryMB || 512

    const billableInvocations = Math.max(0, invocations - PRICING.lambda.free_requests)
    const invocationCost = billableInvocations * PRICING.lambda.requests

    const gbSeconds = (invocations * avgDurationMs * memoryMB) / (1000 * 1024)
    const billableGbSeconds = Math.max(0, gbSeconds - PRICING.lambda.free_compute)
    const computeCost = billableGbSeconds * PRICING.lambda.compute_gb_second

    return {
      service: 'Lambda',
      serviceName: service.name,
      monthlyCost: invocationCost + computeCost,
      breakdown: [
        {
          item: 'Invocations',
          quantity: billableInvocations,
          unit: 'invocations',
          unitCost: PRICING.lambda.requests,
          totalCost: invocationCost,
        },
        {
          item: 'Compute (GB-seconds)',
          quantity: billableGbSeconds,
          unit: 'GB-seconds',
          unitCost: PRICING.lambda.compute_gb_second,
          totalCost: computeCost,
        },
      ],
      assumptions: [
        `Invocations: ${invocations.toLocaleString()}/month`,
        `Avg duration: ${avgDurationMs}ms`,
        `Memory: ${memoryMB}MB`,
        `Free tier applied: ${PRICING.lambda.free_requests.toLocaleString()} requests, ${PRICING.lambda.free_compute.toLocaleString()} GB-seconds`,
      ],
    }
  }

  private calculateDynamoDBCost(service: AWSService, assumptions: UsageAssumptions): CostEstimate {
    const storage = assumptions.dynamodb?.storageGB || 1
    const readUnits = assumptions.dynamodb?.readUnitsPerMonth || 1_000_000
    const writeUnits = assumptions.dynamodb?.writeUnitsPerMonth || 100_000

    const storageCost = storage * PRICING.dynamodb.storage
    const readCost = readUnits * PRICING.dynamodb.read_unit
    const writeCost = writeUnits * PRICING.dynamodb.write_unit

    return {
      service: 'DynamoDB',
      serviceName: service.name,
      monthlyCost: storageCost + readCost + writeCost,
      breakdown: [
        {
          item: 'Storage',
          quantity: storage,
          unit: 'GB',
          unitCost: PRICING.dynamodb.storage,
          totalCost: storageCost,
        },
        {
          item: 'Read Units',
          quantity: readUnits,
          unit: 'units',
          unitCost: PRICING.dynamodb.read_unit * 1_000_000,
          totalCost: readCost,
        },
        {
          item: 'Write Units',
          quantity: writeUnits,
          unit: 'units',
          unitCost: PRICING.dynamodb.write_unit * 1_000_000,
          totalCost: writeCost,
        },
      ],
      assumptions: [
        `Storage: ${storage} GB`,
        `Read units: ${readUnits.toLocaleString()}/month (on-demand)`,
        `Write units: ${writeUnits.toLocaleString()}/month (on-demand)`,
      ],
    }
  }

  private calculateSQSCost(service: AWSService, assumptions: UsageAssumptions): CostEstimate {
    const requests = assumptions.sqs?.requestsPerMonth || 500_000
    const billableRequests = Math.max(0, requests - PRICING.sqs.free_requests)
    const cost = billableRequests * PRICING.sqs.requests

    return {
      service: 'SQS',
      serviceName: service.name,
      monthlyCost: cost,
      breakdown: [
        {
          item: 'Requests',
          quantity: billableRequests,
          unit: 'requests',
          unitCost: PRICING.sqs.requests,
          totalCost: cost,
        },
      ],
      assumptions: [
        `Requests: ${requests.toLocaleString()}/month`,
        `Free tier applied: ${PRICING.sqs.free_requests.toLocaleString()} requests`,
      ],
    }
  }

  private calculateSNSCost(service: AWSService, assumptions: UsageAssumptions): CostEstimate {
    const requests = assumptions.sns?.requestsPerMonth || 100_000
    const billableRequests = Math.max(0, requests - PRICING.sns.free_requests)
    const cost = billableRequests * PRICING.sns.requests

    return {
      service: 'SNS',
      serviceName: service.name,
      monthlyCost: cost,
      breakdown: [
        {
          item: 'Requests',
          quantity: billableRequests,
          unit: 'requests',
          unitCost: PRICING.sns.requests,
          totalCost: cost,
        },
      ],
      assumptions: [
        `Requests: ${requests.toLocaleString()}/month`,
        `Free tier applied: ${PRICING.sns.free_requests.toLocaleString()} requests`,
      ],
    }
  }

  private calculateEventBridgeCost(service: AWSService, assumptions: UsageAssumptions): CostEstimate {
    const events = assumptions.eventbridge?.eventsPerMonth || 50_000
    const cost = events * PRICING.eventbridge.events

    return {
      service: 'EventBridge',
      serviceName: service.name,
      monthlyCost: cost,
      breakdown: [
        {
          item: 'Custom Events',
          quantity: events,
          unit: 'events',
          unitCost: PRICING.eventbridge.events,
          totalCost: cost,
        },
      ],
      assumptions: [
        `Custom events: ${events.toLocaleString()}/month`,
        'No free tier for custom events',
      ],
    }
  }

  private calculateCloudWatchCost(service: AWSService, assumptions: UsageAssumptions): CostEstimate {
    const logsGB = assumptions.cloudwatch?.logsIngestedGB || 5
    const metricsCount = assumptions.cloudwatch?.customMetrics || 10

    const logsCost = logsGB * PRICING.cloudwatch.logs_ingestion
    const metricsCost = metricsCount * PRICING.cloudwatch.metrics

    return {
      service: 'CloudWatch',
      serviceName: service.name,
      monthlyCost: logsCost + metricsCost,
      breakdown: [
        {
          item: 'Logs Ingestion',
          quantity: logsGB,
          unit: 'GB',
          unitCost: PRICING.cloudwatch.logs_ingestion,
          totalCost: logsCost,
        },
        {
          item: 'Custom Metrics',
          quantity: metricsCount,
          unit: 'metrics',
          unitCost: PRICING.cloudwatch.metrics,
          totalCost: metricsCost,
        },
      ],
      assumptions: [
        `Logs ingested: ${logsGB} GB/month`,
        `Custom metrics: ${metricsCount}`,
      ],
    }
  }

  private getDefaultAssumptions(): UsageAssumptions {
    return {
      s3: {
        storageGB: 10,
        getRequestsPerMonth: 10_000,
        putRequestsPerMonth: 1_000,
      },
      lambda: {
        invocationsPerMonth: 100_000,
        avgDurationMs: 200,
        memoryMB: 512,
      },
      dynamodb: {
        storageGB: 1,
        readUnitsPerMonth: 1_000_000,
        writeUnitsPerMonth: 100_000,
      },
      sqs: {
        requestsPerMonth: 500_000,
      },
      sns: {
        requestsPerMonth: 100_000,
      },
      eventbridge: {
        eventsPerMonth: 50_000,
      },
      cloudwatch: {
        logsIngestedGB: 5,
        customMetrics: 10,
      },
    }
  }
}

export interface UsageAssumptions {
  s3?: {
    storageGB: number
    getRequestsPerMonth: number
    putRequestsPerMonth: number
  }
  lambda?: {
    invocationsPerMonth: number
    avgDurationMs: number
    memoryMB: number
  }
  dynamodb?: {
    storageGB: number
    readUnitsPerMonth: number
    writeUnitsPerMonth: number
  }
  sqs?: {
    requestsPerMonth: number
  }
  sns?: {
    requestsPerMonth: number
  }
  eventbridge?: {
    eventsPerMonth: number
  }
  cloudwatch?: {
    logsIngestedGB: number
    customMetrics: number
  }
}
