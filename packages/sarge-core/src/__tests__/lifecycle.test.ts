import { describe, expect, it } from 'vitest'
import { resolveStartOrder } from '../domain/lifecycle'
import type { Service } from '../domain/types'

function svc(id: string, dependsOn: string[] = []): Service {
  return { id, name: id, kind: 'custom', version: '0.0.0', dependsOn, state: 'init' }
}

describe('resolveStartOrder', () => {
  it('orders services so dependencies start first', () => {
    const services = [svc('api', ['db', 'cache']), svc('web', ['api']), svc('db'), svc('cache')]
    const order = resolveStartOrder(services)
    // db and cache before api, api before web
    expect(order.indexOf('db')).toBeLessThan(order.indexOf('api'))
    expect(order.indexOf('cache')).toBeLessThan(order.indexOf('api'))
    expect(order.indexOf('api')).toBeLessThan(order.indexOf('web'))
  })

  it('detects cycles', () => {
    const services = [svc('a', ['b']), svc('b', ['a'])]
    expect(() => resolveStartOrder(services)).toThrowError(/Cycle/)
  })
})
