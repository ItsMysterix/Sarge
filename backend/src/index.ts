import { startMetricsServer } from './http/metrics-server'
import './ws-server'

// Start metrics server; port via env (METRICS_PORT)
if (process.env.METRICS_ENABLE !== 'false' && process.env.METRICS_ENABLE !== '0' && process.env.METRICS_ENABLE !== 'off') {
  startMetricsServer()
}
