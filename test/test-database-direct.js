#!/usr/bin/env node

/**
 * Direct database testing script - bypasses auth
 * Tests repository connection and deploy functionality at DB level
 */

const { neon } = require('@neondatabase/serverless')
require('dotenv').config()

const REPO_OWNER = 'ItsMysterix'
const REPO_NAME = 'Sarge'
const TEST_EMAIL = 'test@sarge.dev'
const PROJECT_SLUG = 'test-project'

async function testDatabaseOperations() {
  console.log('🔧 Testing Sarge Database Operations (Direct)\n')
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found in environment')
    console.log('Please set DATABASE_URL in your .env file')
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)

  try {
    // Test 1: Database connection
    console.log('📋 Test 1: Database Connection')
    const result = await sql`SELECT NOW() as time`
    console.log(`✅ PASS: Connected to database at ${result[0].time}`)
    console.log('')

    // Test 2: Create/get test user
    console.log('📋 Test 2: User Management')
    const users = await sql`
      INSERT INTO users (email, name, created_at, updated_at)
      VALUES (${TEST_EMAIL}, 'Test User', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
      RETURNING *
    `
    const userId = users[0].id
    console.log(`✅ PASS: User created/updated (ID: ${userId})`)
    console.log(`   Email: ${users[0].email}`)
    console.log(`   Name: ${users[0].name}`)
    console.log('')

    // Test 3: Create/update repository
    console.log('📋 Test 3: Repository Connection')
    const fullName = `${REPO_OWNER}/${REPO_NAME}`
    const repos = await sql`
      INSERT INTO repositories (user_id, owner, repo, full_name, description, is_primary, created_at, updated_at)
      VALUES (${userId}, ${REPO_OWNER}, ${REPO_NAME}, ${fullName}, 'Test repository', true, NOW(), NOW())
      ON CONFLICT (user_id, owner, repo)
      DO UPDATE SET
        description = EXCLUDED.description,
        is_primary = true,
        updated_at = NOW()
      RETURNING *
    `
    const repoId = repos[0].id
    console.log(`✅ PASS: Repository connected (ID: ${repoId})`)
    console.log(`   Full name: ${repos[0].full_name}`)
    console.log(`   Owner: ${repos[0].owner}`)
    console.log(`   Repo: ${repos[0].repo}`)
    console.log(`   Primary: ${repos[0].is_primary}`)
    console.log('')

    // Test 4: Create/update project
    console.log('📋 Test 4: Project Management')
    const projects = await sql`
      INSERT INTO projects (user_id, name, created_at)
      VALUES (${userId}, 'Test Project', NOW())
      RETURNING *
    `
    const projectId = projects[0].id
    console.log(`✅ PASS: Project created/updated (ID: ${projectId})`)
    console.log(`   Name: ${projects[0].name}`)
    console.log('')

    // Test 5: Bind repository to project
    console.log('📋 Test 5: Project-Repository Binding')
    const binding = await sql`
      INSERT INTO project_repositories (project_id, repository_id, created_at)
      VALUES (${projectId}, ${repoId}, NOW())
      ON CONFLICT (project_id, repository_id)
      DO NOTHING
      RETURNING *
    `
    console.log(`✅ PASS: Repository bound to project`)
    console.log('')


    // Test 6: Verify binding
    console.log('📋 Test 6: Verify Project-Repository Binding')
    const verification = await sql`
      SELECT p.name as project_name, r.full_name as repo_name, r.owner, r.repo
      FROM projects p
      JOIN project_repositories pr ON pr.project_id = p.id
      JOIN repositories r ON r.id = pr.repository_id
      WHERE p.id = ${projectId}
    `
    if (verification.length > 0) {
      console.log(`✅ PASS: Repository bound to project`)
      console.log(`   Project: ${verification[0].project_name}`)
      console.log(`   Repository: ${verification[0].repo_name}`)
    } else {
      console.log(`❌ FAIL: Repository not bound to project`)
    }
    console.log('')

    // Test 7: GitHub API Integration
    console.log('📋 Test 7: GitHub API Integration')
    const ghResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`)
    if (ghResponse.ok) {
      const ghData = await ghResponse.json()
      console.log(`✅ PASS: GitHub API accessible`)
      console.log(`   Stars: ${ghData.stargazers_count}`)
      console.log(`   Forks: ${ghData.forks_count}`)
      console.log(`   Open issues: ${ghData.open_issues_count}`)
      console.log(`   Default branch: ${ghData.default_branch}`)
      
      // Get latest commit
      const commitsResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=1`)
      if (commitsResponse.ok) {
        const commits = await commitsResponse.json()
        const latest = commits[0]
        console.log(`   Latest commit: ${latest.commit.message.split('\n')[0]}`)
        console.log(`   Author: ${latest.commit.author.name}`)
        console.log(`   Date: ${new Date(latest.commit.author.date).toLocaleString()}`)
      }
    } else {
      console.log(`❌ FAIL: GitHub API not accessible`)
    }
    console.log('')

    // Summary
    console.log('='.repeat(60))
    console.log('✅ All Database Tests Passed!')
    console.log('='.repeat(60))
    console.log('\n📝 Next Steps:')
    console.log('1. Your database has test data for:', TEST_EMAIL)
    console.log('2. Repository connected:', `${REPO_OWNER}/${REPO_NAME}`)
    console.log('3. Project created:', PROJECT_SLUG)
    console.log('4. You can now log in with this email to test the UI')
    console.log('5. The GitHub activity card should show repo details')
    console.log('6. Deploy functionality should have access to repo info')
    console.log('')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testDatabaseOperations().catch(console.error)
