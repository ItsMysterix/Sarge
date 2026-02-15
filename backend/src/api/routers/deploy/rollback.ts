import { secureProcedure } from '../../trpc/middlewares/security'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

/**
 * Deploy Rollback & Cost sub-router endpoints
 * Deployment rollback management and cost tracking
 */

export const rollback = secureProcedure('deploy.rollback')
    .input(z.object({
        deploymentId: z.string(),
        reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
        const userId = (ctx as any).userId || 'system'

        try {
            const currentDeploy = await ctx.db.query(
                `SELECT id, branch, commit, status FROM deployments WHERE id = $1`,
                [input.deploymentId]
            )

            if (!currentDeploy?.rows?.[0]) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Deployment not found' })
            }

            const previousDeploy = await ctx.db.query(
                `SELECT id, branch, commit FROM deployments 
         WHERE status = 'success' AND id != $1 AND created_at < (
           SELECT created_at FROM deployments WHERE id = $1
         )
         ORDER BY created_at DESC LIMIT 1`,
                [input.deploymentId]
            )

            if (!previousDeploy?.rows?.[0]) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'No previous deployment to rollback to' })
            }

            const rollbackResult = await ctx.db.query(
                `INSERT INTO deployment_rollbacks (
          deployment_id, previous_deployment_id, reason, triggered_by, status, created_at
        ) VALUES ($1, $2, $3, $4, 'in-progress', NOW())
        RETURNING id`,
                [
                    input.deploymentId,
                    previousDeploy.rows[0].id,
                    input.reason || 'Manual rollback',
                    userId
                ]
            ).catch((err: any) => {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create rollback record', cause: err })
            })

            await ctx.db.query(
                `UPDATE deployments SET status = 'rolled-back', updated_at = NOW() WHERE id = $1`,
                [input.deploymentId]
            )

            await ctx.db.query(
                `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, metadata, created_at)
         VALUES ('deployment.rolledback', 'deployment', $1, $2, $3, NOW())`,
                [input.deploymentId, userId, JSON.stringify({
                    to: previousDeploy.rows[0].id,
                    reason: input.reason
                })]
            ).catch(() => { })

            await ctx.db.query(
                `UPDATE deployment_rollbacks SET status = 'completed', completed_at = NOW() WHERE id = $1`,
                [rollbackResult.rows[0].id]
            ).catch(() => { })

            return {
                success: true,
                rollbackId: rollbackResult.rows[0].id,
                previousDeploymentId: previousDeploy.rows[0].id,
            }
        } catch (err) {
            if (err instanceof TRPCError) throw err
            console.error('[deploy.rollback] Error:', err)
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Rollback failed', cause: err as Error })
        }
    })

export const getRollbackHistory = secureProcedure('deploy.getRollbackHistory')
    .input(z.object({
        deploymentId: z.string().optional(),
        projectId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
        try {
            let query = `SELECT * FROM deployment_rollbacks`
            const params: any[] = []

            if (input.deploymentId) {
                query += ` WHERE deployment_id = $1 OR previous_deployment_id = $1`
                params.push(input.deploymentId)
            }

            query += ` ORDER BY created_at DESC LIMIT 50`

            const result = await ctx.db.query(query, params)
            if (!result || !result.rows) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No rollback history found' })
            }

            return result.rows
        } catch (err) {
            if (err instanceof TRPCError) throw err
            console.error('[deploy.getRollbackHistory] Error:', err)
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch rollback history', cause: err as Error })
        }
    })

export const trackCost = secureProcedure('deploy.trackCost')
    .input(z.object({
        deploymentId: z.string(),
        projectId: z.string(),
        environmentId: z.string(),
        providerId: z.string(),
        hourlyRate: z.number(),
        monthlyEstimate: z.number(),
        breakdown: z.record(z.string(), z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
        try {
            const result = await ctx.db.query(
                `INSERT INTO cost_estimates (
          project_id, environment_id, provider_id, deployment_id,
          hourly_rate, monthly_estimate, breakdown, start_date, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id`,
                [
                    input.projectId,
                    input.environmentId,
                    input.providerId,
                    input.deploymentId,
                    input.hourlyRate,
                    input.monthlyEstimate,
                    JSON.stringify(input.breakdown)
                ]
            ).catch((err: any) => {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to track cost', cause: err })
            })

            return { costId: result.rows[0].id }
        } catch (err) {
            if (err instanceof TRPCError) throw err
            console.error('[deploy.trackCost] Error:', err)
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to track deployment cost', cause: err as Error })
        }
    })

export const getCostHistory = secureProcedure('deploy.getCostHistory')
    .input(z.object({
        projectId: z.string(),
        environmentId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
        try {
            let query = `SELECT * FROM cost_estimates WHERE project_id = $1`
            const params: any[] = [input.projectId]

            if (input.environmentId) {
                params.push(input.environmentId)
                query += ` AND environment_id = $${params.length}`
            }

            if (input.startDate) {
                params.push(input.startDate)
                query += ` AND start_date >= $${params.length}`
            }

            if (input.endDate) {
                params.push(input.endDate)
                query += ` AND start_date <= $${params.length}`
            }

            query += ` ORDER BY start_date DESC LIMIT 100`

            const result = await ctx.db.query(query, params).catch((err: any) => {
                if (err?.message?.includes('cost_estimates')) {
                    return { rows: [] }
                }
                throw err
            })

            const costs = result?.rows || []
            const totalMonthly = costs.reduce((sum: number, c: any) => sum + parseFloat(c.monthly_estimate || 0), 0)

            return {
                costs,
                totalMonthly,
                currency: 'USD',
            }
        } catch (err) {
            console.error('[deploy.getCostHistory] Error:', err)
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch cost history', cause: err as Error })
        }
    })
