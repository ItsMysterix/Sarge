import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('compose.prod.yaml structure', () => {
  const text = readFileSync(resolve(__dirname, '../../compose.prod.yaml'), 'utf8')
  test('has nginx, backend, app services', () => {
    expect(text).toContain('\n  nginx:')
    expect(text).toContain('\n  backend:')
    expect(text).toContain('\n  app:')
  })
  test('backend has healthcheck and awslogs', () => {
    expect(text).toContain('healthcheck:')
    expect(text).toContain('awslogs-region: ${AWS_REGION}')
    expect(text).toContain('awslogs-group: /sarge/backend')
  })
  test('nginx exposes 80 and 443', () => {
    expect(text).toContain('"80:80"')
    expect(text).toContain('"443:443"')
  })
})
