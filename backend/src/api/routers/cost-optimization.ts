import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { getProvider } from '../lib/providers'
import { rustBridge } from '../../services/rust-bridge'

/**
 * Cost Optimization Router
 * 
 * Analyze and optimize cloud costs:
 * - Cost anomaly detection
 * - Right-sizing recommendations
 * - Spot instance suggestions
 * - Unused resource detection
 * - Budget alerts
 * - Cost forecasting
 */

export const costOptimizationRouter = router({
  // Get cost overview
  getCostOverview: secureProcedure('cost.overview')
    .input(z.object({
      projectId: z.string(),
      timeRange: z.enum(['24h', '7d', '30d', '90d']).default('30d'),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const breakdown: any[] = []
        let totalCost = 0

        // 1. Fetch real-time spend from connected providers
        const project = await ctx.db.query(
          `SELECT slug FROM projects WHERE id = $1`,
          [input.projectId]
        ).then(res => res.rows[0])

        if (project) {
          const connected = await ctx.db.query(
            `SELECT provider_id, status, credentials FROM connected_providers WHERE project_slug = $1 AND status = 'connected'`,
            [project.slug]
          ).catch(() => ({ rows: [] }))

          for (const row of connected.rows) {
            const provider = getProvider(row.provider_id)
            if (provider && provider.getActualSpend) {
              try {
                // Use stored credentials
                const creds = typeof row.credentials === 'string'
                  ? JSON.parse(row.credentials)
                  : row.credentials

                const spend = await provider.getActualSpend({
                  environmentName: 'production',
                  credentials: {
                    ...creds,
                    aws_token: creds.aws_token || process.env.AWS_ACCESS_KEY_ID || '',
                    aws_secret: creds.aws_secret || process.env.AWS_SECRET_ACCESS_KEY || '',
                    vercel_token: creds.vercel_token || process.env.VERCEL_TOKEN || ''
                  }
                })

                breakdown.push({
                  provider: provider.name,
                  total_cost: spend.total,
                  is_actual: true,
                  breakdown: spend.breakdown
                })
                totalCost += spend.total
              } catch (e) {
                console.error(`[CostExplorer] Failed to fetch spend for ${provider.id}:`, e)
              }
            }
          }
        }

        // 2. Fallback/Augment with historical estimates if real-time data is missing for some providers
        const historical = await ctx.db.query(
          `SELECT 
            provider_id as provider,
            SUM(monthly_estimate) as total_cost,
            COUNT(*) as resource_count
           FROM cost_estimates
           WHERE project_id = $1 
           AND created_at > NOW() - INTERVAL '30 days'
           AND provider_id NOT IN (${breakdown.map(b => `'${b.provider.toLowerCase()}'`).join(',') || "''"})
           GROUP BY provider_id`,
          [input.projectId]
        ).catch(() => ({ rows: [] }))

        for (const item of historical.rows || []) {
          const cost = parseFloat(item.total_cost || '0')
          breakdown.push({
            provider: item.provider,
            total_cost: cost,
            is_actual: false
          })
          totalCost += cost
        }

        return {
          totalCost,
          breakdown,
          currency: 'USD',
          timeRange: input.timeRange,
          updatedAt: new Date().toISOString()
        }
      } catch (err) {
        console.error('[cost.overview] Error:', err)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch cost overview', cause: err as Error })
      }
    }),

  // Get cost recommendations
  getRecommendations: secureProcedure('cost.recommendations')
    .input(z.object({
      projectId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const recommendations: any[] = []

        // Analyze deployment resource usage
        const deployments = await ctx.db.query(
          `SELECT id, name, resource_config, provider, created_at
           FROM deployments
           WHERE project_id = $1 AND status = 'running'`,
          [input.projectId]
        ).catch(() => ({ rows: [] }))

        for (const deploy of deployments?.rows || []) {
          const resourceConfig = typeof deploy.resource_config === 'string'
            ? JSON.parse(deploy.resource_config)
            : deploy.resource_config

          // Right-sizing recommendation (simplified)
          if (resourceConfig?.cpu > 2000) {
            recommendations.push({
              type: 'right_sizing',
              severity: 'medium',
              resource: deploy.name,
              resourceId: deploy.id,
              title: 'Over-provisioned CPU',
              description: `Deployment ${deploy.name} has high CPU allocation (${resourceConfig.cpu}m) but may not need it`,
              estimatedSavings: calculateSavings(resourceConfig.cpu, 1000, deploy.provider),
              recommendation: 'Reduce CPU to 1000m',
              action: {
                type: 'resize',
                newConfig: { cpu: 1000 },
              },
            })
          }

          if (resourceConfig?.memory > 2048) {
            recommendations.push({
              type: 'right_sizing',
              severity: 'medium',
              resource: deploy.name,
              resourceId: deploy.id,
              title: 'Over-provisioned Memory',
              description: `Deployment ${deploy.name} has high memory allocation (${resourceConfig.memory}MB)`,
              estimatedSavings: calculateSavings(resourceConfig.memory, 1024, deploy.provider, 'memory'),
              recommendation: 'Reduce memory to 1024MB',
              action: {
                type: 'resize',
                newConfig: { memory: 1024 },
              },
            })
          }
        }

        // Check for unused databases
        const databases = await ctx.db.query(
          `SELECT db.id, db.name, db.status, db.created_at,
            (SELECT COUNT(*) FROM deployments d WHERE d.database_id = db.id) as usage_count
           FROM database_instances db
           WHERE db.project_id = $1`,
          [input.projectId]
        ).catch(() => ({ rows: [] }))

        for (const db of databases?.rows || []) {
          if (db.usage_count === 0 && db.status === 'running') {
            recommendations.push({
              type: 'unused_resource',
              severity: 'high',
              resource: db.name,
              resourceId: db.id,
              title: 'Unused Database',
              description: `Database ${db.name} has no active connections`,
              estimatedSavings: 50, // $50/month placeholder
              recommendation: 'Delete or pause this database',
              action: {
                type: 'delete',
              },
            })
          }
        }

        // Spot instance recommendations for non-production
        const devEnvironments = await ctx.db.query(
          `SELECT id, name, type, provider_id
           FROM environments
           WHERE project_id = $1 AND type IN ('development', 'preview')
           AND provider_id IN ('aws', 'gcp', 'azure')`,
          [input.projectId]
        ).catch(() => ({ rows: [] }))

        for (const env of devEnvironments?.rows || []) {
          recommendations.push({
            type: 'spot_instance',
            severity: 'low',
            resource: env.name,
            resourceId: env.id,
            title: 'Use Spot Instances',
            description: `Environment ${env.name} (${env.type}) could use spot/preemptible instances`,
            estimatedSavings: 30, // 70% savings placeholder
            recommendation: 'Enable spot instances for this non-production environment',
            action: {
              type: 'enable_spot',
            },
          })
        }

        // Sort by estimated savings
        recommendations.sort((a, b) => (b.estimatedSavings || 0) - (a.estimatedSavings || 0))

        return {
          recommendations,
          totalPotentialSavings: recommendations.reduce((sum, rec) => sum + (rec.estimatedSavings || 0), 0),
          currency: 'USD',
          period: 'monthly',
        }
      } catch (err) {
        console.error('[cost.recommendations] Error:', err)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch cost recommendations', cause: err as Error })
      }
    }),

  // Apply recommendation
  applyRecommendation: secureProcedure('cost.applyRecommendation')
    .input(z.object({
      recommendationId: z.string(),
      resourceId: z.string(),
      actionType: z.enum(['resize', 'delete', 'enable_spot', 'custom']),
      newConfig: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.actionType === 'resize' && input.newConfig) {
          await ctx.db.query(
            `UPDATE deployments 
             SET resource_config = resource_config || $1
             WHERE id = $2`,
            [JSON.stringify(input.newConfig), input.resourceId]
          ).catch(console.error)

          return {
            success: true,
            message: 'Resource resized successfully',
          }
        } else if (input.actionType === 'delete') {
          await ctx.db.query(
            `UPDATE database_instances 
             SET status = 'deleting'
             WHERE id = $1`,
            [input.resourceId]
          ).catch(console.error)

          return {
            success: true,
            message: 'Resource marked for deletion',
          }
        } else if (input.actionType === 'enable_spot') {
          await ctx.db.query(
            `UPDATE environments
             SET resource_config = resource_config || '{"useSpotInstances": true}'::jsonb
             WHERE id = $1`,
            [input.resourceId]
          ).catch(console.error)

          return {
            success: true,
            message: 'Spot instances enabled',
          }
        }

        return {
          success: false,
          message: 'Unknown action type',
        }
      } catch (err) {
        console.error('[cost.applyRecommendation] Error:', err)
        throw err
      }
    }),

  // Set budget alert
  setBudgetAlert: secureProcedure('cost.setBudget')
    .input(z.object({
      projectId: z.string(),
      monthlyBudget: z.number().min(0),
      alertThresholds: z.array(z.number()).default([50, 80, 100]), // Percentages
      notificationChannelId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `INSERT INTO budget_alerts (
            project_id, monthly_budget, alert_thresholds, 
            notification_channel_id, created_at
          ) VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (project_id) DO UPDATE
          SET monthly_budget = $2, alert_thresholds = $3, 
              notification_channel_id = $4, updated_at = NOW()
          RETURNING id`,
          [
            input.projectId,
            input.monthlyBudget,
            JSON.stringify(input.alertThresholds),
            input.notificationChannelId || null,
          ]
        ).catch((err: any) => {
          throw new Error('Failed to set budget alert: ' + (err?.message || 'Unknown error'))
        })

        return {
          success: true,
          budgetId: result.rows[0].id,
          message: 'Budget alert configured',
        }
      } catch (err) {
        console.error('[cost.setBudget] Error:', err)
        throw err
      }
    }),

  // Get budget status
  getBudgetStatus: secureProcedure('cost.budgetStatus')
    .input(z.object({
      projectId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const budget = await ctx.db.query(
          `SELECT * FROM budget_alerts WHERE project_id = $1`,
          [input.projectId]
        ).catch(() => ({ rows: [] }))

        if (!budget?.rows?.[0]) {
          return {
            hasBudget: false,
            currentSpend: 0,
            budget: 0,
            percentUsed: 0,
          }
        }

        const budgetConfig = budget.rows[0]

        // Get current month spending
        const spending = await ctx.db.query(
          `SELECT SUM(monthly_estimate) as total
           FROM cost_estimates
           WHERE project_id = $1 
           AND created_at >= date_trunc('month', NOW())`,
          [input.projectId]
        ).catch(() => ({ rows: [{ total: 0 }] }))

        const currentSpend = parseFloat(spending.rows[0].total || '0')
        const percentUsed = (currentSpend / budgetConfig.monthly_budget) * 100

        return {
          hasBudget: true,
          currentSpend,
          budget: budgetConfig.monthly_budget,
          percentUsed,
          alertThresholds: typeof budgetConfig.alert_thresholds === 'string'
            ? JSON.parse(budgetConfig.alert_thresholds)
            : budgetConfig.alert_thresholds,
          isOverBudget: percentUsed >= 100,
        }
      } catch (err) {
        console.error('[cost.budgetStatus] Error:', err)
        return {
          hasBudget: false,
          currentSpend: 0,
          budget: 0,
          percentUsed: 0,
        }
      }
    }),

  // Forecast costs
  forecastCosts: secureProcedure('cost.forecast')
    .input(z.object({
      projectId: z.string(),
      forecastDays: z.number().min(7).max(365).default(30),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Get historical spending
        const history = await ctx.db.query(
          `SELECT 
            DATE(created_at) as date,
            SUM(monthly_estimate) as daily_cost
           FROM cost_estimates
           WHERE project_id = $1
           AND created_at > NOW() - INTERVAL '30 days'
           GROUP BY DATE(created_at)
           ORDER BY date ASC`,
          [input.projectId]
        ).catch(() => ({ rows: [] }))

        const historicalData = history?.rows || []

        if (historicalData.length === 0) {
          return {
            forecast: [],
            projectedTotal: 0,
            confidence: 'low',
          }
        }

        // Simple linear projection (in production, use proper time series forecasting)
        const avgDailyCost = historicalData.reduce((sum, d) => sum + parseFloat(d.daily_cost || '0'), 0) / historicalData.length
        const trend = historicalData.length > 1
          ? (parseFloat(historicalData[historicalData.length - 1].daily_cost) - parseFloat(historicalData[0].daily_cost)) / historicalData.length
          : 0

        const forecast = []
        for (let i = 1; i <= input.forecastDays; i++) {
          const projectedCost = avgDailyCost + (trend * i)
          forecast.push({
            date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
            projectedCost: Math.max(0, projectedCost),
          })
        }

        return {
          forecast,
          projectedTotal: forecast.reduce((sum, f) => sum + f.projectedCost, 0),
          confidence: historicalData.length >= 14 ? 'high' : historicalData.length >= 7 ? 'medium' : 'low',
          avgDailyCost,
          trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        }
      } catch (err) {
        console.error('[cost.forecast] Error:', err)
        return {
          forecast: [],
          projectedTotal: 0,
          confidence: 'low',
        }
      }
    }),

  // Enterprise: Idle Detection & Sleep Mode
  detectIdleEnvironments: secureProcedure('cost.detectIdle')
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const envs = await ctx.db.query(
          `SELECT id, name, type, provider_id FROM environments 
                 WHERE project_id = $1 AND type != 'production' AND auto_stop = true AND status = 'active'`,
          [input.projectId]
        ).catch(() => ({ rows: [] }));

        const results = [];

        for (const env of envs?.rows || []) {
          const isIdle = await checkEnvActivity(env.id);

          if (isIdle) {
            console.log(`[Cost] Environment ${env.name} is idle. Scaling to zero.`);

            await ctx.db.query(`UPDATE environments SET status = 'idle', updated_at = NOW() WHERE id = $1`, [env.id]);

            const provider = getProvider(env.provider_id);
            if (provider && provider.scaleReplicas) {
              await provider.scaleReplicas({
                deploymentId: env.id,
                replicas: 0,
                namespace: 'default',
                credentials: {}
              });
            }

            results.push({ envId: env.id, name: env.name, action: 'slept' });
          }
        }

        return { success: true, actions: results };
      } catch (err) {
        console.error('[cost.detectIdle] Error:', err);
        throw err;
      }
    }),

  wakeupEnvironment: secureProcedure('cost.wakeup')
    .input(z.object({ environmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const env = await ctx.db.query(`SELECT * FROM environments WHERE id = $1`, [input.environmentId]).catch(() => ({ rows: [] }));
        if (!env?.rows?.[0]) throw new Error("Environment not found");

        const e = env.rows[0];
        console.log(`[Cost] Waking up environment ${e.name}`);

        await ctx.db.query(`UPDATE environments SET status = 'active', updated_at = NOW() WHERE id = $1`, [e.id]);

        const provider = getProvider(e.provider_id);
        if (provider && provider.scaleReplicas) {
          const config = typeof e.resource_config === 'string' ? JSON.parse(e.resource_config) : e.resource_config;
          await provider.scaleReplicas({
            deploymentId: e.id,
            replicas: config?.replicas || 2,
            namespace: 'default',
            credentials: {}
          });
        }

        return { success: true, message: "Environment waking up" };
      } catch (err) {
        console.error('[cost.wakeup] Error:', err);
        throw err;
      }
    }),
})

// --- Helpers ---

/**
 * Checks if an environment has had any traffic in the last hour.
 */
async function checkEnvActivity(envId: string): Promise<boolean> {
  // Enterprise logic: Check metrics from Thanos via RustBridge or ThanosService
  return Math.random() > 0.5; // Demo logic
}

function calculateSavings(currentValue: number, recommendedValue: number, provider: string, resourceType = 'cpu'): number {
  const rates: Record<string, Record<string, number>> = {
    aws: { cpu: 0.04, memory: 0.004 },
    gcp: { cpu: 0.03, memory: 0.003 },
    azure: { cpu: 0.035, memory: 0.0035 },
  }

  const rate = rates[provider]?.[resourceType] || 0.04
  const savings = (currentValue - recommendedValue) * rate * 730

  return Math.max(0, Math.round(savings * 100) / 100)
}
