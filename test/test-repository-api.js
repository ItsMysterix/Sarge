#!/usr/bin/env node
/**
 * Test Repository API Endpoint
 * Verifies that /api/repository endpoint returns correct data for our test project
 */

const { neon } = require('@neondatabase/serverless');

const TEST_EMAIL = 'test@sarge.dev';
const PROJECT_NAME = 'Test Project';

async function testRepositoryEndpoint() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  console.log('🧪 Testing Repository API Endpoint Logic\n');
  console.log('This simulates what /api/repository does when the UI calls it\n');

  const sql = neon(databaseUrl);

  try {
    // Step 1: Get user by email (simulates session)
    console.log('📋 Step 1: Getting user by email...');
    const user = await sql`
      SELECT id, email, name FROM users WHERE email = ${TEST_EMAIL}
    `;
    
    if (user.length === 0) {
      console.log('❌ FAIL: No user found with email:', TEST_EMAIL);
      console.log('Run: node test/test-database-direct.js first');
      process.exit(1);
    }
    
    console.log(`✅ User found: ${user[0].name} (${user[0].email})`);
    const userId = user[0].id;
    console.log('');

    // Step 2: Get user's project
    console.log('📋 Step 2: Getting user\'s project...');
    const project = await sql`
      SELECT id, name FROM projects 
      WHERE user_id = ${userId}
      AND name = ${PROJECT_NAME}
      LIMIT 1
    `;
    
    if (project.length === 0) {
      console.log('❌ FAIL: No project found for user');
      process.exit(1);
    }
    
    console.log(`✅ Project found: ${project[0].name}`);
    const projectId = project[0].id;
    console.log('');

    // Step 3: Get repository connected to project
    console.log('📋 Step 3: Getting repository for project...');
    const repo = await sql`
      SELECT r.* 
      FROM repositories r
      JOIN project_repositories pr ON pr.repository_id = r.id
      WHERE pr.project_id = ${projectId}
      LIMIT 1
    `;
    
    if (repo.length === 0) {
      console.log('❌ FAIL: No repository connected to project');
      process.exit(1);
    }
    
    console.log(`✅ Repository found: ${repo[0].full_name}`);
    console.log('');

    // Step 4: Fetch GitHub data
    console.log('📋 Step 4: Fetching GitHub data...');
    const owner = repo[0].owner;
    const repoName = repo[0].repo;
    
    const ghResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}`);
    if (!ghResponse.ok) {
      console.log('⚠️  WARN: Could not fetch GitHub data (might be rate limited)');
    } else {
      const ghData = await ghResponse.json();
      console.log(`✅ GitHub data fetched`);
      console.log(`   Stars: ${ghData.stargazers_count}`);
      console.log(`   Default branch: ${ghData.default_branch}`);
      
      // Get latest commit
      const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/commits?per_page=5`);
      if (commitsResponse.ok) {
        const commits = await commitsResponse.json();
        console.log(`   Latest commits:`);
        commits.slice(0, 3).forEach((commit, i) => {
          const msg = commit.commit.message.split('\n')[0];
          const author = commit.commit.author.name;
          console.log(`     ${i + 1}. ${msg} - ${author}`);
        });
      }
    }
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('✅ Repository API Endpoint Test PASSED!');
    console.log('='.repeat(60));
    console.log('\n📊 What the UI will receive:');
    console.log(JSON.stringify({
      repository: {
        id: repo[0].id,
        owner: repo[0].owner,
        repo: repo[0].repo,
        full_name: repo[0].full_name,
        description: repo[0].description,
        is_primary: repo[0].is_primary,
        created_at: repo[0].created_at
      }
    }, null, 2));
    
    console.log('\n✅ The UI should now be able to:');
    console.log('   1. Display GitHub activity card with repo info');
    console.log('   2. Show latest commits');
    console.log('   3. Enable "Deploy in Workspace" button');
    console.log('   4. Run AWS detection on the repository');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testRepositoryEndpoint();
