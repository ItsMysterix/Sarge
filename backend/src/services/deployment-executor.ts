import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

export interface DeploymentLog {
  timestamp: number
  line: string
  level: 'info' | 'success' | 'error' | 'warning'
}

export class DeploymentExecutor {
  private process: ChildProcess | null = null
  private logs: DeploymentLog[] = []
  private onLog: ((log: DeploymentLog) => void) | null = null

  constructor() {
    this.logs = []
    this.process = null
  }

  setOnLog(callback: (log: DeploymentLog) => void) {
    this.onLog = callback
  }

  private addLog(line: string, level: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const log: DeploymentLog = {
      timestamp: Date.now(),
      line: line.trim(),
      level,
    }
    this.logs.push(log)
    if (this.onLog) {
      this.onLog(log)
    }
  }

  async deploy(
    repoPath: string,
    packageManager: string = 'pnpm',
    startPort: number = 3000
  ): Promise<{ success: boolean; error?: string; logs: DeploymentLog[] }> {
    try {
      // Validate repo exists
      if (!fs.existsSync(repoPath)) {
        const msg = `Repository path not found: ${repoPath}`
        this.addLog(msg, 'error')
        return { success: false, error: msg, logs: this.logs }
      }

      this.addLog(`🚀 Starting deployment of ${path.basename(repoPath)}...`, 'info')
      this.addLog(`📦 Using package manager: ${packageManager}`, 'info')
      this.addLog(`🔧 Target port: ${startPort}`, 'info')

      // Step 1: Install dependencies
      this.addLog(`⏳ Installing dependencies with ${packageManager}...`, 'info')
      const installSuccess = await this.runCommand(
        packageManager,
        ['install'],
        repoPath
      )
      if (!installSuccess) {
        const msg = `Failed to install dependencies`
        this.addLog(msg, 'error')
        return { success: false, error: msg, logs: this.logs }
      }
      this.addLog(`✅ Dependencies installed`, 'success')

      // Step 2: Build (if build script exists)
      const pkgJsonPath = path.join(repoPath, 'package.json')
      let hasBuildScript = false
      if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
        hasBuildScript = !!(pkgJson.scripts && pkgJson.scripts.build)
      }

      if (hasBuildScript) {
        this.addLog(`⏳ Building project...`, 'info')
        const buildSuccess = await this.runCommand(
          packageManager,
          ['run', 'build'],
          repoPath
        )
        if (!buildSuccess) {
          this.addLog(`⚠️ Build failed (continuing anyway)`, 'warning')
        } else {
          this.addLog(`✅ Build complete`, 'success')
        }
      }

      // Step 3: Start the application
      this.addLog(`⏳ Starting application on port ${startPort}...`, 'info')
      const envVars = { ...process.env, PORT: startPort.toString() }
      const startSuccess = await this.runCommand(
        packageManager,
        ['run', 'start'],
        repoPath,
        envVars,
        true // Keep alive
      )

      if (startSuccess) {
        this.addLog(`✅ Deployment initiated - Application running on port ${startPort}`, 'success')
        return { success: true, logs: this.logs }
      } else {
        const msg = `Failed to start application`
        this.addLog(msg, 'error')
        return { success: false, error: msg, logs: this.logs }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      this.addLog(`❌ Deployment error: ${msg}`, 'error')
      return { success: false, error: msg, logs: this.logs }
    }
  }

  private runCommand(
    cmd: string,
    args: string[],
    cwd: string,
    env?: NodeJS.ProcessEnv,
    keepAlive: boolean = false
  ): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.process = spawn(cmd, args, {
          cwd,
          env: env || process.env,
          stdio: ['pipe', 'pipe', 'pipe'],
        })

        let stdout = ''
        let stderr = ''

        if (this.process.stdout) {
          this.process.stdout.on('data', (data) => {
            const text = data.toString()
            stdout += text
            // Stream individual lines
            text.split('\n').forEach((line) => {
              if (line.trim()) {
                this.addLog(line, 'info')
              }
            })
          })
        }

        if (this.process.stderr) {
          this.process.stderr.on('data', (data) => {
            const text = data.toString()
            stderr += text
            text.split('\n').forEach((line) => {
              if (line.trim()) {
                this.addLog(line, 'error')
              }
            })
          })
        }

        this.process.on('close', (code) => {
          if (code === 0) {
            resolve(true)
          } else {
            this.addLog(`Process exited with code ${code}`, 'error')
            resolve(false)
          }
          if (!keepAlive) {
            this.process = null
          }
        })

        this.process.on('error', (err) => {
          this.addLog(`Process error: ${err.message}`, 'error')
          resolve(false)
          this.process = null
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        this.addLog(`Failed to spawn process: ${msg}`, 'error')
        resolve(false)
      }
    })
  }

  stop() {
    if (this.process) {
      this.process.kill()
      this.process = null
      this.addLog(`🛑 Deployment stopped`, 'warning')
    }
  }

  getLogs(): DeploymentLog[] {
    return this.logs
  }

  clearLogs() {
    this.logs = []
  }
}
