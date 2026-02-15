/**
 * Platform Selection Intelligence Engine
 * 
 * Analyzes repository metadata, tech stack, and service requirements
 * to recommend the best deployment platform.
 */

import { PLATFORM_CONSTRAINTS, PlatformCapabilities } from './platform-constraints'

export interface ServiceProfile {
    name: string
    techStack: string[]
    type: 'frontend' | 'backend' | 'worker' | 'database' | 'cron'
    requirements: {
        websockets?: boolean
        longRunning?: boolean
        maxTimeout?: number // seconds
        cpu?: number
        memory?: number
        regions?: string[]
        managedDatabase?: string
    }
}

export interface Recommendation {
    platformId: string
    platformName: string
    confidence: number // 0-1
    reason: string
    tradeoffs: string[]
    estimatedMonthlyCost: number
}

export interface PlatformRecommendationResult {
    service: string
    primary: Recommendation
    alternatives: Recommendation[]
}

export class PlatformRouter {
    /**
     * Recommend platforms for a given service profile
     */
    recommend(service: ServiceProfile): PlatformRecommendationResult {
        const scores = new Map<string, Recommendation>()

        for (const [id, caps] of Object.entries(PLATFORM_CONSTRAINTS)) {
            const recommendation = this.scorePlatform(service, caps)
            if (recommendation) {
                scores.set(id, recommendation)
            }
        }

        const sorted = Array.from(scores.values()).sort((a, b) => b.confidence - a.confidence)

        return {
            service: service.name,
            primary: sorted[0],
            alternatives: sorted.slice(1, 4),
        }
    }

    private scorePlatform(service: ServiceProfile, caps: PlatformCapabilities): Recommendation | null {
        let confidence = 0.5
        const tradeoffs: string[] = []
        let reason = ''

        // 1. Mandatory requirement checks (hard constraints)
        if (service.requirements.websockets && !caps.metrics.websockets) return null
        if (service.requirements.longRunning && !caps.metrics.longRunning) return null
        if (service.requirements.maxTimeout && caps.metrics.maxTimeout && service.requirements.maxTimeout > caps.metrics.maxTimeout) return null

        // 2. Type matching
        if (service.type === 'frontend' && caps.kind === 'static') {
            confidence += 0.4
            reason = `${caps.name} is optimized for static and SSR frontends.`
        } else if (service.type === 'backend' && caps.kind === 'containers') {
            confidence += 0.3
            reason = `${caps.name} provides robust container hosting for APIs.`
        } else if (service.type === 'worker' && caps.kind === 'containers' && caps.metrics.longRunning) {
            confidence += 0.4
            reason = `${caps.name} supports long-running background tasks.`
        } else if (service.type === 'backend' && caps.kind === 'functions' && !service.requirements.longRunning) {
            confidence += 0.2
            reason = `Serverless functions on ${caps.name} are cost-effective for bursty APIs.`
        }

        // 3. Tech stack affinity
        if (service.techStack.includes('nextjs') && caps.id === 'vercel') {
            confidence += 0.1
            reason += ' Native Next.js support.'
        }
        if (service.techStack.includes('docker') && caps.kind === 'containers') {
            confidence += 0.1
        }
        if (service.techStack.includes('graphql') && caps.kind === 'containers') {
            confidence += 0.05
            tradeoffs.push('GraphQL subscriptions require persistent connections (WebSockets).')
        }

        // 4. Managed databases
        if (service.requirements.managedDatabase && !caps.metrics.managedDatabases.includes(service.requirements.managedDatabase)) {
            confidence -= 0.2
            tradeoffs.push(`No native managed ${service.requirements.managedDatabase} support.`)
        }

        // 5. Scalability (for a million users)
        if (caps.id === 'kubernetes') {
            confidence += 0.1
            reason += ' Best-in-class scalability for high-traffic workloads.'
        }

        // 6. Cost estimation (crude)
        let cost = 0
        if (caps.pricing.model === 'resource') {
            cost = 20 // base $20/mo
        } else {
            cost = 0 // free tier starts
        }

        return {
            platformId: caps.id,
            platformName: caps.name,
            confidence: Math.min(confidence, 1),
            reason,
            tradeoffs,
            estimatedMonthlyCost: cost,
        }
    }
}
