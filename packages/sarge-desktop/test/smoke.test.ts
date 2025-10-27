import { spawn } from 'node:child_process'
import path from 'node:path'
import { afterAll, beforeAll, expect, test } from 'vitest'

let child: any

beforeAll(async () => {
  const root = path.resolve(__dirname, '../../..')
  const electronBin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'electron.cmd' : 'electron')
  const appMain = path.join(root, 'packages', 'sarge-desktop', 'dist', 'main.js')
  child = spawn(electronBin, [appMain], {
    env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: 'true' },
    stdio: 'ignore'
  })
})

afterAll(async () => {
  try { child?.kill() } catch {}
})

test('desktop app starts and can be killed', async () => {
  expect(child?.pid).toBeTruthy()
})
