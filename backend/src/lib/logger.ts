import pino from 'pino'

/**
 * Structured logger for the SARGE backend.
 * - JSON output in production for log aggregation
 * - Pretty-printed in development for readability
 * - Named child loggers for each module
 */
const logger = pino({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino/file', options: { destination: 1 } }
        : undefined,
    formatters: {
        level(label) {
            return { level: label }
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
})

export default logger

// Pre-configured child loggers for common modules
export const wsLogger = logger.child({ module: 'ws' })
export const dbLogger = logger.child({ module: 'db' })
export const authLogger = logger.child({ module: 'auth' })
export const metricsLogger = logger.child({ module: 'metrics' })
export const securityLogger = logger.child({ module: 'security' })
export const deployLogger = logger.child({ module: 'deploy' })
export const providerLogger = logger.child({ module: 'provider' })
export const scannerLogger = logger.child({ module: 'scanner' })
export const aiLogger = logger.child({ module: 'ai' })
export const credLogger = logger.child({ module: 'credentials' })
