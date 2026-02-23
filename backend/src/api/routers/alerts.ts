import { router } from '../../trpc'
import { secureProcedure } from '../trpc/middlewares/security'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createHmac } from 'crypto'
import logger from '../../lib/logger'

const alertsLogger = logger.child({ module: 'alerts' })

/**
 * Alerting & Notifications Router
 * 
 * Manage alerts and notification channels:
 * - Metric-based alerts (CPU, memory, error rate)
 * - Deployment notifications
 * - Health check failures
 * - Webhook integrations (Slack, Discord, Email, PagerDuty)
 */

export const alertsRouter = router({
  // Create alert rule
  createRule: secureProcedure('alerts.createRule')
    .input(z.object({
      projectId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      ruleType: z.enum(['metric', 'deployment', 'healthcheck', 'custom']),
      events: z.array(z.string()).optional(), // e.g., ['DEPLOYMENT_STARTED', 'DEPLOYMENT_SUCCESS']
      condition: z.object({
        metric: z.string().optional(), // e.g., 'cpu_usage', 'error_rate'
        operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
        threshold: z.number(),
        duration: z.number().optional(), // seconds
      }),
      severity: z.enum(['critical', 'warning', 'info']),
      notificationChannelIds: z.array(z.string()),
      enabled: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `INSERT INTO alert_rules (
            project_id, name, description, rule_type, events, condition,
            severity, notification_channels, enabled, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          RETURNING id`,
          [
            input.projectId,
            input.name,
            input.description || '',
            input.ruleType,
            JSON.stringify(input.events || []),
            JSON.stringify(input.condition),
            input.severity,
            JSON.stringify(input.notificationChannelIds),
            input.enabled,
          ]
        ).catch((err: any) => {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create alert rule', cause: err })
        })

        return {
          success: true,
          ruleId: result.rows[0].id,
          message: 'Alert rule created',
        }
      } catch (err) {
        alertsLogger.error({ err, input }, '[alerts.createRule] Failed to create alert rule')
        throw err
      }
    }),

  // List alert rules
  listRules: secureProcedure('alerts.listRules')
    .input(z.object({
      projectId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `SELECT * FROM alert_rules
           WHERE project_id = $1
           ORDER BY created_at DESC`,
          [input.projectId]
        ).catch((err: any) => {
          if (err?.message?.includes('alert_rules')) {
            return { rows: [] }
          }
          throw err
        })

        return result?.rows || []
      } catch (err) {
        alertsLogger.error({ err, input }, '[alerts.listRules] Failed to fetch alert rules')
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch alert rules', cause: err as Error })
      }
    }),

  // Create notification channel
  createChannel: secureProcedure('alerts.createChannel')
    .input(z.object({
      projectId: z.string(),
      name: z.string(),
      type: z.enum(['slack', 'discord', 'email', 'webhook', 'pagerduty', 'teams']),
      config: z.object({
        webhookUrl: z.string().optional(),
        webhookSecret: z.string().optional(),
        email: z.string().optional(),
        integrationKey: z.string().optional(),
      }),
      enabled: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `INSERT INTO notification_channels (
            project_id, name, type, config, enabled, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id`,
          [
            input.projectId,
            input.name,
            input.type,
            JSON.stringify(input.config),
            input.enabled,
          ]
        ).catch((err: any) => {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create notification channel', cause: err })
        })

        return {
          success: true,
          channelId: result.rows[0].id,
          message: 'Notification channel created',
        }
      } catch (err) {
        alertsLogger.error({ err, input }, '[alerts.createChannel] Failed to create notification channel')
        throw err
      }
    }),

  // List notification channels
  listChannels: secureProcedure('alerts.listChannels')
    .input(z.object({
      projectId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `SELECT * FROM notification_channels
           WHERE project_id = $1
           ORDER BY created_at DESC`,
          [input.projectId]
        ).catch((err: any) => {
          if (err?.message?.includes('notification_channels')) {
            return { rows: [] }
          }
          throw err
        })

        return result?.rows || []
      } catch (err) {
        alertsLogger.error({ err, input }, '[alerts.listChannels] Failed to fetch notification channels')
        return []
      }
    }),

  // Test notification channel
  testChannel: secureProcedure('alerts.testChannel')
    .input(z.object({
      channelId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `SELECT * FROM notification_channels WHERE id = $1`,
          [input.channelId]
        ).catch((err) => {
          alertsLogger.error({ err, channelId: input.channelId }, 'Failed to fetch notification channel for testing')
          return { rows: [] }
        })

        if (!result?.rows?.[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification channel not found' })
        }

        const channel = result.rows[0]
        const config = typeof channel.config === 'string'
          ? JSON.parse(channel.config)
          : channel.config

        await sendNotification({
          type: channel.type,
          config,
          message: {
            title: 'Test Notification',
            body: 'This is a test notification from Sarge',
            severity: 'info',
            timestamp: new Date().toISOString(),
          },
        })

        return {
          success: true,
          message: 'Test notification sent',
        }
      } catch (err) {
        if (err instanceof TRPCError) throw err
        alertsLogger.error({ err, input }, '[alerts.testChannel] Failed to test notification channel')
        throw err
      }
    }),

  // Trigger alert (internal use)
  triggerAlert: secureProcedure('alerts.trigger')
    .input(z.object({
      ruleId: z.string(),
      value: z.number(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get rule config
        const rule = await ctx.db.query(
          `SELECT * FROM alert_rules WHERE id = $1 AND enabled = true`,
          [input.ruleId]
        ).catch((err) => {
          alertsLogger.error({ err, ruleId: input.ruleId }, 'Failed to fetch alert rule for trigger')
          return { rows: [] }
        })

        if (!rule?.rows?.[0]) {
          return { success: false, message: 'Rule not found or disabled' }
        }

        const ruleConfig = rule.rows[0]
        const condition = typeof ruleConfig.condition === 'string'
          ? JSON.parse(ruleConfig.condition)
          : ruleConfig.condition

        // Check if condition is met
        const conditionMet = evaluateCondition(input.value, condition)

        if (!conditionMet) {
          return { success: false, message: 'Condition not met' }
        }

        // Create alert instance
        const alertResult = await ctx.db.query(
          `INSERT INTO alert_instances (
            rule_id, triggered_at, value, message, status, resolved_at
          ) VALUES ($1, NOW(), $2, $3, 'firing', NULL)
          RETURNING id`,
          [input.ruleId, input.value, input.message]
        ).catch((err: any) => {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to trigger alert', cause: err })
        })

        const alertId = alertResult.rows[0].id

        // Send notifications
        const channels = typeof ruleConfig.notification_channels === 'string'
          ? JSON.parse(ruleConfig.notification_channels)
          : ruleConfig.notification_channels

        for (const channelId of channels) {
          const channelResult = await ctx.db.query(
            `SELECT * FROM notification_channels WHERE id = $1 AND enabled = true`,
            [channelId]
          ).catch((err) => {
            alertsLogger.error({ err, channelId }, 'Failed to fetch channel for notification')
            return { rows: [] }
          })

          if (channelResult?.rows?.[0]) {
            const channel = channelResult.rows[0]
            const config = typeof channel.config === 'string'
              ? JSON.parse(channel.config)
              : channel.config

            await sendNotification({
              type: channel.type,
              config,
              message: {
                title: `🚨 Alert: ${ruleConfig.name}`,
                body: input.message,
                severity: ruleConfig.severity,
                timestamp: new Date().toISOString(),
                alertId,
                projectId: ruleConfig.project_id,
              },
            }).catch((e) => alertsLogger.error({ err: e, channelId }, 'Failed to send notification to channel'))
          }
        }

        return {
          success: true,
          alertId,
          message: 'Alert triggered and notifications sent',
        }
      } catch (err) {
        alertsLogger.error({ err, input }, '[alerts.trigger] Failed to trigger alert')
        throw err
      }
    }),

  // List active alerts
  listActive: secureProcedure('alerts.listActive')
    .input(z.object({
      projectId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.query(
          `SELECT ai.*, ar.name as rule_name, ar.severity
           FROM alert_instances ai
           JOIN alert_rules ar ON ai.rule_id = ar.id
           WHERE ar.project_id = $1 AND ai.status = 'firing'
           ORDER BY ai.triggered_at DESC`,
          [input.projectId]
        ).catch((err: any) => {
          if (err?.message?.includes('alert_instances')) {
            return { rows: [] }
          }
          throw err
        })

        return result?.rows || []
      } catch (err) {
        alertsLogger.error({ err, input }, '[alerts.listActive] Failed to fetch active alerts')
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch active alerts', cause: err as Error })
      }
    }),

  // Resolve alert
  resolve: secureProcedure('alerts.resolve')
    .input(z.object({
      alertId: z.string(),
      resolvedBy: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.query(
          `UPDATE alert_instances 
           SET status = 'resolved', resolved_at = NOW()
           WHERE id = $1`,
          [input.alertId]
        ).catch((err) => {
          throw new Error(`DB error: ${err.message}`)
        })

        return {
          success: true,
          message: 'Alert resolved',
        }
      } catch (err) {
        alertsLogger.error({ err, input }, '[alerts.resolve] Failed to resolve alert')
        throw err
      }
    }),
})

