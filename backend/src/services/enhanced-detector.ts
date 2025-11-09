/**
 * Enhanced Service Detector with Multiple Package Manager Support
 * Detects: npm, pnpm, yarn, bun, poetry, pip, cargo, go, composer, maven, gradle
 */

import * as fs from 'fs'
import * as path from 'path'

export interface DetectedService {
  name: string
  type: 'web' | 'api' | 'worker' | 'mcp' | 'database'
  framework?: string
  language: string
  packageManager: PackageManager
  startCommand: string
  buildCommand?: string
  installCommand: string
  ports: number[]
  envKeys: string[]
  dependencies?: string[]
}

export interface PackageManager {
  name: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'poetry' | 'pip' | 'cargo' | 'go' | 'composer' | 'maven' | 'gradle' | 'unknown'
  lockFile?: string
  configFile: string
  detected: boolean
}

export interface DetectionResult {
  services: DetectedService[]
  packageManagers: PackageManager[]
  framework: string | null
  language: string[]
  hasDocker: boolean
  hasDockerCompose: boolean
}

export class EnhancedDetector {
  constructor(private repoPath: string) {}

  async detect(): Promise<DetectionResult> {
    const files = this.listFiles()
    
    // Detect package managers
    const packageManagers = this.detectPackageManagers(files)
    
    // Detect languages & frameworks
    const languages = this.detectLanguages(files)
    const framework = await this.detectFramework(files, packageManagers)
    
    // Detect services
    const services = await this.detectServices(files, packageManagers, framework)
    
    // Docker detection
    const hasDocker = files.some(f => path.basename(f).toLowerCase() === 'dockerfile')
    const hasDockerCompose = files.some(f => /docker-compose.*\.ya?ml$/i.test(f))
    
    return {
      services,
      packageManagers: packageManagers.filter(pm => pm.detected),
      framework,
      language: languages,
      hasDocker,
      hasDockerCompose
    }
  }

