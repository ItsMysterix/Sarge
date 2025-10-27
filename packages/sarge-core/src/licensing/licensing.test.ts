import { describe, expect, test } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { getStatus } from './index'

describe('licensing status', () => {
  test('defaults to community with features locked', () => {
    const st = getStatus({ licensePath: path.join(__dirname, '__nope__') })
    expect(st.edition).toBe('community')
    expect(st.features.teamSpaces).toBe(false)
    expect(st.features.cloudApply).toBe(false)
  })
  test('pro license unlocks features and grace period applies', () => {
    const tmp = path.join(__dirname, 'tmp.license.json')
    fs.writeFileSync(tmp, JSON.stringify({ edition: 'pro', features: ['teamSpaces','cloudApply'], expiresAt: '2000-01-01T00:00:00Z', graceDays: 36500 }))
    const st = getStatus({ licensePath: tmp, now: new Date('2000-01-02T00:00:00Z') })
    expect(st.edition).toBe('pro')
    expect(st.features.teamSpaces).toBe(true)
    expect(st.features.cloudApply).toBe(true)
    expect(st.inGrace).toBe(true)
    fs.unlinkSync(tmp)
  })
})
