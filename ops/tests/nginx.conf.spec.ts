import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('nginx.conf basics', () => {
  const conf = readFileSync(resolve(__dirname, '../nginx/nginx.conf'), 'utf8')
  test('has server_name and TLS cert paths', () => {
    expect(conf).toContain('server_name _;')
    expect(conf).toContain('ssl_certificate     /etc/nginx/tls/fullchain.pem;')
    expect(conf).toContain('ssl_certificate_key /etc/nginx/tls/privkey.pem;')
  })
  test('has proxy headers and websocket upgrade', () => {
    expect(conf).toContain('proxy_set_header X-Forwarded-For')
    expect(conf).toContain('proxy_set_header X-Forwarded-Proto')
    expect(conf).toContain('proxy_set_header Upgrade $http_upgrade;')
    expect(conf).toContain('Connection "Upgrade"')
  })
})
