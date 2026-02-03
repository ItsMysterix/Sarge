#!/usr/bin/env node
/**
 * Simple OAuth validation test - no vitest required
 */

const BASE_URL = 'http://localhost:3000'

async function test(name, fn) {
  try {
    await fn()
    console.log(`✅ ${name}`)
    return true
  } catch (e) {
    console.error(`❌ ${name}`)
    console.error(`   ${e.message}`)
    return false
  }
}

async function main() {
  console.log('🧪 Testing GitHub OAuth Setup\n')

  let passed = 0
  let failed = 0

  // Test 1: Health endpoint
  if (await test('Health endpoint returns 200', async () => {
    const res = await fetch(`${BASE_URL}/api/health`)
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
  })) passed++; else failed++

  // Test 2: NextAuth config in health
  if (await test('NextAuth config visible in health', async () => {
    const res = await fetch(`${BASE_URL}/api/health`)
    const data = await res.json()
    if (!data.nextauth) throw new Error('Missing nextauth config')
    if (!data.nextauth.url) throw new Error('Missing nextauth.url')
    if (!data.nextauth.callbackUrl) throw new Error('Missing nextauth.callbackUrl')
  })) passed++; else failed++

  // Test 3: Auth providers endpoint
  if (await test('Auth providers endpoint exists', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/providers`)
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
  })) passed++; else failed++

  // Test 4: GitHub provider configured
  if (await test('GitHub provider in providers list', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/providers`)
    const data = await res.json()
    if (!data.github) throw new Error('GitHub provider not found')
  })) passed++; else failed++

  // Test 5: Sign-in page loads
  if (await test('Sign-in page loads', async () => {
    const res = await fetch(`${BASE_URL}/sign-in`)
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const html = await res.text()
    if (!html.includes('sign-in')) throw new Error('Sign-in page not found')
  })) passed++; else failed++

  // Test 6: GitHub sign-in redirect
  if (await test('GitHub OAuth initiates redirect', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signin?provider=github&callbackUrl=/`, {
      redirect: 'manual',
    })
    // Should be redirect to GitHub
    if (![302, 307].includes(res.status)) {
      throw new Error(`Expected redirect, got ${res.status}`)
    }
  })) passed++; else failed++

  // Test 7: Callback URL structure
  if (await test('Callback URL properly configured', async () => {
    const res = await fetch(`${BASE_URL}/api/health`)
    const data = await res.json()
    const callbackUrl = data.nextauth.callbackUrl
    if (!callbackUrl.includes('/api/auth/callback/github')) {
      throw new Error(`Invalid callback URL: ${callbackUrl}`)
    }
  })) passed++; else failed++

  // Test 8: OAuth callback endpoint exists
  if (await test('OAuth callback endpoint accessible', async () => {
    const res = await fetch(
      `${BASE_URL}/api/auth/callback/github?code=test&state=test`,
      { redirect: 'manual' }
    )
    // Should not be 404
    if (res.status === 404) {
      throw new Error('Callback endpoint returned 404 - route not found!')
    }
  })) passed++; else failed++

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    console.log('\n❌ OAuth setup has issues. Check:')
    console.log('   1. .env has NEXTAUTH_URL=http://localhost:3000')
    console.log('   2. .env has valid GITHUB_ID and GITHUB_SECRET')
    console.log('   3. GitHub app callback URL is http://localhost:3000/api/auth/callback/github')
    console.log('   4. Dev server running: pnpm dev')
    process.exit(1)
  } else {
    console.log('\n✅ OAuth setup is correct!')
  }
}

main().catch(console.error)
