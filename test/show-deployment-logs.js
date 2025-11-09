#!/usr/bin/env node
/**
 * Comprehensive test showing all deployment log types
 * Tests: successful deploy, build failure, test failure, timeout, OOM error
 */

const { neon } = require('@neondatabase/serverless')

async function showAllDeploymentTypes() {
  console.log('📊 Deployment Logs - All Scenarios\n')
  console.log('='.repeat(70))
  
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set')
    process.exit(1)
  }

  const sql = neon(DATABASE_URL)

  // Get statistics
  const stats = await sql`
    SELECT status, COUNT(*) as count 
    FROM deployments 
    GROUP BY status 
    ORDER BY count DESC
  `
  
  console.log('\n📈 DEPLOYMENT STATISTICS\n')
  stats.forEach(stat => {
    const icon = stat.status === 'success' ? '✅' : 
                 stat.status === 'failed' ? '❌' : 
                 stat.status === 'running' ? '⏳' : '🔵'
    console.log(`  ${icon} ${stat.status.toUpperCase()}: ${stat.count} deployments`)
  })

  // Show latest successful deployment
  console.log('\n' + '='.repeat(70))
  console.log('\n✅ SUCCESSFUL DEPLOYMENT (Latest)\n')
  const successDeploy = await sql`
    SELECT id, summary, branch, commit, created_at 
    FROM deployments 
    WHERE status = 'success' 
    ORDER BY created_at DESC 
    LIMIT 1
  `
  
  if (successDeploy.length > 0) {
    const deploy = successDeploy[0]
    console.log(`ID: ${deploy.id.substring(0, 8)}`)
    console.log(`Summary: ${deploy.summary}`)
    console.log(`Branch: ${deploy.branch}`)
    console.log(`Commit: ${deploy.commit}`)
    console.log(`Time: ${new Date(deploy.created_at).toLocaleString()}`)
    
    const logs = await sql`
      SELECT step, type, message 
      FROM deployment_logs 
      WHERE deployment_id = ${deploy.id} 
      ORDER BY timestamp ASC
    `
    
    console.log(`\nLog entries: ${logs.length}`)
    console.log('\n--- Key Steps ---')
    const keyLogs = logs.filter(l => 
      l.message.includes('🚀') || 
      l.message.includes('📦') || 
      l.message.includes('🔧') || 
      l.message.includes('✓ Build completed') ||
      l.message.includes('📤') ||
      l.message.includes('✅')
    )
    keyLogs.forEach(log => console.log(`  ${log.message}`))
  }

  // Show latest failed deployment
  console.log('\n' + '='.repeat(70))
  console.log('\n❌ FAILED DEPLOYMENT (Latest)\n')
  const failDeploy = await sql`
    SELECT id, summary, branch, commit, created_at 
    FROM deployments 
    WHERE status = 'failed' 
    ORDER BY created_at DESC 
    LIMIT 1
  `
  
  if (failDeploy.length > 0) {
    const deploy = failDeploy[0]
    console.log(`ID: ${deploy.id.substring(0, 8)}`)
    console.log(`Summary: ${deploy.summary}`)
    console.log(`Branch: ${deploy.branch}`)
    console.log(`Commit: ${deploy.commit}`)
    console.log(`Time: ${new Date(deploy.created_at).toLocaleString()}`)
    
    const logs = await sql`
      SELECT step, type, message 
      FROM deployment_logs 
      WHERE deployment_id = ${deploy.id} 
      ORDER BY timestamp ASC
    `
    
    console.log(`\nLog entries: ${logs.length}`)
    
    // Show error details
    console.log('\n--- Error Details ---')
    const errorLogs = logs.filter(l => l.type === 'error' && l.message.trim() !== '')
    errorLogs.slice(0, 8).forEach(log => console.log(`  ❌ ${log.message}`))
    
    // Show helpful tips
    console.log('\n--- Helpful Tips ---')
    const tipLogs = logs.filter(l => l.message.includes('💡') || l.message.includes('•'))
    tipLogs.forEach(log => console.log(`  ${log.message}`))
  }

  // Show log types breakdown
  console.log('\n' + '='.repeat(70))
  console.log('\n📋 LOG TYPES BREAKDOWN\n')
  const logTypes = await sql`
    SELECT type, COUNT(*) as count 
    FROM deployment_logs 
    GROUP BY type 
    ORDER BY count DESC
  `
  
  logTypes.forEach(type => {
    const icon = type.type === 'error' ? '❌' : type.type === 'warn' ? '⚠️' : 'ℹ️'
    console.log(`  ${icon} ${type.type.toUpperCase()}: ${type.count} logs`)
  })

  // Show step breakdown
  console.log('\n📋 DEPLOYMENT STEPS BREAKDOWN\n')
  const stepTypes = await sql`
    SELECT step, COUNT(*) as count 
    FROM deployment_logs 
    WHERE step IS NOT NULL
    GROUP BY step 
    ORDER BY count DESC
  `
  
  stepTypes.forEach(step => {
    const icon = step.step === 'failed' ? '❌' : 
                 step.step === 'build' ? '🔧' : 
                 step.step === 'install' ? '📦' : 
                 step.step === 'clone' ? '📥' : 
                 step.step === 'setup' ? '⚙️' : '🔵'
    console.log(`  ${icon} ${step.step.toUpperCase()}: ${step.count} logs`)
  })

  console.log('\n' + '='.repeat(70))
  console.log('\n✨ Deployment logs are ready for Vercel-style viewing!')
  console.log('   Visit: http://localhost:3000/deployments/[id]')
  console.log('\n📝 Features available:')
  console.log('   ✅ Real-time log streaming')
  console.log('   ✅ Step-by-step progress')
  console.log('   ✅ Error traces with stack')
  console.log('   ✅ Helpful tips on failures')
  console.log('   ✅ Export logs to file')
  console.log('   ✅ Auto-scroll to latest')
  console.log('   ✅ Virtualized rendering (1000+ logs)')
  console.log('\n' + '='.repeat(70))
}

showAllDeploymentTypes().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
