#!/usr/bin/env node
/**
 * Quick test runner: starts dev server and tests OAuth
 */

const { spawn } = require('child_process')
const http = require('http')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitForServer(port, timeout = 30000) {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/api/health`, (res) => {
          res.resume()
          resolve(res.statusCode === 200)
        })
        req.on('error', reject)
        req.setTimeout(1000)
      })
      if (res) return true
    } catch {
      // Keep trying
    }
    await sleep(500)
  }
  return false
}

async function main() {
  console.log('🚀 Starting dev server...')
  console.log('   Frontend on :3000')
  console.log('   Backend WS on :3200\n')

  const dev = spawn('pnpm', ['dev'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: process.cwd(),
  })

  let isReady = false

  dev.stdout.on('data', (data) => {
    const msg = data.toString()
    process.stdout.write(msg)
    // Look for "ready" messages from Next.js
    if (msg.includes('ready') || msg.includes('Local:')) {
      isReady = true
    }
  })

  dev.stderr.on('data', (data) => {
    process.stderr.write(data)
  })

  console.log('⏳ Waiting for server to start...')

  // Wait for dev server to be ready
  let attempts = 0
  while (attempts < 40) {
    try {
      const isUp = await waitForServer(3000, 1000)
      if (isUp) {
        console.log('✅ Server is ready!\n')
        break
      }
    } catch {
      // Retry
    }
    attempts++
    process.stdout.write('.')
  }

  if (attempts >= 40) {
    console.log('\n❌ Server failed to start')
    dev.kill()
    process.exit(1)
  }

  // Wait a bit more for full initialization
  await sleep(2000)

  console.log('\n🧪 Running OAuth tests...\n')

  // Run the test
  const test = spawn('node', ['test/oauth-github.test.js'], {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  test.on('close', (code) => {
    dev.kill()
    process.exit(code)
  })
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
