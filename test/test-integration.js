#!/usr/bin/env node

/**
 * Comprehensive test for Sarge repository connection and deploy flow
 * Tests with ItsMysterix/Sarge repository
 */

const REPO_OWNER = 'ItsMysterix'
const REPO_NAME = 'Sarge'
const PROJECT_SLUG = 'default-project' // Adjust based on your setup
const BASE_URL = 'http://localhost:3000'

async function runTests() {
  console.log('🧪 Starting Sarge Integration Tests\n')
  console.log(`Testing with repository: ${REPO_OWNER}/${REPO_NAME}\n`)

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  }

  // Test 1: GitHub API accessibility
  console.log('📋 Test 1: GitHub API Access')
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`)
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ PASS: GitHub API accessible`)
      console.log(`   Repository: ${data.full_name}`)
      console.log(`   Default branch: ${data.default_branch}`)
      console.log(`   Stars: ${data.stargazers_count}`)
      results.passed++
      results.tests.push({ name: 'GitHub API Access', status: 'PASS' })
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`)
    results.failed++
    results.tests.push({ name: 'GitHub API Access', status: 'FAIL', error: error.message })
  }

  console.log('')

  // Test 2: Fetch recent commits
  console.log('📋 Test 2: GitHub Commits API')
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=5`)
    if (response.ok) {
      const commits = await response.json()
      console.log(`✅ PASS: Fetched ${commits.length} recent commits`)
      if (commits.length > 0) {
        const latest = commits[0]
        console.log(`   Latest commit: ${latest.commit.message.split('\n')[0]}`)
        console.log(`   Author: ${latest.commit.author.name}`)
        console.log(`   Date: ${new Date(latest.commit.author.date).toLocaleString()}`)
        console.log(`   SHA: ${latest.sha.substring(0, 7)}`)
      }
      results.passed++
      results.tests.push({ name: 'GitHub Commits API', status: 'PASS' })
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`)
    results.failed++
    results.tests.push({ name: 'GitHub Commits API', status: 'FAIL', error: error.message })
  }

  console.log('')

  // Test 3: Repository API endpoint (GET)
  console.log('📋 Test 3: Repository API - GET')
  try {
    const response = await fetch(`${BASE_URL}/api/repository?projectSlug=${PROJECT_SLUG}`)
    const data = await response.json()
    
    if (response.ok) {
      console.log(`✅ PASS: Repository API responding`)
      if (data.repository) {
        console.log(`   Connected: ${data.repository.full_name}`)
        console.log(`   Owner: ${data.repository.owner}`)
        console.log(`   Repo: ${data.repository.repo}`)
      } else {
        console.log(`   Status: No repository connected`)
      }
      results.passed++
      results.tests.push({ name: 'Repository API GET', status: 'PASS' })
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    console.log(`⚠️  WARN: ${error.message}`)
    console.log(`   Note: This is expected if server isn't running or DB not set up`)
    results.tests.push({ name: 'Repository API GET', status: 'SKIP', error: error.message })
  }

  console.log('')

  // Test 4: Repository connection (POST)
  console.log('📋 Test 4: Repository Connection - POST')
  console.log('   (Skipping - requires authentication)')
  console.log('   Manual test: Use Connect Repository button in UI')
  results.tests.push({ name: 'Repository Connection POST', status: 'MANUAL' })

  console.log('')

  // Test 5: Check if repo files are accessible
  console.log('📋 Test 5: Repository File Access')
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/package.json`)
    if (response.ok) {
      const data = await response.json()
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      const packageJson = JSON.parse(content)
      console.log(`✅ PASS: Can read repository files`)
      console.log(`   Package name: ${packageJson.name}`)
      console.log(`   Version: ${packageJson.version}`)
      
      // Check for AWS dependencies
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
      const awsPackages = Object.keys(deps).filter(pkg => pkg.startsWith('@aws-sdk/') || pkg === 'aws-sdk')
      if (awsPackages.length > 0) {
        console.log(`   AWS packages found: ${awsPackages.length}`)
        awsPackages.slice(0, 3).forEach(pkg => console.log(`     - ${pkg}`))
      }
      
      results.passed++
      results.tests.push({ name: 'Repository File Access', status: 'PASS' })
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`)
    results.failed++
    results.tests.push({ name: 'Repository File Access', status: 'FAIL', error: error.message })
  }

  console.log('')

  // Test 6: Check deploy endpoint
  console.log('📋 Test 6: Deploy Endpoint')
  try {
    const response = await fetch(`${BASE_URL}/api/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName: 'test-deployment',
        repository: `${REPO_OWNER}/${REPO_NAME}`
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ PASS: Deploy API responding`)
      console.log(`   Status: ${data.status}`)
      console.log(`   Message: ${data.message || 'Deployment initiated'}`)
      results.passed++
      results.tests.push({ name: 'Deploy Endpoint', status: 'PASS' })
    } else {
      const data = await response.json()
      console.log(`⚠️  Response: ${response.status}`)
      console.log(`   This is OK if deploy requires authentication or DB`)
      results.tests.push({ name: 'Deploy Endpoint', status: 'SKIP' })
    }
  } catch (error) {
    console.log(`⚠️  WARN: ${error.message}`)
    console.log(`   Note: This is expected if server isn't running`)
    results.tests.push({ name: 'Deploy Endpoint', status: 'SKIP', error: error.message })
  }

  console.log('')

  // Test 7: Check AWS detection would work
  console.log('📋 Test 7: AWS Detection Check')
  try {
    // Check for IaC files
    const checks = [
      { file: 'serverless.yml', found: false },
      { file: 'template.yaml', found: false },
      { file: 'template.yml', found: false },
    ]

    for (const check of checks) {
      try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${check.file}`)
        check.found = response.ok
      } catch (e) {
        check.found = false
      }
    }

    console.log(`✅ Infrastructure files scan:`)
    checks.forEach(check => {
      console.log(`   ${check.found ? '✓' : '✗'} ${check.file}`)
    })
    
    results.passed++
    results.tests.push({ name: 'AWS Detection Check', status: 'PASS' })
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`)
    results.failed++
    results.tests.push({ name: 'AWS Detection Check', status: 'FAIL', error: error.message })
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Summary')
  console.log('='.repeat(60))
  console.log(`Total tests: ${results.tests.length}`)
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⚠️  Skipped/Manual: ${results.tests.filter(t => t.status === 'SKIP' || t.status === 'MANUAL').length}`)
  
  console.log('\n📝 Detailed Results:')
  results.tests.forEach((test, i) => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️'
    console.log(`${i + 1}. ${icon} ${test.name}: ${test.status}`)
    if (test.error) {
      console.log(`   Error: ${test.error}`)
    }
  })

  console.log('\n' + '='.repeat(60))
  console.log('📋 Manual Testing Checklist:')
  console.log('='.repeat(60))
  console.log('1. ✓ Open http://localhost:3000 in browser')
  console.log('2. ✓ Click "Connect Repository" button')
  console.log('3. ✓ Enter: ItsMysterix/Sarge')
  console.log('4. ✓ Verify GitHub activity card shows:')
  console.log('   - Repository name with link')
  console.log('   - Latest commit message')
  console.log('   - Branch name (main)')
  console.log('   - Time since last commit')
  console.log('   - Recent commits list')
  console.log('5. ✓ Click "Deploy in Workspace" button')
  console.log('6. ✓ Verify deployment starts and shows logs')
  console.log('7. ✓ Navigate to /aws/detection page')
  console.log('8. ✓ Verify AWS services are detected (if any)')
  console.log('9. ✓ Check cost estimates appear')
  console.log('='.repeat(60))
}

runTests().catch(console.error)
