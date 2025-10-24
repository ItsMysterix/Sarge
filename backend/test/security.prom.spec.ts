import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import http from 'http'
import { startMetricsServer } from '../src/http/metrics-server'

const realEnv = { ...process.env }

function get(url: string, headers?: Record<string,string>): Promise<{status: number; body: string; contentType?: string}> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode || 0, body: Buffer.concat(chunks).toString('utf8'), contentType: res.headers['content-type'] as string | undefined }))
    })
    req.on('error', reject)
  })
}

describe('Prometheus metrics auth', () => {
  afterEach(() => {
    process.env = { ...realEnv }
  })

  test('requires bearer token in non-test when set', async () => {
  process.env.PROM_METRICS_TOKEN = 'test-token'
  ;(process.env as any).NODE_ENV = 'production'
    const { server, close } = startMetricsServer(0)
    const addr = server.address()
    const port = typeof addr === 'object' && addr ? addr.port : 0

    let res = await get(`http://127.0.0.1:${port}/metrics`)
    expect(res.status).toBe(401)

    res = await get(`http://127.0.0.1:${port}/metrics`, { Authorization: 'Bearer wrong' })
    expect(res.status).toBe(401)

    res = await get(`http://127.0.0.1:${port}/metrics`, { Authorization: 'Bearer test-token' })
    expect(res.status).toBe(200)
    expect(res.contentType).toContain('text/plain')

    await close()
  })

  test('accessible in test env without token', async () => {
  delete process.env.PROM_METRICS_TOKEN
  ;(process.env as any).NODE_ENV = 'test'
    const { server, close } = startMetricsServer(0)
    const addr = server.address()
    const port = typeof addr === 'object' && addr ? addr.port : 0

    const res = await get(`http://127.0.0.1:${port}/metrics`)
    expect(res.status).toBe(200)
    expect(res.contentType).toContain('text/plain')

    await close()
  })
})
