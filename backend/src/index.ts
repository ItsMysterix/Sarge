import { startMetricsServer } from './http/metrics-server'
import './ws-server'
import logger from './lib/logger'

// [CTO T3] Graceful crash handling — prevent silent deaths from unhandled errors
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — shutting down')
  process.exit(1)
})
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection')
  process.exit(1)
})

// Start metrics server; port via env (METRICS_PORT)
if (process.env.METRICS_ENABLE !== 'false' && process.env.METRICS_ENABLE !== '0' && process.env.METRICS_ENABLE !== 'off') {
  startMetricsServer()
}
