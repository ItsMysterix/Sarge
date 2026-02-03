/**
 * test/oauth-github.test.js
 * Test GitHub OAuth configuration without external dependencies
 */

const http = require('http')

function makeRequest(pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'localhost',
      port: 3000,
      path: pathname,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'OAuth-Test',
        ...options.headers,
      },
      redirect: 'manual',
    }

    const req = http.request(requestOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        })
      })
    })

    req.on('error', reject)
    req.end()
  })
}

async function testGitHubOAuth() {
  console.log('🧪 GitHub OAuth Configuration Tests\n')

  const tests = []

  try {
    // Test 1: Health endpoint
    console.log('Testing: Health endpoint...')
    const health = await makeRequest('/api/health')
    tests.push({
      name: 'Health endpoint returns 200',
      pass: health.status === 200,
      actual: `Status ${health.status}`,
    })

    let healthData = {}
    if (health.body) {
      try {
        healthData = JSON.parse(health.body)
      } catch (e) {
        // Not JSON
      }
    }

    tests.push({
      name: 'NextAuth URL configured',
      pass: healthData.nextauth && healthData.nextauth.url,
      actual: healthData.nextauth?.url || 'Missing',
    })

    tests.push({
      name: 'GitHub OAuth callback URL valid',
      pass: healthData.nextauth && healthData.nextauth.callbackUrl && healthData.nextauth.callbackUrl.includes('/api/auth/callback/github'),
      actual: healthData.nextauth?.callbackUrl || 'Missing',
    })

    tests.push({
      name: 'GitHub provider configured',
      pass: healthData.github_oauth && healthData.github_oauth.status === 'ready',
      actual: healthData.github_oauth?.status || 'Missing',
    })

    // Test 2: Auth providers endpoint
    console.log('Testing: Auth providers endpoint...')
    const providers = await makeRequest('/api/auth/providers')
    tests.push({
      name: 'Auth providers endpoint accessible',
      pass: providers.status === 200,
      actual: `Status ${providers.status}`,
    })

    let providersData = {}
    if (providers.body) {
      try {
        providersData = JSON.parse(providers.body)
      } catch (e) {
        // Not JSON
      }
    }

    tests.push({
      name: 'GitHub provider in providers list',
      pass: providersData.github !== undefined,
      actual: Object.keys(providersData).join(', ') || 'No providers found',
    })

    // Test 3: Sign-in page
    console.log('Testing: Sign-in page...')
    const signin = await makeRequest('/sign-in')
    tests.push({
      name: 'Sign-in page loads',
      pass: signin.status === 200,
      actual: `Status ${signin.status}`,
    })

    tests.push({
      name: 'Sign-in page contains GitHub elements',
      pass: signin.body.includes('GitHub') || signin.body.includes('github'),
      actual: 'Page checked',
    })

    // Test 4: OAuth initiation
    console.log('Testing: OAuth initiation...')
    const oauthInit = await makeRequest('/api/auth/signin?provider=github&callbackUrl=/', { redirect: 'manual' })
    tests.push({
      name: 'GitHub OAuth initiates redirect',
      pass: [302, 307].includes(oauthInit.status),
      actual: `Status ${oauthInit.status}`,
    })

    if (oauthInit.headers.location) {
      tests.push({
        name: 'Redirect points to GitHub',
        pass: oauthInit.headers.location.includes('github.com'),
        actual: oauthInit.headers.location.substring(0, 60),
      })
    }

    // Test 5: Callback endpoint
    console.log('Testing: OAuth callback endpoint...')
    const callback = await makeRequest('/api/auth/callback/github?code=test&state=test', { redirect: 'manual' })
    tests.push({
      name: 'Callback endpoint is not 404',
      pass: callback.status !== 404,
      actual: `Status ${callback.status}`,
    })

    // Print results
    console.log('\n📊 TEST RESULTS\n')
    let passed = 0
    let failed = 0

    tests.forEach((test) => {
      const icon = test.pass ? '✅' : '❌'
      console.log(`${icon} ${test.name}`)
      console.log(`   → ${test.actual}`)
      if (test.pass) passed++
      else failed++
    })

    console.log(`\n📈 Summary: ${passed} passed, ${failed} failed\n`)

    if (failed > 0) {
      console.log('⚠️  GitHub OAuth issues detected')
      console.log('\nChecklist:')
      console.log('  • Ensure dev server running: pnpm dev')
      console.log('  • Check .env has GITHUB_ID and GITHUB_SECRET')
      console.log('  • Verify GitHub app callback URL')
      console.log('  • Check NEXTAUTH_URL=http://localhost:3000')
      process.exit(1)
    } else {
      console.log('✅ All OAuth tests passed!')
      process.exit(0)
    }
  } catch (error) {
    console.error('❌ Test error:', error.message)
    console.error('\n⚠️  Cannot connect to dev server')
    console.error('Start server with: pnpm dev')
    process.exit(1)
  }
}

testGitHubOAuth()