// Helper functions

function evaluateCondition(value: number, condition: any): boolean {
  const { operator, threshold } = condition

  switch (operator) {
    case 'gt': return value > threshold
    case 'gte': return value >= threshold
    case 'lt': return value < threshold
    case 'lte': return value <= threshold
    case 'eq': return value === threshold
    default: return false
  }
}

async function sendNotification(params: {
  type: string
  config: any
  message: any
}): Promise<void> {
  const { type, config, message } = params

  try {
    if (type === 'slack' && config.webhookUrl) {
      await sendSlackNotification(config.webhookUrl, message)
    } else if (type === 'discord' && config.webhookUrl) {
      await sendDiscordNotification(config.webhookUrl, message)
    } else if (type === 'email' && config.email) {
      await sendEmailNotification(config.email, message)
    } else if (type === 'webhook' && config.webhookUrl) {
      await sendWebhookNotification(config.webhookUrl, message, config.webhookSecret)
    } else if (type === 'teams' && config.webhookUrl) {
      await sendTeamsNotification(config.webhookUrl, message)
    } else if (type === 'pagerduty' && config.integrationKey) {
      await sendPagerDutyAlert(config.integrationKey, message)
    }
  } catch (err) {
    alertsLogger.error({ err, type }, '[sendNotification] Error sending notification')
    throw err
  }
}

