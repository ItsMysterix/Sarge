import { secureProcedure } from '../../trpc/middlewares/security'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { getProvider } from '../../lib/providers'
import { getProviderCredentials } from '../../lib/credentials'
import { providerLogger } from '../../../lib/logger'

/**
 * Deploy Provider sub-router endpoints
 * Provider-specific deployment, cost estimation, and status checking
 */

export const deployToProvider = secureProcedure('deploy.deployToProvider')
    .input(z.object({
        providerId: z.string(),
        repoUrl: z.string(),
        branch: z.string().default('main'),
        commit: z.string().optional(),
        buildCommand: z.string().optional(),
        startCommand: z.string().optional(),
        environmentName: z.string().default('preview'),
        resourceConfig: z.object({
            cpu: z.number().optional(),
            memory: z.number().optional(),
            replicas: z.number().optional(),
        }).optional(),
        env: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
        const provider = getProvider(input.providerId)
        if (!provider) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: `Provider ${input.providerId} not supported` })
        }

        try {
            const credentials = await getProviderCredentials(input.providerId, ctx.db, (ctx as any).userId)

            const deployResult = await provider.deploy({
                projectId: (ctx as any).projectId || 'sarge-project',
                repoUrl: input.repoUrl,
                branch: input.branch,
                commit: input.commit || '',
                environmentName: (input.environmentName as any) || 'preview',
                credentials,
                buildCommand: input.buildCommand,
                startCommand: input.startCommand,
                resourceConfig: input.resourceConfig,
                env: input.env ? Object.entries(input.env).reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {}) : {},
            })

            const summary = `[provider:${input.providerId}] [env:${input.environmentName}] Deployed to ${provider.name}`
            const result = await ctx.db.query(
                `INSERT INTO deployments (
          branch, commit, status, summary, services, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
                [
                    input.branch,
                    input.commit || null,
                    deployResult.success ? 'success' : 'failed',
                    summary,
                    JSON.stringify([])
                ]
            )

            if (result?.rows?.[0]) {
                ctx.ee.emit("deploys:update", {
                    id: result.rows[0].id,
                    status: deployResult.success ? 'success' : 'failed',
                    provider: input.providerId,
                    environment: input.environmentName,
                    previewUrl: deployResult.previewUrl,
                    productionUrl: deployResult.productionUrl,
                })
            }

            return {
                success: deployResult.success,
                deploymentId: result?.rows?.[0]?.id,
                previewUrl: deployResult.previewUrl,
                productionUrl: deployResult.productionUrl,
                error: deployResult.error,
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Deploy failed'
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `${input.providerId} deploy error: ${message}`, cause: err as Error })
        }
    })

export const estimateCost = secureProcedure('deploy.estimateCost')
    .input(z.object({
        providerId: z.string(),
        environmentName: z.string(),
        resourceConfig: z.object({
            cpu: z.number().optional(),
            memory: z.number().optional(),
            storage: z.number().optional(),
        }).optional(),
    }))
    .query(async ({ input }) => {
        const provider = getProvider(input.providerId)
        if (!provider) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: `Provider ${input.providerId} not supported` })
        }

        try {
            const cost = (provider as any).estimateCost ? await (provider as any).estimateCost({
                environmentName: input.environmentName,
                resourceConfig: input.resourceConfig,
            }) : { estimatedMonthly: 0, currency: 'USD' }
            return cost
        } catch (err) {
            providerLogger.error({ err, input }, '[deploy.estimateCost] Error')
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to estimate cost', cause: err as Error })
        }
    })

export const getProviderStatus = secureProcedure('deploy.getProviderStatus')
    .input(z.object({
        providerId: z.string(),
        deploymentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
        const provider = getProvider(input.providerId)
        if (!provider) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: `Provider ${input.providerId} not supported` })
        }

        try {
            const credentials = await getProviderCredentials(input.providerId, ctx.db, (ctx as any).userId)
            const status = await provider.getStatus({
                deploymentId: input.deploymentId,
                credentials,
            })
            return status
        } catch (err) {
            providerLogger.error({ err, input }, '[deploy.getProviderStatus] Error')
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch provider status', cause: err as Error })
        }
    })
