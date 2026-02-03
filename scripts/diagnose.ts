#!/usr/bin/env ts-node
/**
 * Interactive OAuth & Deployment Validator for Sarge
 * Tests OAuth flow, services, and deployment readiness
 */

import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import { execSync } from 'child_process'

interface ServiceConfig {
  name: string
  envVars: string[]
  url?: string
  testCmd?: string
  description: string
}

const services: Record<string, ServiceConfig> = {
  github: {
    name: 'GitHub OAuth',
    envVars: ['GITHUB_ID', 'GITHUB_SECRET'],
    url: 'https://github.com/settings/developers',
    description: 'OAuth authentication and repo access',
  },
  vercel: {
    name: 'Vercel',
    envVars: ['VERCEL_TOKEN'],
    url: 'https://vercel.com/account/tokens',
    description: 'Deployment platform',
  },
  railway: {
    name: 'Railway',
    envVars: ['RAILWAY_TOKEN'],
    url: 'https://railway.app/project',
    description: 'Deployment platform',
  },
  render: {
    name: 'Render',
    envVars: ['RENDER_TOKEN'],
    url: 'https://dashboard.render.com/api-tokens',
    description: 'Deployment platform',
  },
  fly: {
    name: 'Fly.io',
    envVars: ['FLY_API_TOKEN'],
    url: 'https://fly.io/user/personal_access_tokens',
    description: 'Deployment platform',
  },
  aws: {
    name: 'AWS',
    envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
    url: 'https://console.aws.amazon.com/iam',
    description: 'Cloud services (EC2, Lambda, S3)',
  },
  azure: {
    name: 'Azure',
    envVars: ['AZURE_SUBSCRIPTION_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_TENANT_ID'],
    url: 'https://portal.azure.com',
    description: 'Cloud services (App Service, Functions)',
  },
  gcp: {
    name: 'Google Cloud',
    envVars: ['GCP_PROJECT_ID', 'GCP_SERVICE_ACCOUNT_KEY'],
    url: 'https://console.cloud.google.com',
    description: 'Cloud services (Cloud Run, Functions)',
  },
  cloudflare: {
    name: 'Cloudflare',
    envVars: ['CLOUDFLARE_TOKEN'],
    url: 'https://dash.cloudflare.com/profile/api-tokens',
    description: 'CDN and edge computing',
  },
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim())
    })
  })
}

const log = (level: string, msg: string) => {
  const colors: Record<string, string> = {
    INFO: '\x1b[36m',
    PASS: '\x1b[32m',
    FAIL: '\x1b[31m',
    WARN: '\x1b[33m',
    RESET: '\x1b[0m',
  }
  console.log(`${colors[level] || ''}[${level}]${colors.RESET} ${msg}`)
}

const parseEnv = (): Map<string, string> => {
  const envFile = path.join(process.cwd(), '.env')
  const envContent = fs.readFileSync(envFile, 'utf-8')
  const envVars = new Map<string, string>()

  envContent.split('\n').forEach((line) => {
    const [key, ...values] = line.split('=')
    if (key && values) {
      envVars.set(key.trim(), values.join('=').trim().replace(/^["']|["']$/g, ''))
    }
  })

  return envVars
}

async function main() {
  console.clear()
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║          SARGE - OAuth & Service Configuration Validator       ║
║                  Interactive Diagnostics Tool                  ║
╚════════════════════════════════════════════════════════════════╝
`)

  const envVars = parseEnv()

  while (true) {
    console.log(`
📋 MENU
  1) Check OAuth Configuration
  2) Check Deployment Services
  3) Test API Endpoints
  4) Start Dev Server
  5) Run Validation
  6) Run Tests
  7) Open Service Setup Links
  8) View Environment
  0) Exit
`)

    const choice = await question('Select option (0-8): ')

    switch (choice) {
      case '1':
        await checkOAuth(envVars)
        break
      case '2':
        await checkServices(envVars)
        break
      case '3':
        await testEndpoints()
        break
      case '4':
        await startDevServer()
        break
      case '5':
        await runValidation()
        break
      case '6':
        await runTests()
        break
      case '7':
        await openServiceLinks()
        break
      case '8':
        await viewEnvironment(envVars)
        break
      case '0':
        console.log('👋 Goodbye!')
        rl.close()
        return
      default:
        log('WARN', 'Invalid option')
    }

    console.log('')
    await question('Press Enter to continue...')
  }
}

async function checkOAuth(envVars: Map<string, string>) {
  console.log(`
🔐 GITHUB OAUTH CONFIGURATION CHECK
`)

  const githubId = envVars.get('GITHUB_ID')
  const githubSecret = envVars.get('GITHUB_SECRET')
  const nextAuthUrl = envVars.get('NEXTAUTH_URL')
  const nextAuthSecret = envVars.get('NEXTAUTH_SECRET')

  const checks: [string, string | undefined, boolean][] = [
    ['GITHUB_ID', githubId, githubId ? githubId.length > 10 : false],
    ['GITHUB_SECRET', githubSecret, githubSecret ? githubSecret.length > 20 : false],
    ['NEXTAUTH_URL', nextAuthUrl, !!nextAuthUrl?.startsWith('http')],
    ['NEXTAUTH_SECRET', nextAuthSecret, nextAuthSecret ? nextAuthSecret.length > 20 : false],
  ]

  let allPass = true
  for (const [key, value, valid] of checks) {
    if (value) {
      const status = valid ? 'PASS' : 'WARN'
      const display = value.length > 30 ? value.substring(0, 27) + '...' : value
      log(status, `${key}: ${display}`)
      if (!valid) allPass = false
    } else {
      log('FAIL', `${key}: NOT SET`)
      allPass = false
    }
  }

  if (allPass) {
    log('PASS', 'GitHub OAuth is properly configured!')
    console.log(`
