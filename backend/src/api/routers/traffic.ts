import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { getProvider } from '../lib/providers'
import { getProviderCredentials } from '../lib/credentials'

/**
 * Traffic Management Router
 * 
 * Handles advanced deployment strategies:
 * - Blue/Green deployments
 * - Canary deployments
 * - Traffic splitting
 * - A/B testing
 */
import { DeploymentStrategies } from '../../services/deployment-strategies'

const deploymentStrategies = new DeploymentStrategies()

export const trafficRouter = router({
  // Create blue/green deployment config
  createBlueGreen: secureProcedure('traffic.create')
    .input(z.object({
      deploymentId: z.string(),
      strategy: z.literal('blue-green'),
      config: z.object({
        blueWeight: z.number().min(0).max(100),
        greenWeight: z.number().min(0).max(100),
        switchDuration: z.number().default(60), // seconds
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `INSERT INTO traffic_configs (
            deployment_id, strategy_type, blue_weight, green_weight,
            switch_duration_sec, is_active, created_at
          ) VALUES ($1, $2, $3, $4, $5, true, NOW())
          RETURNING id`,
          [
            input.deploymentId,
            input.strategy,
            input.config.blueWeight,
            input.config.greenWeight,
            input.config.switchDuration,
          ]
        ).catch((err: any) => {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create blue/green config', cause: err })
        })

        return {
          success: true,
          trafficConfigId: result.rows[0].id,
          message: 'Blue/Green configuration created',
        }
      } catch (err) {
        console.error('[traffic.createBlueGreen] Error:', err)
        throw err
      }
    }),

  // Create canary deployment config
  createCanary: secureProcedure('traffic.create')
    .input(z.object({
      deploymentId: z.string(),
      strategy: z.literal('canary'),
      config: z.object({
        canaryWeight: z.number().min(0).max(100),
        stableWeight: z.number().min(0).max(100),
        incrementStep: z.number().min(1).max(50).default(10),
        intervalMinutes: z.number().min(1).max(60).default(5),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `INSERT INTO traffic_configs (
            deployment_id, strategy_type, canary_weight, stable_weight,
            increment_step, interval_minutes, is_active, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
          RETURNING id`,
          [
            input.deploymentId,
            input.strategy,
            input.config.canaryWeight,
            input.config.stableWeight,
            input.config.incrementStep,
            input.config.intervalMinutes,
          ]
        ).catch((err: any) => {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create canary config', cause: err })
        })

        return {
          success: true,
          trafficConfigId: result.rows[0].id,
          message: 'Canary configuration created',
        }
      } catch (err) {
        console.error('[traffic.createCanary] Error:', err)
        throw err
      }
    }),

  // Execute blue/green switch
  executeBlueGreenSwitch: secureProcedure('traffic.execute')
    .input(z.object({
      trafficConfigId: z.string(),
      targetColor: z.enum(['blue', 'green']),
      providerId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Get config
        const config = await ctx.db.query(
          `SELECT * FROM traffic_configs WHERE id = $1`,
          [input.trafficConfigId]
        ).catch(() => ({ rows: [] }))

        if (!config?.rows?.[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Traffic config not found' })
        }

        const currentConfig = config.rows[0]

        // 2. Trigger provider-level switch via DeploymentStrategies
        const provider = getProvider(input.providerId)
        if (provider) {
          await deploymentStrategies.promote(currentConfig.deployment_id, provider)
        }

        // 3. Update DB state
        const newBlueWeight = input.targetColor === 'blue' ? 100 : 0
        const newGreenWeight = input.targetColor === 'green' ? 100 : 0

        await ctx.db.query(
          `UPDATE traffic_configs
           SET blue_weight = $1, green_weight = $2, last_switched_at = NOW()
           WHERE id = $3`,
          [newBlueWeight, newGreenWeight, input.trafficConfigId]
        )

        // Audit log
        await ctx.db.query(
          `INSERT INTO audit_logs (
            user_id, action_type, resource_type, resource_id,
            metadata, created_at
          ) VALUES ($1, 'traffic_switch', 'traffic_config', $2, $3, NOW())`,
          [
            (ctx as any).userId || 'system',
            input.trafficConfigId,
            JSON.stringify({
              fromColor: currentConfig.blue_weight > 50 ? 'blue' : 'green',
              toColor: input.targetColor,
              previousBlue: currentConfig.blue_weight,
              previousGreen: currentConfig.green_weight,
            }),
          ]
        ).catch(() => { })

        return {
          success: true,
          message: `Traffic switched to ${input.targetColor}`,
        }
      } catch (err) {
        console.error('[traffic.executeBlueGreenSwitch] Error:', err)
        throw err
      }
    }),

  // Increment canary traffic
  incrementCanary: secureProcedure('traffic.execute')
    .input(z.object({
      trafficConfigId: z.string(),
      providerId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const config = await ctx.db.query(
          `SELECT * FROM traffic_configs WHERE id = $1`,
          [input.trafficConfigId]
        ).catch(() => ({ rows: [] }))

        if (!config?.rows?.[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Traffic config not found' })
        }

        const current = config.rows[0]

        // Trigger promotion via DeploymentStrategies
        const provider = getProvider(input.providerId)
        if (provider) {
          await deploymentStrategies.promote(current.deployment_id, provider)
        }

        const newCanaryWeight = Math.min(100, current.canary_weight + current.increment_step)
        const newStableWeight = 100 - newCanaryWeight

        await ctx.db.query(
          `UPDATE traffic_configs
           SET canary_weight = $1, stable_weight = $2, last_switched_at = NOW()
           WHERE id = $3`,
          [newCanaryWeight, newStableWeight, input.trafficConfigId]
        )

        const isComplete = newCanaryWeight >= 100

        return {
          success: true,
          canaryWeight: newCanaryWeight,
          stableWeight: newStableWeight,
          isComplete,
          message: isComplete
            ? 'Canary deployment complete'
            : `Canary traffic increased to ${newCanaryWeight}%`,
        }
      } catch (err) {
        console.error('[traffic.incrementCanary] Error:', err)
        throw err
      }
    }),

  // Rollback canary deployment
  rollbackCanary: secureProcedure('traffic.execute')
    .input(z.object({
      trafficConfigId: z.string(),
      providerId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const config = await ctx.db.query(
          `SELECT * FROM traffic_configs WHERE id = $1`,
          [input.trafficConfigId]
        ).catch(() => ({ rows: [] }))

        if (config?.rows?.[0]) {
          const current = config.rows[0]
          const provider = getProvider(input.providerId)
          if (provider) {
            await deploymentStrategies.rollback(current.deployment_id, provider)
          }
        }

        await ctx.db.query(
          `UPDATE traffic_configs
           SET canary_weight = 0, stable_weight = 100, is_active = false
           WHERE id = $1`,
          [input.trafficConfigId]
        )

        return {
          success: true,
          message: 'Canary deployment rolled back to stable',
        }
      } catch (err) {
        console.error('[traffic.rollbackCanary] Error:', err)
        throw err
      }
    }),

  // Get traffic config
  get: secureProcedure('traffic.get')
    .input(z.object({
      deploymentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `SELECT * FROM traffic_configs 
           WHERE deployment_id = $1 AND is_active = true
           ORDER BY created_at DESC
           LIMIT 1`,
          [input.deploymentId]
        )

        return result?.rows?.[0] || null
      } catch (err) {
        console.error('[traffic.get] Error:', err)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch traffic config', cause: err as Error })
      }
    }),

  // List all traffic configs for a project
  list: secureProcedure('traffic.list')
    .input(z.object({
      projectId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `SELECT tc.*, d.project_id 
           FROM traffic_configs tc
           JOIN deployments d ON tc.deployment_id = d.id
           WHERE d.project_id = $1
           ORDER BY tc.created_at DESC
           LIMIT 50`,
          [input.projectId]
        )

        if (!result || !result.rows) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No traffic configs found' })
        }

        return result.rows
      } catch (err) {
        console.error('[traffic.list] Error:', err)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch traffic configs', cause: err as Error })
      }
    }),
})