  private listFiles(): string[] {
    const files: string[] = []
    const maxFiles = 1000

    const walk = (dir: string, depth: number = 0) => {
      if (depth > 5 || files.length >= maxFiles) return
      
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          // Skip common ignore patterns
          if (entry.name.startsWith('.') && entry.name !== '.env') continue
          if (entry.name === 'node_modules') continue
          if (entry.name === 'dist') continue
          if (entry.name === 'build') continue
          if (entry.name === '__pycache__') continue
          if (entry.name === 'target') continue
          if (entry.name === 'vendor') continue
          
          const fullPath = path.join(dir, entry.name)
          
          if (entry.isDirectory()) {
            walk(fullPath, depth + 1)
          } else {
            files.push(fullPath)
          }
        }
      } catch (err) {
        // Skip unreadable directories
      }
    }

    walk(this.repoPath)
    return files
  }

  private detectPackageManagers(files: string[]): PackageManager[] {
    const managers: PackageManager[] = []

    // JavaScript/TypeScript
    if (files.some(f => path.basename(f) === 'pnpm-lock.yaml')) {
      managers.push({
        name: 'pnpm',
        lockFile: 'pnpm-lock.yaml',
        configFile: 'package.json',
        detected: true
      })
    } else if (files.some(f => path.basename(f) === 'yarn.lock')) {
      managers.push({
        name: 'yarn',
        lockFile: 'yarn.lock',
        configFile: 'package.json',
        detected: true
      })
    } else if (files.some(f => path.basename(f) === 'bun.lockb')) {
      managers.push({
        name: 'bun',
        lockFile: 'bun.lockb',
        configFile: 'package.json',
        detected: true
      })
    } else if (files.some(f => path.basename(f) === 'package.json')) {
      managers.push({
        name: 'npm',
        lockFile: 'package-lock.json',
        configFile: 'package.json',
        detected: true
      })
    }

    // Python
    if (files.some(f => path.basename(f) === 'poetry.lock')) {
      managers.push({
        name: 'poetry',
        lockFile: 'poetry.lock',
        configFile: 'pyproject.toml',
        detected: true
      })
    } else if (files.some(f => path.basename(f) === 'requirements.txt' || path.basename(f) === 'Pipfile')) {
      managers.push({
        name: 'pip',
        configFile: 'requirements.txt',
        detected: true
      })
    }

    // Rust
    if (files.some(f => path.basename(f) === 'Cargo.toml')) {
      managers.push({
        name: 'cargo',
        lockFile: 'Cargo.lock',
        configFile: 'Cargo.toml',
        detected: true
      })
    }

    // Go
    if (files.some(f => path.basename(f) === 'go.mod')) {
      managers.push({
        name: 'go',
        lockFile: 'go.sum',
        configFile: 'go.mod',
        detected: true
      })
    }

    // PHP
    if (files.some(f => path.basename(f) === 'composer.json')) {
      managers.push({
        name: 'composer',
        lockFile: 'composer.lock',
        configFile: 'composer.json',
        detected: true
      })
    }

    // Java
    if (files.some(f => path.basename(f) === 'pom.xml')) {
      managers.push({
        name: 'maven',
        configFile: 'pom.xml',
        detected: true
      })
    } else if (files.some(f => path.basename(f) === 'build.gradle' || path.basename(f) === 'build.gradle.kts')) {
      managers.push({
        name: 'gradle',
        configFile: 'build.gradle',
        detected: true
      })
    }

    return managers
  }

  private detectLanguages(files: string[]): string[] {
    const languages = new Set<string>()

    for (const file of files) {
      const ext = path.extname(file).toLowerCase()
      
      if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(ext)) {
        languages.add('javascript')
      } else if (['.py', '.pyw'].includes(ext)) {
        languages.add('python')
      } else if (['.rs'].includes(ext)) {
        languages.add('rust')
      } else if (['.go'].includes(ext)) {
        languages.add('go')
      } else if (['.php'].includes(ext)) {
        languages.add('php')
      } else if (['.java'].includes(ext)) {
        languages.add('java')
      } else if (['.rb'].includes(ext)) {
        languages.add('ruby')
      } else if (['.cs'].includes(ext)) {
        languages.add('csharp')
      }
    }

    return Array.from(languages)
  }

  private async detectFramework(files: string[], packageManagers: PackageManager[]): Promise<string | null> {
    // Check package.json for JavaScript frameworks
    const pkgJsonFile = files.find(f => path.basename(f) === 'package.json')
    if (pkgJsonFile) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonFile, 'utf-8'))
        const deps = { ...pkg.dependencies, ...pkg.devDependencies }
        
        if (deps['next']) return 'Next.js'
        if (deps['react']) return 'React'
        if (deps['vue']) return 'Vue.js'
        if (deps['@angular/core']) return 'Angular'
        if (deps['svelte']) return 'Svelte'
        if (deps['express']) return 'Express'
        if (deps['@nestjs/core']) return 'NestJS'
        if (deps['fastify']) return 'Fastify'
        if (deps['@trpc/server']) return 'tRPC'
      } catch {}
    }

    // Check for Python frameworks
    const reqFile = files.find(f => path.basename(f) === 'requirements.txt')
    if (reqFile) {
      try {
        const content = fs.readFileSync(reqFile, 'utf-8')
        if (content.includes('fastapi')) return 'FastAPI'
        if (content.includes('django')) return 'Django'
        if (content.includes('flask')) return 'Flask'
      } catch {}
    }

    // Check pyproject.toml for Poetry projects
    const pyprojectFile = files.find(f => path.basename(f) === 'pyproject.toml')
    if (pyprojectFile) {
      try {
        const content = fs.readFileSync(pyprojectFile, 'utf-8')
        if (content.includes('fastapi')) return 'FastAPI'
        if (content.includes('django')) return 'Django'
        if (content.includes('flask')) return 'Flask'
      } catch {}
    }

    return null
  }

  private async detectServices(
    files: string[],
    packageManagers: PackageManager[],
    framework: string | null
  ): Promise<DetectedService[]> {
    const services: DetectedService[] = []

    for (const pm of packageManagers.filter(p => p.detected)) {
      const service = await this.detectServiceForPackageManager(pm, files, framework)
      if (service) {
        services.push(service)
      }
    }

    return services
  }

  private async detectServiceForPackageManager(
    pm: PackageManager,
    files: string[],
    framework: string | null
  ): Promise<DetectedService | null> {
    const configPath = path.join(this.repoPath, pm.configFile)
    if (!fs.existsSync(configPath)) return null

    switch (pm.name) {
      case 'npm':
      case 'pnpm':
      case 'yarn':
      case 'bun':
        return this.detectNodeService(pm, configPath, framework)
      
      case 'poetry':
      case 'pip':
        return this.detectPythonService(pm, configPath, framework)
      
      case 'cargo':
        return this.detectRustService(pm, configPath)
      
      case 'go':
        return this.detectGoService(pm, configPath)
      
      case 'composer':
        return this.detectPHPService(pm, configPath)
      
      case 'maven':
      case 'gradle':
        return this.detectJavaService(pm, configPath)
      
      default:
        return null
    }
  }

  private detectNodeService(pm: PackageManager, configPath: string, framework: string | null): DetectedService {
    const pkg = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const scripts = pkg.scripts || {}
    
    const startCommand = scripts.dev || scripts.start || scripts.serve || `${pm.name} run dev`
    const buildCommand = scripts.build || `${pm.name} run build`
    const installCommand = pm.name === 'npm' ? 'npm install' : 
                          pm.name === 'pnpm' ? 'pnpm install' :
                          pm.name === 'yarn' ? 'yarn install' :
                          'bun install'
    
    // Detect type based on framework
    let type: DetectedService['type'] = 'api'
    if (framework === 'Next.js' || framework === 'React' || framework === 'Vue.js' || framework === 'Angular' || framework === 'Svelte') {
      type = 'web'
    }
    
    // Detect ports from scripts
    const ports = this.extractPortsFromScripts(scripts)
    
    return {
      name: pkg.name || 'app',
      type,
      framework: framework || undefined,
      language: 'javascript',
      packageManager: pm,
      startCommand,
      buildCommand,
      installCommand,
      ports: ports.length > 0 ? ports : [3000],
      envKeys: [],
      dependencies: Object.keys(pkg.dependencies || {})
    }
  }

  private detectPythonService(pm: PackageManager, configPath: string, framework: string | null): DetectedService {
    let appName = 'app'
    let startCommand = 'python main.py'
    
    if (framework === 'FastAPI') {
      startCommand = 'uvicorn main:app --host 0.0.0.0 --port 8000 --reload'
    } else if (framework === 'Django') {
      startCommand = 'python manage.py runserver 0.0.0.0:8000'
    } else if (framework === 'Flask') {
      startCommand = 'flask run --host=0.0.0.0 --port=5000'
    }
    
    const installCommand = pm.name === 'poetry' ? 'poetry install' : 'pip install -r requirements.txt'
    
    return {
      name: appName,
      type: 'api',
      framework: framework || undefined,
      language: 'python',
      packageManager: pm,
      startCommand,
      installCommand,
      ports: [8000],
      envKeys: [],
      dependencies: []
    }
  }

  private detectRustService(pm: PackageManager, configPath: string): DetectedService {
    return {
      name: 'app',
      type: 'api',
      language: 'rust',
      packageManager: pm,
      startCommand: 'cargo run',
      buildCommand: 'cargo build --release',
      installCommand: 'cargo build',
      ports: [8080],
      envKeys: []
    }
  }

  private detectGoService(pm: PackageManager, configPath: string): DetectedService {
    return {
      name: 'app',
      type: 'api',
      language: 'go',
      packageManager: pm,
      startCommand: 'go run .',
      buildCommand: 'go build',
      installCommand: 'go mod download',
      ports: [8080],
      envKeys: []
    }
  }

  private detectPHPService(pm: PackageManager, configPath: string): DetectedService {
    return {
      name: 'app',
      type: 'web',
      framework: 'Laravel',
      language: 'php',
      packageManager: pm,
      startCommand: 'php artisan serve --host=0.0.0.0 --port=8000',
      installCommand: 'composer install',
      ports: [8000],
      envKeys: []
    }
  }

  private detectJavaService(pm: PackageManager, configPath: string): DetectedService {
    const command = pm.name === 'maven' ? 'mvn' : 'gradle'
    
    return {
      name: 'app',
      type: 'api',
      framework: 'Spring Boot',
      language: 'java',
      packageManager: pm,
      startCommand: `${command} spring-boot:run`,
      buildCommand: `${command} build`,
      installCommand: `${command} install`,
      ports: [8080],
      envKeys: []
    }
  }

  private extractPortsFromScripts(scripts: Record<string, string>): number[] {
    const ports = new Set<number>()
    
    for (const cmd of Object.values(scripts)) {
      // Match -p 3000, --port 3000, PORT=3000
      const portMatches = cmd.match(/(?:-p|--port)\s+(\d{2,5})|PORT\s*=\s*(\d{2,5})/g)
      if (portMatches) {
        for (const match of portMatches) {
          const portNum = parseInt(match.match(/\d{2,5}/)?.[0] || '0', 10)
          if (portNum > 0) ports.add(portNum)
        }
      }
    }
    
    return Array.from(ports)
  }
}
