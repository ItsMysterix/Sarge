type Level = 'debug' | 'info' | 'warn' | 'error'

const enabled = true

function log(level: Level, msg: string, meta?: Record<string, any>) {
  const entry = { level, msg, ...(meta || {}), ts: new Date().toISOString() }
  // Structured JSON log for easier scraping
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](JSON.stringify(entry))
}

export const logger = {
  debug: (msg: string, meta?: Record<string, any>) => enabled && log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, any>) => enabled && log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, any>) => enabled && log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, any>) => enabled && log('error', msg, meta),
}
