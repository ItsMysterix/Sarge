const { spawn } = require('node:child_process')
const path = require('node:path')

async function main() {
  const root = path.resolve(__dirname, '../../..')
  const electronBin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'electron.cmd' : 'electron')
  const appMain = path.join(root, 'packages', 'sarge-desktop', 'dist', 'main.js')
  const child = spawn(electronBin, [appMain], {
    env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: 'true' },
    stdio: 'ignore'
  })
  console.log('Spawned desktop app pid:', child.pid)
  setTimeout(() => {
    try { child.kill() } catch {}
    console.log('Killed desktop app')
  }, 3000)
}

main().catch((e) => { console.error(e); process.exit(1) })
