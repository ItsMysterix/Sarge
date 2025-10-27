import { app, BrowserWindow, Tray, Menu, dialog, nativeImage } from 'electron'
import path from 'node:path'
import { spawn, ChildProcess } from 'node:child_process'
import http from 'node:http'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let backendProc: ChildProcess | null = null
let frontendProc: ChildProcess | null = null

const ROOT = path.resolve(__dirname, '../../..')
const isDev = process.env.NODE_ENV !== 'production'

function startBackend() {
  try {
    const script = isDev ? path.join(ROOT, 'backend', 'dist', 'ws-server.js') : path.join(ROOT, 'backend', 'dist', 'ws-server.js')
    backendProc = spawn(process.execPath, ['--enable-source-maps', script], {
      cwd: ROOT,
      env: { ...process.env, PORT: '3200' },
      stdio: 'ignore'
    })
  } catch (e) {
    console.error('Failed to start backend', e)
  }
}

function startFrontend() {
  // Expect Next.js build is available and "next start" can serve it on 3000
  const nextBin = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'next.cmd' : 'next')
  frontendProc = spawn(nextBin, ['start', '-p', '3000'], { cwd: ROOT, env: { ...process.env, NODE_ENV: 'production' }, stdio: 'ignore' })
}

function stopChildren() {
  try { backendProc?.kill() } catch {}
  try { frontendProc?.kill() } catch {}
  backendProc = null
  frontendProc = null
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { contextIsolation: true }
  })
  const url = 'http://localhost:3000'
  mainWindow.loadURL(url)
}

function setupTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  const menu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow?.show() },
    { label: 'Hide', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: 'Restart local server', click: () => { stopChildren(); startBackend(); startFrontend() } },
    { label: 'Check for updates', click: () => checkForUpdates() },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' }
  ])
  tray.setToolTip('Sarge')
  tray.setContextMenu(menu)
}

function waitForFrontend(): Promise<void> {
  return new Promise((resolve) => {
    const deadline = Date.now() + 15000
    const tryPing = () => {
      const req = http.get('http://localhost:3000', () => resolve())
      req.on('error', () => {
        if (Date.now() > deadline) return resolve()
        setTimeout(tryPing, 500)
      })
    }
    tryPing()
  })
}

async function checkForUpdates() {
  const url = process.env.SARGE_DESKTOP_UPDATE_URL
  if (!url) {
    dialog.showMessageBox({ type: 'info', message: 'No update channel configured', buttons: ['OK'] })
    return
  }
  try {
    const res = await fetch(url)
    const json: any = await res.json()
    dialog.showMessageBox({ type: 'info', message: `Latest version: ${json.version || 'unknown'}`, detail: 'Local update channels supported only.', buttons: ['OK'] })
  } catch (e: any) {
    dialog.showMessageBox({ type: 'error', message: 'Update check failed', detail: e?.message || String(e), buttons: ['OK'] })
  }
}

app.on('ready', async () => {
  startBackend()
  startFrontend()
  await waitForFrontend()
  await createWindow()
  setupTray()
})

app.on('before-quit', () => {
  stopChildren()
})