async function sendSlackNotification(webhookUrl: string, message: any): Promise<void> {
  const color = message.severity === 'critical' ? '#ff0000' : message.severity === 'warning' ? '#ffaa00' : '#00ff00'

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: message.title,
      attachments: [{
        color,
        text: message.body,
        footer: `Sarge • ${message.timestamp}`,
      }],
    }),
  })
}

async function sendDiscordNotification(webhookUrl: string, message: any): Promise<void> {
  const color = message.severity === 'critical' ? 16711680 : message.severity === 'warning' ? 16753920 : 65280

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: message.title,
        description: message.body,
        color,
        timestamp: message.timestamp,
      }],
    }),
  })
}

async function sendTeamsNotification(webhookUrl: string, message: any): Promise<void> {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      '@type': 'MessageCard',
      title: message.title,
      text: message.body,
      themeColor: message.severity === 'critical' ? 'FF0000' : message.severity === 'warning' ? 'FFAA00' : '00FF00',
    }),
  })
}

async function sendWebhookNotification(webhookUrl: string, message: any, secret?: string): Promise<void> {
  const payload = JSON.stringify(message)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (secret) {
    const signature = createHmac('sha256', secret).update(payload).digest('hex')
    headers['Sarge-Signature'] = signature
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: payload,
  })
}

async function sendEmailNotification(email: string, message: any): Promise<void> {
  // Placeholder - integrate with SendGrid, SES, etc.
  alertsLogger.info({ email, message }, '[sendEmailNotification] Virtual email notification sent');
}

async function sendPagerDutyAlert(integrationKey: string, message: any): Promise<void> {
  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routing_key: integrationKey,
      event_action: 'trigger',
      payload: {
        summary: message.title,
        severity: message.severity,
        source: 'sarge',
        custom_details: { body: message.body },
      },
    }),
  })
}
