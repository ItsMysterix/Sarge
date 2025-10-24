import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { WebSocketServer } from 'ws'
import WebSocket from 'ws'
import { isAllowedOrigin } from '../src/ws/origin'

function startGuardedWSS(opts: { allow: string[]; maxSubs: number }) {
  const wss = new WebSocketServer({ port: 0 })
  wss.on('connection', (ws, req) => {
    const origin = req.headers.origin as string | undefined
    if (!isAllowedOrigin(origin, opts.allow)) {
      ws.close(1008, 'Forbidden origin')
      return
    }
    let subs = 0
    ws.on('message', (raw) => {
      try {
        const obj = JSON.parse(raw.toString())
        const isStart = obj?.type === 'start' || obj?.method === 'subscription'
        if (isStart) {
          subs += 1
          if (subs > opts.maxSubs) {
            try { ws.close(1008, 'Subscription limit exceeded') } catch {}
          }
        }
      } catch {}
    })
  })
  const addr = wss.address()
  const port = typeof addr === 'object' && addr ? addr.port : 0
  return { wss, port }
}

describe('WS origin & subscription caps', () => {
  test('rejects disallowed origin with 1008', async () => {
    const { wss, port } = startGuardedWSS({ allow: ['http://allowed.test'], maxSubs: 2 })
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10))

    await new Promise<void>((resolve) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}`, { headers: { Origin: 'http://evil.test' } })
      ws.on('close', (code) => {
        expect(code).toBe(1008)
        resolve()
      })
    })

    await new Promise<void>((resolve) => wss.close(() => resolve()))
  })

  test('enforces subscription cap', async () => {
    const { wss, port } = startGuardedWSS({ allow: ['http://allowed.test'], maxSubs: 2 })
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10))

    await new Promise<void>((resolve) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}`, { headers: { Origin: 'http://allowed.test' } })
      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'start', id: '1' }))
        ws.send(JSON.stringify({ type: 'start', id: '2' }))
        ws.send(JSON.stringify({ type: 'start', id: '3' }))
      })
      ws.on('close', (code) => {
        expect(code).toBe(1008)
        resolve()
      })
    })

    await new Promise<void>((resolve) => wss.close(() => resolve()))
  })
})
