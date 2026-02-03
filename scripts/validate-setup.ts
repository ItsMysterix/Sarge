#!/usr/bin/env ts-node
/**
 * Comprehensive validation script for Sarge Qovery Clone
 * Validates: Environment, Database, OAuth, WebSocket, and Services
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface ValidationResult {
  section: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  details?: string[]
}

const results: ValidationResult[] = []

const log = (level: 'INFO' | 'PASS' | 'FAIL' | 'WARN', msg: string) => {
  const colors = {
    INFO: '\x1b[36m',
    PASS: '\x1b[32m',
    FAIL: '\x1b[31m',
    WARN: '\x1b[33m',
    RESET: '\x1b[0m',
  }
  console.log(`${colors[level]}[${level}]${colors.RESET} ${msg}`)
}

const addResult = (section: string, status: 'pass' | 'fail' | 'warn', message: string, details?: string[]) => {
  results.push({ section, status, message, details })
}

// ============ 1. Environment Variables ============
log('INFO', 'Validating environment variables...')

const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'DATABASE_URL',
  'GITHUB_ID',
  'GITHUB_SECRET',
]

const optionalEnvVars = [
  'NEXT_PUBLIC_WS_URL',
  'WS_PORT',
  'VERCEL_TOKEN',
  'RAILWAY_TOKEN',
]

const envFile = path.join(process.cwd(), '.env')
const envContent = fs.readFileSync(envFile, 'utf-8')

const missingRequired: string[] = []
const missingOptional: string[] = []

requiredEnvVars.forEach((v) => {
  if (!envContent.includes(v + '=')) {
    missingRequired.push(v)
  }
})

optionalEnvVars.forEach((v) => {
  if (!envContent.includes(v + '=')) {
    missingOptional.push(v)
  }
})

if (missingRequired.length === 0) {
  log('PASS', 'All required environment variables present')
  addResult('Environment', 'pass', 'All required vars configured')
} else {
  log('FAIL', `Missing required vars: ${missingRequired.join(', ')}`)
  addResult('Environment', 'fail', `Missing: ${missingRequired.join(', ')}`)
}

if (missingOptional.length > 0) {
  log('WARN', `Missing optional vars: ${missingOptional.join(', ')}`)
  addResult('Environment', 'warn', `Optional missing: ${missingOptional.join(', ')}`)
}

// Parse env values
const envVars = new Map<string, string>()
envContent.split('\n').forEach((line) => {
  const [key, ...values] = line.split('=')
  if (key && values) {
    envVars.set(key.trim(), values.join('=').trim().replace(/^["']|["']$/g, ''))
  }
})

const nextAuthUrl = envVars.get('NEXTAUTH_URL')
const nextAuthSecret = envVars.get('NEXTAUTH_SECRET')

if (nextAuthSecret && nextAuthSecret.length < 20) {
  log('WARN', `NEXTAUTH_SECRET is too short (${nextAuthSecret.length} chars, recommend 32+)`)
  addResult('Environment', 'warn', 'NEXTAUTH_SECRET too short')
}

if (nextAuthUrl && !nextAuthUrl.match(/^https?:\/\/.+/)) {
  log('FAIL', `Invalid NEXTAUTH_URL format: ${nextAuthUrl}`)
  addResult('Environment', 'fail', 'Invalid NEXTAUTH_URL format')
}

// ============ 2. File Structure ============
log('INFO', 'Validating project structure...')

const requiredFiles = [
  'app/layout.tsx',
  'app/api/auth/[...nextauth]/route.ts',
  'backend/src/api/root.ts',
  'backend/src/api/ws-server.ts',
  'lib/trpc.ts',
  'lib/trpc-provider.tsx',
  'middleware.ts',
]

const missingFiles: string[] = []

requiredFiles.forEach((f) => {
  if (!fs.existsSync(path.join(process.cwd(), f))) {
    missingFiles.push(f)
  }
})

if (missingFiles.length === 0) {
  log('PASS', 'All key project files present')
  addResult('Project Structure', 'pass', 'All required files exist')
} else {
  log('FAIL', `Missing files: ${missingFiles.join(', ')}`)
  addResult('Project Structure', 'fail', `Missing: ${missingFiles.join(', ')}`)
}

// ============ 3. Dependencies ============
log('INFO', 'Validating dependencies...')

const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'))
const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

const requiredDeps = ['next', 'next-auth', '@trpc/server', '@trpc/react-query', 'react', 'react-dom']
const missingDeps: string[] = []

requiredDeps.forEach((d) => {
  if (!deps[d]) {
    missingDeps.push(d)
  }
})

if (missingDeps.length === 0) {
  log('PASS', 'All critical dependencies installed')
  addResult('Dependencies', 'pass', 'All required packages present')
} else {
  log('FAIL', `Missing dependencies: ${missingDeps.join(', ')}`)
  addResult('Dependencies', 'fail', `Missing: ${missingDeps.join(', ')}`)
}

// ============ 4. OAuth Configuration ============
log('INFO', 'Validating GitHub OAuth...')

const githubId = envVars.get('GITHUB_ID')
const githubSecret = envVars.get('GITHUB_SECRET')

if (!githubId || !githubSecret) {
  log('WARN', 'GitHub OAuth credentials not configured')
  addResult('GitHub OAuth', 'warn', 'Credentials missing or invalid')
} else if (githubId.length < 10 || githubSecret.length < 20) {
  log('FAIL', 'Invalid GitHub OAuth credentials format')
  addResult('GitHub OAuth', 'fail', 'Credentials appear invalid')
} else {
  log('PASS', 'GitHub OAuth credentials present')
  addResult('GitHub OAuth', 'pass', 'GitHub credentials configured')
}

// Check auth route
const authRoute = path.join(process.cwd(), 'app/api/auth/[...nextauth]/route.ts')
if (fs.existsSync(authRoute)) {
  const routeContent = fs.readFileSync(authRoute, 'utf-8')
  if (routeContent.includes('GithubProvider')) {
    log('PASS', 'GitHub OAuth provider configured in auth route')
    addResult('OAuth Route', 'pass', 'GitHub provider implemented')
  } else {
    log('FAIL', 'GitHub provider not found in auth route')
    addResult('OAuth Route', 'fail', 'Provider missing from config')
  }
}

// ============ 5. Database ============
log('INFO', 'Validating database configuration...')

const dbUrl = envVars.get('DATABASE_URL')

if (!dbUrl) {
  log('FAIL', 'DATABASE_URL not configured')
  addResult('Database', 'fail', 'No DATABASE_URL')
} else if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
  log('WARN', 'Using local PostgreSQL database')
  addResult('Database', 'warn', 'Local database configured')
  
  // Try to connect to local DB
  try {
    execSync('pg_isready', { stdio: 'pipe' })
    log('PASS', 'Local PostgreSQL appears to be running')
    addResult('Database Connection', 'pass', 'Local Postgres reachable')
  } catch {
    log('WARN', 'Local PostgreSQL not responding')
    addResult('Database Connection', 'warn', 'Cannot connect to local Postgres')
  }
} else if (dbUrl.includes('neon')) {
  log('PASS', 'Neon serverless database configured')
  addResult('Database', 'pass', 'Neon database configured')
} else {
  log('PASS', 'Database URL configured')
  addResult('Database', 'pass', 'DATABASE_URL set')
}

// ============ 6. WebSocket Configuration ============
log('INFO', 'Validating WebSocket setup...')

const wsPort = envVars.get('WS_PORT') || '3200'
const wsUrl = envVars.get('NEXT_PUBLIC_WS_URL')

if (!wsUrl) {
  log('WARN', 'NEXT_PUBLIC_WS_URL not configured')
  addResult('WebSocket', 'warn', 'No WS_URL configured')
} else if (!wsUrl.includes('localhost:3200')) {
  log('WARN', `WebSocket URL is ${wsUrl}, but server uses port ${wsPort}`)
  addResult('WebSocket', 'warn', 'URL/port mismatch')
} else {
  log('PASS', 'WebSocket URL correctly configured')
  addResult('WebSocket', 'pass', 'WS_URL matches server port')
}

// Check WS server file
const wsServer = path.join(process.cwd(), 'backend/src/api/ws-server.ts')
if (fs.existsSync(wsServer)) {
  const wsContent = fs.readFileSync(wsServer, 'utf-8')
  if (wsContent.includes('3200')) {
    log('PASS', 'WebSocket server port 3200 configured')
    addResult('WS Server', 'pass', 'Server port configured')
  } else {
    log('WARN', 'WebSocket server port might not be 3200')
    addResult('WS Server', 'warn', 'Port config unclear')
  }
}

// ============ 7. Build & Packages ============
log('INFO', 'Checking build setup...')

try {
  execSync('pnpm -v', { stdio: 'pipe', encoding: 'utf-8' })
  log('PASS', 'pnpm package manager available')
  addResult('Build Tools', 'pass', 'pnpm available')
} catch {
  try {
    execSync('npm -v', { stdio: 'pipe', encoding: 'utf-8' })
    log('PASS', 'npm package manager available (pnpm preferred)')
    addResult('Build Tools', 'pass', 'npm available')
  } catch {
    log('FAIL', 'No package manager found')
    addResult('Build Tools', 'fail', 'No pnpm/npm')
  }
}

// ============ 8. NextAuth Configuration Check ============
log('INFO', 'Checking NextAuth setup...')

const authConfigFile = path.join(process.cwd(), 'app/api/auth/[...nextauth]/route.ts')
if (fs.existsSync(authConfigFile)) {
  const authConfig = fs.readFileSync(authConfigFile, 'utf-8')
  const issues: string[] = []

  if (!authConfig.includes('NEXTAUTH_SECRET')) {
    issues.push('No NEXTAUTH_SECRET validation')
  }
  if (!authConfig.includes('pages:')) {
    issues.push('No custom pages configured')
  }
  if (!authConfig.includes('callbacks')) {
    issues.push('No callbacks configured')
  }

  if (issues.length === 0) {
    log('PASS', 'NextAuth configuration looks complete')
    addResult('NextAuth Config', 'pass', 'Proper config detected')
  } else {
    log('WARN', `NextAuth config issues: ${issues.join(', ')}`)
    addResult('NextAuth Config', 'warn', issues.join(', '))
  }
}

// ============ Summary ============
console.log('\n' + '='.repeat(60))
log('INFO', 'VALIDATION SUMMARY')
console.log('='.repeat(60))

const grouped = new Map<string, ValidationResult[]>()
results.forEach((r) => {
  if (!grouped.has(r.section)) {
    grouped.set(r.section, [])
  }
  grouped.get(r.section)!.push(r)
})

let passCount = 0
let failCount = 0
let warnCount = 0

grouped.forEach((items, section) => {
  const statuses = items.map((r) => r.status)
  const emoji = statuses.includes('fail') ? '❌' : statuses.includes('warn') ? '⚠️' : '✅'

  console.log(`\n${emoji} ${section}`)
  items.forEach((r) => {
    const icon = r.status === 'pass' ? '✓' : r.status === 'warn' ? '⚠' : '✗'
    console.log(`  ${icon} ${r.message}`)
    r.details?.forEach((d) => console.log(`    - ${d}`))

    if (r.status === 'pass') passCount++
    else if (r.status === 'fail') failCount++
    else if (r.status === 'warn') warnCount++
  })
})

console.log('\n' + '='.repeat(60))
console.log(`Total: ${passCount} passed, ${warnCount} warnings, ${failCount} failed`)
console.log('='.repeat(60))

if (failCount > 0) {
  console.log('\n❌ Setup validation FAILED - Fix issues above before running dev server')
  process.exit(1)
} else if (warnCount > 0) {
  console.log('\n⚠️  Setup validation PASSED with warnings - Some features may not work')
  process.exit(0)
} else {
  console.log('\n✅ Setup validation PASSED - Ready to develop!')
  process.exit(0)
}
