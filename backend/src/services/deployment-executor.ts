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

      // Normalize package manager name
      const pm = this.getNormalizedPM(packageManager)
      if (!pm) {
        const msg = `Unsupported package manager: ${packageManager}. Use npm, pnpm, yarn, or bun`
        this.addLog(msg, 'error')
        return { success: false, error: msg, logs: this.logs }
      }

      // Step 1: Install dependencies
      this.addLog(`⏳ Installing dependencies with ${pm}...`, 'info')
      const installSuccess = await this.runCommand(
        pm,
        this.getInstallArgs(pm),
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
        try {
          const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
          hasBuildScript = !!(pkgJson.scripts && pkgJson.scripts.build)
        } catch (e) {
          this.addLog(`⚠️ Could not parse package.json`, 'warning')
        }
      }

      if (hasBuildScript) {
        this.addLog(`⏳ Building project...`, 'info')
        const buildSuccess = await this.runCommand(
          pm,
          this.getBuildArgs(pm),
          repoPath
        )
        if (!buildSuccess) {
          this.addLog(`⚠️ Build failed (continuing anyway)`, 'warning')
        } else {
          this.addLog(`✅ Build complete`, 'success')
        }
      }

      // Step 3: Start the application (non-blocking, just initiate)
      this.addLog(`⏳ Starting application on port ${startPort}...`, 'info')
      const envVars = { ...process.env, PORT: startPort.toString() }
      const startSuccess = await this.initiateStart(
        pm,
        repoPath,
        envVars
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

  private getNormalizedPM(pm: string): string | null {
    const normalized = pm.toLowerCase().trim()
    if (['npm', 'pnpm', 'yarn', 'bun'].includes(normalized)) {
      return normalized
    }
    return null
  }

  private getInstallArgs(pm: string): string[] {
    switch (pm) {
      case 'pnpm':
        return ['install']
      case 'npm':
        return ['install']
      case 'yarn':
        return ['install']
      case 'bun':
        return ['install']
      default:
        return ['install']
    }
  }

  private getBuildArgs(pm: string): string[] {
    switch (pm) {
      case 'pnpm':
      case 'npm':
      case 'yarn':
        return ['run', 'build']
      case 'bun':
        return ['run', 'build']
      default:
        return ['run', 'build']
    }
  }

  private getStartArgs(pm: string): string[] {
    switch (pm) {
      case 'pnpm':
      case 'npm':
      case 'yarn':
        return ['run', 'start']
      case 'bun':
        return ['run', 'start']
      default:
        return ['run', 'start']
    }
  }

  private initiateStart(
    pm: string,
    cwd: string,
    env: NodeJS.ProcessEnv
  ): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const args = this.getStartArgs(pm)
        this.process = spawn(pm, args, {
          cwd,
          env,
          stdio: ['pipe', 'pipe', 'pipe'],
          detached: false,
        })

        if (this.process.stdout) {
          this.process.stdout.on('data', (data: Buffer | string) => {
            const text = data.toString()
            text.split('\n').forEach((line: string) => {
              if (line.trim()) {
                this.addLog(line, 'info')
              }
            })
          })
        }

        if (this.process.stderr) {
          this.process.stderr.on('data', (data: Buffer | string) => {
            const text = data.toString()
            text.split('\n').forEach((line: string) => {
              if (line.trim()) {
                this.addLog(line, 'error')
              }
            })
          })
        }

        // Resolve immediately after process spawns (don't wait for it to finish)
        // Server continues running in background
        resolve(true)

        this.process.on('close', (code) => {
          if (code !== 0) {
            this.addLog(`⚠️ Server process exited with code ${code}`, 'warning')
          }
        })

        this.process.on('error', (err) => {
          this.addLog(`❌ Server process error: ${err.message}`, 'error')
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        this.addLog(`Failed to start server: ${msg}`, 'error')
        resolve(false)
      }
    })
  }

  private runCommand(
    cmd: string,
    args: string[],
    cwd: string,
    env?: NodeJS.ProcessEnv
  ): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.process = spawn(cmd, args, {
          cwd,
          env: env || process.env,
          stdio: ['pipe', 'pipe', 'pipe'],
        })

        if (this.process.stdout) {
          this.process.stdout.on('data', (data: Buffer | string) => {
            const text = data.toString()
            text.split('\n').forEach((line: string) => {
              if (line.trim()) {
                this.addLog(line, 'info')
              }
            })
          })
        }

        if (this.process.stderr) {
          this.process.stderr.on('data', (data: Buffer | string) => {
            const text = data.toString()
            text.split('\n').forEach((line: string) => {
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
          this.process = null
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

  /**
   * Detect package manager from project
   */
  detectPackageManager(repoPath: string): string {
    const pkgJsonPath = path.join(repoPath, 'package.json')
    
    // Check for lock files in order of preference
    if (fs.existsSync(path.join(repoPath, 'pnpm-lock.yaml'))) {
      return 'pnpm'
    }
    if (fs.existsSync(path.join(repoPath, 'yarn.lock'))) {
      return 'yarn'
    }
    if (fs.existsSync(path.join(repoPath, 'bun.lockb'))) {
      return 'bun'
    }
    if (fs.existsSync(path.join(repoPath, 'package-lock.json'))) {
      return 'npm'
    }
    
    // Check package.json packageManager field
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
        if (pkgJson.packageManager) {
          const pm = pkgJson.packageManager.split('@')[0]
          if (['npm', 'pnpm', 'yarn', 'bun'].includes(pm)) {
            return pm
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
      // Default fallback
      return 'npm'
    }
  
  }
