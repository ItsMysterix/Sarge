#!/usr/bin/env node

/**
 * Quick test using development endpoints
 * Tests repository connection via API
 */

const BASE_URL = 'http://localhost:3000'
const TEST_EMAIL = 'test@sarge.dev'
const REPO_OWNER = 'ItsMysterix'
const REPO_NAME = 'Sarge'
const PROJECT_SLUG = 'test-project'

async function quickTest() {
  console.log('🚀 Quick API Test (Using Dev Endpoints)\n')

  // Test 1: Connect repository via dev endpoint
  console.log('📋 Test 1: Connect Repository (Dev Endpoint)')
  try {
    const response = await fetch(`${BASE_URL}/api/dev/test-repo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        owner: REPO_OWNER,
        repo: REPO_NAME,
        projectSlug: PROJECT_SLUG,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ PASS: Repository connected`)
      console.log(`   Message: ${data.message}`)
      console.log(`   Repository: ${data.repository.full_name}`)
      if (data.github) {
        console.log(`   Stars: ${data.github.stars}`)
        console.log(`   Forks: ${data.github.forks}`)
        console.log(`   Branch: ${data.github.default_branch}`)
      }
    } else {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`)
    console.log(`   Make sure frontend server is running: npm run dev:frontend`)
    process.exit(1)
  }

  console.log('')

  // Test 2: Retrieve test data
  console.log('📋 Test 2: Retrieve Connected Repository')
  try {
    const response = await fetch(`${BASE_URL}/api/dev/test-repo?email=${TEST_EMAIL}`)

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ PASS: Test data retrieved`)
      console.log(`   Email: ${data.testData.email}`)
      console.log(`   Repository: ${data.testData.full_name}`)
      console.log(`   Project: ${data.testData.project_name} (${data.testData.project_slug})`)
      console.log(`   Primary: ${data.testData.is_primary}`)
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`)
  }

  console.log('')

  // Test 3: Check GitHub activity data
  console.log('📋 Test 3: GitHub Activity Data')
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=3`)
    if (response.ok) {
      const commits = await response.json()
      console.log(`✅ PASS: Fetched ${commits.length} commits`)
      console.log(`   Latest: ${commits[0].commit.message.split('\n')[0]}`)
      console.log(`   Author: ${commits[0].commit.author.name}`)
      console.log(`   Time: ${new Date(commits[0].commit.author.date).toLocaleString()}`)
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`)
  }

  console.log('')
  console.log('='.repeat(60))
  console.log('✅ API Tests Complete!')
  console.log('='.repeat(60))
  console.log('\n📝 Manual UI Testing:')
  console.log(`1. Open: ${BASE_URL}`)
  console.log(`2. Sign in with email: ${TEST_EMAIL}`)
  console.log('3. Navigate to dashboard')
  console.log('4. You should see:')
  console.log(`   ✓ Connected repository: ${REPO_OWNER}/${REPO_NAME}`)
  console.log('   ✓ Latest commit message')
  console.log('   ✓ Branch name (main)')
  console.log('   ✓ Recent commits list')
  console.log('5. Try "Deploy in Workspace" button')
  console.log(`6. Navigate to: ${BASE_URL}/aws/detection`)
  console.log('7. Should auto-detect AWS services')
  console.log('')
}

quickTest().catch(console.error)
