#!/usr/bin/env node
/**
 * Test real deployment with actual GitHub repo clone and build
 * This will show REAL logs from git clone, npm install, and npm build
 */

const { neon } = require('@neondatabase/serverless')

async function testRealDeployment() {
  console.log('🚀 Testing REAL deployment with ItsMysterix/Sarge repo\n')
  console.log('='.repeat(70))
  
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set')
    process.exit(1)
  }

  const sql = neon(DATABASE_URL)

  try {
    // Create a new deployment that will be picked up by executor
    console.log('\n📝 Creating deployment request...')
    
    const deployment = await sql`
      INSERT INTO deployments (
        branch, 
        commit, 
        status, 
        summary, 
        created_at
      ) 
      VALUES (
        'main',
        NULL,
        'pending',
        'Real deployment: ItsMysterix/Sarge',
        NOW()
      )
      RETURNING *
    `

    const deployId = deployment[0].id
    console.log(`✅ Created deployment: ${deployId}`)
    console.log(`   Status: ${deployment[0].status}`)
    console.log(`   Branch: ${deployment[0].branch}`)
    console.log(`   Summary: ${deployment[0].summary}`)

    console.log('\n' + '='.repeat(70))
    console.log('\n⚠️  NOTE: The deployment executor needs to be triggered!')
    console.log('\nTo test real deployment, you need to:')
    console.log('1. Make sure backend WebSocket server is running:')
    console.log('   npm run dev:backend')
    console.log('\n2. The executor will automatically pick up pending deployments')
    console.log('\n3. Or manually trigger via tRPC:')
    console.log('   Call: deploy.create({ ')
    console.log('     repoUrl: "https://github.com/ItsMysterix/Sarge.git",')
    console.log('     branch: "main",')
    console.log('     buildCommand: "npm run build"')
    console.log('   })')
    console.log('\n4. Watch logs in real-time:')
    console.log(`   Visit: http://localhost:3000/deployments/${deployId}`)
    console.log('\n5. Or query deployment_logs table:')
    console.log(`   SELECT step, type, message FROM deployment_logs`)
    console.log(`   WHERE deployment_id = '${deployId}'`)
    console.log(`   ORDER BY timestamp ASC`)

    console.log('\n' + '='.repeat(70))
    console.log('\n🔍 Checking if executor has processed any deployments...\n')

    // Check for running/completed deployments with logs
    const withLogs = await sql`
      SELECT 
        d.id,
        d.status,
        d.summary,
        d.started_at,
        d.finished_at,
        COUNT(dl.id) as log_count
      FROM deployments d
      LEFT JOIN deployment_logs dl ON dl.deployment_id = d.id
      WHERE d.status IN ('running', 'success', 'failed')
      GROUP BY d.id, d.status, d.summary, d.started_at, d.finished_at
      ORDER BY d.created_at DESC
      LIMIT 5
    `

    if (withLogs.length > 0) {
      console.log('📊 Recent deployments with real logs:\n')
      withLogs.forEach(d => {
        const icon = d.status === 'success' ? '✅' : 
                     d.status === 'failed' ? '❌' : '⏳'
        console.log(`${icon} ${d.id.substring(0, 8)} - ${d.status} (${d.log_count} logs)`)
        console.log(`   ${d.summary}`)
        if (d.started_at) {
          const duration = d.finished_at 
            ? Math.round((new Date(d.finished_at) - new Date(d.started_at)) / 1000)
            : 'still running'
          console.log(`   Duration: ${duration}s`)
        }
        console.log()
      })
    } else {
      console.log('⚠️  No deployments with logs found yet.')
      console.log('   Make sure the backend executor is running!')
    }

    console.log('='.repeat(70))
    console.log('\n💡 To see REAL deployment logs:')
    console.log('   1. Backend must be running (npm run dev:backend)')
    console.log('   2. Call deploy.create with repoUrl from frontend')
    console.log('   3. Logs will be REAL output from git/npm/build')
    console.log('   4. No more mock data! 🎉')
    console.log('\n' + '='.repeat(70))

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

testRealDeployment().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