✅ Expected callback URL: ${nextAuthUrl}/api/auth/callback/github
   Make sure this matches your GitHub OAuth app settings.

📖 Setup guide: https://github.com/settings/developers
`)
  } else {
    log('FAIL', 'OAuth configuration incomplete')
    console.log(`
⚠️  GitHub OAuth won't work until all variables are configured.
📖 Setup: https://github.com/settings/developers
`)
  }
}

async function checkServices(envVars: Map<string, string>) {
  console.log(`
🚀 DEPLOYMENT SERVICES STATUS
`)

  const results: Array<[string, string, number]> = []

  for (const [key, service] of Object.entries(services)) {
    const configured = service.envVars.filter((v) => envVars.get(v)).length
    const status = configured === service.envVars.length ? 'PASS' : configured > 0 ? 'WARN' : 'FAIL'

    results.push([service.name, status, configured])

    const statusEmoji = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌'
    console.log(`${statusEmoji} ${service.name}: ${configured}/${service.envVars.length} vars`)
    console.log(`   ${service.description}`)
  }

  console.log(`
💡 TIP: To enable deployments, add the required tokens to .env
   Each service requires different credentials.
`)
}

async function testEndpoints() {
  console.log(`
🧪 TESTING API ENDPOINTS
`)

  try {
    const health = await (await fetch('http://localhost:3000/api/health')).json()
    log('PASS', 'Health endpoint responds')
    console.log(JSON.stringify(health, null, 2))
  } catch (error) {
    log('FAIL', 'Cannot reach API - is dev server running?')
    console.log('   Start with: pnpm dev')
  }
}

async function startDevServer() {
  console.log(`
🚀 STARTING DEV SERVER
`)

  console.log('   Running: pnpm dev')
  console.log('   Frontend: http://localhost:3000')
  console.log('   Backend WS: ws://localhost:3200')
  console.log('   (Press Ctrl+C to stop)')

  try {
    execSync('pnpm dev', { stdio: 'inherit' })
  } catch {
    // User pressed Ctrl+C
  }
}

async function runValidation() {
  console.log(`
✅ RUNNING VALIDATION
`)

  try {
    execSync('pnpm validate', { stdio: 'inherit' })
  } catch {
    log('FAIL', 'Validation failed')
  }
}

async function runTests() {
  console.log(`
🧪 TEST MENU
  1) Unit tests (pnpm test)
  2) API tests (pnpm test:api)
  3) E2E tests (pnpm test:e2e)
  4) All tests (pnpm test:all)
  0) Back
`)

  const choice = await question('Select (0-4): ')

  const cmds: Record<string, string> = {
    '1': 'pnpm test',
    '2': 'pnpm test:api',
    '3': 'pnpm test:e2e',
    '4': 'pnpm test:all',
  }

  if (cmds[choice]) {
    try {
      execSync(cmds[choice], { stdio: 'inherit' })
    } catch {
      log('WARN', 'Tests may have failures - see output above')
    }
  }
}

async function openServiceLinks() {
  console.log(`
🌐 SERVICE SETUP LINKS
`)

  for (const [key, service] of Object.entries(services)) {
    if (service.url) {
      console.log(`${service.name}:`)
      console.log(`  🔗 ${service.url}`)
    }
  }

  console.log(`
💡 Open the above links in your browser to generate tokens.
   Then add them to .env and restart the dev server.
`)
}

async function viewEnvironment(envVars: Map<string, string>) {
  console.log(`
📋 ENVIRONMENT VARIABLES
`)

  const grouped: Record<string, string[]> = {
    'NextAuth': [],
    'Database': [],
    'WebSocket': [],
    'Services': [],
  }

  for (const [key, value] of envVars) {
    const display = value.length > 40 ? value.substring(0, 37) + '...' : value
    const masked =
      key.includes('SECRET') || key.includes('PASSWORD') || key.includes('TOKEN') || key.includes('KEY')
        ? '[REDACTED]'
        : display

    if (key.includes('NEXTAUTH') || key.includes('GITHUB')) {
      grouped['NextAuth'].push(`${key}=${masked}`)
    } else if (key.includes('DATABASE')) {
      grouped['Database'].push(`${key}=${masked}`)
    } else if (key.includes('WS')) {
      grouped['WebSocket'].push(`${key}=${masked}`)
    } else {
      grouped['Services'].push(`${key}=${masked}`)
    }
  }

  for (const [group, vars] of Object.entries(grouped)) {
    if (vars.length > 0) {
      console.log(`\n${group}:`)
      vars.forEach((v) => console.log(`  ${v}`))
    }
  }

  console.log(`
⚠️  Sensitive values are redacted above for security.
   Edit .env to view or modify actual values.
`)
}

main().catch(console.error)
