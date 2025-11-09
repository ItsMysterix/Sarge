#!/usr/bin/env node
/**
 * Test Stacks with Database
 * Creates a test stack with connected repository services
 */

const { neon } = require('@neondatabase/serverless');

const TEST_EMAIL = 'test@sarge.dev';

async function testStacks() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  console.log('🧪 Testing Stacks with Database\n');

  const sql = neon(databaseUrl);

  try {
    // Step 1: Verify user and repository exist
    console.log('📋 Step 1: Verifying test data...');
    const user = await sql`SELECT id FROM users WHERE email = ${TEST_EMAIL}`;
    if (user.length === 0) {
      console.log('❌ No test user found. Run: node test/test-database-direct.js');
      process.exit(1);
    }

    const repo = await sql`
      SELECT r.* FROM repositories r
      WHERE r.user_id = ${user[0].id}
      LIMIT 1
    `;

    if (repo.length === 0) {
      console.log('❌ No repository found. Run: node test/test-database-direct.js');
      process.exit(1);
    }

    console.log(`✅ User and repository found`);
    console.log('');

    // Step 2: Check existing stacks
    console.log('📋 Step 2: Checking existing stacks...');
    const existingStacks = await sql`
      SELECT id, name, status, services, created_at
      FROM stacks
      ORDER BY created_at DESC
      LIMIT 5
    `;

    if (existingStacks.length > 0) {
      console.log(`✅ Found ${existingStacks.length} existing stack(s):`);
      existingStacks.forEach((stack, idx) => {
        const serviceCount = Array.isArray(stack.services) ? stack.services.length : 0;
        console.log(`   ${idx + 1}. ${stack.name} - ${stack.status} (${serviceCount} services)`);
      });
    } else {
      console.log('   No existing stacks found');
    }
    console.log('');

    // Step 3: Create a test stack
    console.log('📋 Step 3: Creating test stack...');
    const stackName = `Test Stack - ${repo[0].repo}`;
    const services = [
      {
        name: 'frontend',
        type: 'web',
        port: 3000,
        command: 'npm run dev:frontend',
        repo_id: repo[0].id
      },
      {
        name: 'backend',
        type: 'api',
        port: 3200,
        command: 'npm run dev:backend',
        repo_id: repo[0].id
      }
    ];

    const newStack = await sql`
      INSERT INTO stacks (
        name,
        description,
        status,
        services,
        environment,
        resource_usage
      )
      VALUES (
        ${stackName},
        ${`Stack for ${repo[0].full_name} repository`},
        'stopped',
        ${JSON.stringify(services)}::jsonb,
        ${JSON.stringify({ NODE_ENV: 'development' })}::jsonb,
        ${JSON.stringify({ containers: 2 })}::jsonb
      )
      RETURNING *
    `;

    console.log(`✅ Stack created: ${newStack[0].name}`);
    console.log(`   ID: ${newStack[0].id}`);
    console.log(`   Status: ${newStack[0].status}`);
    console.log(`   Services: ${Array.isArray(newStack[0].services) ? newStack[0].services.length : 0}`);
    console.log('');

    // Step 4: Retrieve all stacks (simulating UI query)
    console.log('📋 Step 4: Fetching all stacks (UI query)...');
    const allStacks = await sql`
      SELECT 
        id, 
        name, 
        description, 
        status, 
        services, 
        environment,
        resource_usage,
        created_at,
        updated_at
      FROM stacks
      ORDER BY created_at DESC
    `;

    console.log(`✅ Retrieved ${allStacks.length} stack(s):`);
    allStacks.forEach((stack, idx) => {
      const services = Array.isArray(stack.services) ? stack.services : [];
      console.log(`\n   ${idx + 1}. ${stack.name}`);
      console.log(`      Description: ${stack.description || 'N/A'}`);
      console.log(`      Status: ${stack.status}`);
      console.log(`      Services (${services.length}):`);
      services.forEach((svc, sIdx) => {
        console.log(`        ${sIdx + 1}. ${svc.name} (${svc.type}) - Port ${svc.port || 'N/A'}`);
      });
      if (stack.resource_usage) {
        const usage = typeof stack.resource_usage === 'string' 
          ? JSON.parse(stack.resource_usage) 
          : stack.resource_usage;
        if (usage.containers) {
          console.log(`      Containers: ${usage.containers}`);
        }
      }
    });
    console.log('');

    // Step 5: Update stack status
    console.log('📋 Step 5: Testing status update...');
    await sql`
      UPDATE stacks 
      SET status = 'running', updated_at = NOW()
      WHERE id = ${newStack[0].id}
    `;
    console.log(`✅ Stack status updated to 'running'`);
    console.log('');

    // Step 6: Get stack stats
    console.log('📋 Step 6: Getting stack statistics...');
    const stats = await sql`
      SELECT 
        COUNT(*) as total_stacks,
        COUNT(*) FILTER (WHERE status = 'running') as running,
        COUNT(*) FILTER (WHERE status = 'stopped') as stopped,
        COUNT(*) FILTER (WHERE status = 'error') as error
      FROM stacks
    `;

    console.log(`✅ Stack Statistics:`);
    console.log(`   Total: ${stats[0].total_stacks}`);
    console.log(`   Running: ${stats[0].running}`);
    console.log(`   Stopped: ${stats[0].stopped}`);
    console.log(`   Error: ${stats[0].error}`);
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('✅ Stacks Test Complete!');
    console.log('='.repeat(60));
    console.log('\n📊 What the UI will show:');
    console.log(`   - ${allStacks.length} stack(s) in the stacks page`);
    console.log(`   - Each stack shows services, status, and resource usage`);
    console.log(`   - Users can start/stop stacks`);
    console.log(`   - Users can view stack deployments history`);
    console.log('');
    console.log('🎯 No mock data - everything from database!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testStacks();
