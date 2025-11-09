#!/usr/bin/env node
/**
 * Test deployment logs with detailed build failures (Vercel-style)
 * Creates a realistic failed deployment with step-by-step build logs
 */

const { neon } = require('@neondatabase/serverless')

async function testDeploymentLogs() {
  console.log('🚀 Testing Deployment Logs with Build Failures...\n')
  
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set')
    process.exit(1)
  }

  const sql = neon(DATABASE_URL)
  let passCount = 0
  let failCount = 0

  // Test 1: Create a failed deployment for ItsMysterix/Sarge repo
  console.log('Test 1: Create failed deployment for ItsMysterix/Sarge')
  try {
    const deploymentId = crypto.randomUUID()
    const projectId = await sql`SELECT id FROM projects WHERE name = 'Test Project' LIMIT 1`
    
    if (projectId.length === 0) {
      console.error('  ❌ Test Project not found')
      failCount++
    } else {
      const testProjectId = projectId[0].id
      
      await sql`
        INSERT INTO deployments (
          id, project_id, branch, commit, status, summary, duration_seconds, author, created_at
        ) VALUES (
          ${deploymentId}, ${testProjectId}, 'main', 'abc1234', 'failed',
          'Build failed: Module not found', 45, 'ItsMysterix', NOW()
        )
      `
      
      console.log(`  ✅ Created failed deployment: ${deploymentId}`)
      passCount++
      
      // Test 2: Insert detailed build logs (Vercel-style)
      console.log('\nTest 2: Insert detailed build logs')
      
      const buildLogs = [
        // Git clone
        { step: 'clone', type: 'info', message: '🚀 Starting deployment for ItsMysterix/Sarge', service: 'deploy', delay: 0 },
        { step: 'clone', type: 'info', message: 'Cloning repository from GitHub...', service: 'git', delay: 500 },
        { step: 'clone', type: 'info', message: '> git clone --depth=1 https://github.com/ItsMysterix/Sarge.git', service: 'git', delay: 1000 },
        { step: 'clone', type: 'info', message: 'Cloning into \'Sarge\'...', service: 'git', delay: 1500 },
        { step: 'clone', type: 'info', message: 'remote: Enumerating objects: 247, done.', service: 'git', delay: 2000 },
        { step: 'clone', type: 'info', message: 'remote: Counting objects: 100% (247/247), done.', service: 'git', delay: 2500 },
        { step: 'clone', type: 'info', message: 'remote: Compressing objects: 100% (198/198), done.', service: 'git', delay: 3000 },
        { step: 'clone', type: 'info', message: 'Receiving objects: 100% (247/247), 2.43 MiB | 8.21 MiB/s, done.', service: 'git', delay: 3500 },
        { step: 'clone', type: 'info', message: 'Resolving deltas: 100% (89/89), done.', service: 'git', delay: 4000 },
        { step: 'clone', type: 'info', message: '✓ Repository cloned successfully', service: 'git', delay: 4500 },
        
        // Environment setup
        { step: 'setup', type: 'info', message: '', service: 'build', delay: 5000 },
        { step: 'setup', type: 'info', message: '📋 Analyzing project structure...', service: 'build', delay: 5500 },
        { step: 'setup', type: 'info', message: 'Detected: Next.js 14.2.x', service: 'build', delay: 6000 },
        { step: 'setup', type: 'info', message: 'Node.js version: v20.11.0', service: 'build', delay: 6500 },
        { step: 'setup', type: 'info', message: 'Package manager: pnpm', service: 'build', delay: 7000 },
        { step: 'setup', type: 'info', message: 'Build command: next build', service: 'build', delay: 7500 },
        
        // Install dependencies
        { step: 'install', type: 'info', message: '', service: 'build', delay: 8000 },
        { step: 'install', type: 'info', message: '📦 Installing dependencies...', service: 'build', delay: 8500 },
        { step: 'install', type: 'info', message: '> pnpm install --frozen-lockfile', service: 'build', delay: 9000 },
        { step: 'install', type: 'info', message: 'Lockfile is up to date, resolution step is skipped', service: 'build', delay: 9500 },
        { step: 'install', type: 'info', message: 'Progress: resolved 1, reused 0, downloaded 0, added 0', service: 'build', delay: 10000 },
        { step: 'install', type: 'info', message: 'Progress: resolved 247, reused 189, downloaded 58, added 247', service: 'build', delay: 11000 },
        { step: 'install', type: 'warn', message: 'npm WARN deprecated @types/eslint@7.29.0: This package is deprecated', service: 'build', delay: 11500 },
        { step: 'install', type: 'info', message: 'Progress: resolved 1247, reused 1103, downloaded 144, added 1247', service: 'build', delay: 13000 },
        { step: 'install', type: 'info', message: '', service: 'build', delay: 13500 },
        { step: 'install', type: 'info', message: 'dependencies:', service: 'build', delay: 14000 },
        { step: 'install', type: 'info', message: '+ @neondatabase/serverless 0.9.0', service: 'build', delay: 14200 },
        { step: 'install', type: 'info', message: '+ @trpc/server 10.45.0', service: 'build', delay: 14400 },
        { step: 'install', type: 'info', message: '+ next 14.2.3', service: 'build', delay: 14600 },
        { step: 'install', type: 'info', message: '+ react 18.3.1', service: 'build', delay: 14800 },
        { step: 'install', type: 'info', message: '', service: 'build', delay: 15000 },
        { step: 'install', type: 'info', message: '✓ Done in 12.3s', service: 'build', delay: 15500 },
        
        // Build process
        { step: 'build', type: 'info', message: '', service: 'build', delay: 16000 },
        { step: 'build', type: 'info', message: '🔧 Running build command...', service: 'build', delay: 16500 },
        { step: 'build', type: 'info', message: '> next build', service: 'build', delay: 17000 },
        { step: 'build', type: 'info', message: '', service: 'build', delay: 17500 },
        { step: 'build', type: 'info', message: '   ▲ Next.js 14.2.3', service: 'build', delay: 18000 },
        { step: 'build', type: 'info', message: '', service: 'build', delay: 18500 },
        { step: 'build', type: 'info', message: '   Creating an optimized production build ...', service: 'build', delay: 19000 },
        { step: 'build', type: 'info', message: '✓ Compiled successfully', service: 'build', delay: 21000 },
        { step: 'build', type: 'info', message: '✓ Linting and checking validity of types', service: 'build', delay: 23000 },
        { step: 'build', type: 'info', message: '✓ Collecting page data', service: 'build', delay: 25000 },
        { step: 'build', type: 'error', message: '', service: 'build', delay: 26000 },
        { step: 'build', type: 'error', message: '✗ Error: Cannot find module \'@aws-sdk/client-eventbridge\'', service: 'build', delay: 26500 },
        { step: 'build', type: 'error', message: 'Require stack:', service: 'build', delay: 27000 },
        { step: 'build', type: 'error', message: '- /app/backend/src/services/aws-detector.ts', service: 'build', delay: 27500 },
        { step: 'build', type: 'error', message: '- /app/backend/src/api/routers/aws.ts', service: 'build', delay: 28000 },
        { step: 'build', type: 'error', message: '- /app/backend/src/api/root.ts', service: 'build', delay: 28500 },
        { step: 'build', type: 'error', message: '    at Module._resolveFilename (node:internal/modules/cjs/loader:1039:15)', service: 'build', delay: 29000 },
        { step: 'build', type: 'error', message: '    at Module._load (node:internal/modules/cjs/loader:885:27)', service: 'build', delay: 29500 },
        { step: 'build', type: 'error', message: '    at Module.require (node:internal/modules/cjs/loader:1105:19)', service: 'build', delay: 30000 },
        { step: 'build', type: 'error', message: '    at require (node:internal/modules/cjs/helpers:103:18)', service: 'build', delay: 30500 },
        { step: 'build', type: 'error', message: '    at Object.<anonymous> (/app/backend/src/services/aws-detector.ts:3:1)', service: 'build', delay: 31000 },
        { step: 'build', type: 'error', message: '', service: 'build', delay: 31500 },
        { step: 'build', type: 'error', message: 'Error: Module not found: Can\'t resolve \'@aws-sdk/client-eventbridge\'', service: 'build', delay: 32000 },
        { step: 'build', type: 'error', message: '', service: 'build', delay: 32500 },
        { step: 'build', type: 'error', message: 'This error occurred during the build process and can only be dismissed by fixing the error.', service: 'build', delay: 33000 },
        { step: 'build', type: 'error', message: 'Read more: https://nextjs.org/docs/messages/module-not-found', service: 'build', delay: 33500 },
        
        // Failure summary
        { step: 'failed', type: 'error', message: '', service: 'build', delay: 34000 },
        { step: 'failed', type: 'error', message: '❌ Build failed with exit code: 1', service: 'deploy', delay: 34500 },
        { step: 'failed', type: 'info', message: '', service: 'deploy', delay: 35000 },
        { step: 'failed', type: 'info', message: '💡 Common fixes:', service: 'deploy', delay: 35500 },
        { step: 'failed', type: 'info', message: '   • Run: pnpm add @aws-sdk/client-eventbridge', service: 'deploy', delay: 36000 },
        { step: 'failed', type: 'info', message: '   • Ensure all dependencies are listed in package.json', service: 'deploy', delay: 36500 },
        { step: 'failed', type: 'info', message: '   • Check if the module is available in the registry', service: 'deploy', delay: 37000 },
      ]
      
      let logCount = 0
      for (const log of buildLogs) {
        const logId = crypto.randomUUID()
        const timestamp = new Date(Date.now() - (buildLogs.length - logCount) * 1000)
        
        await sql`
          INSERT INTO deployment_logs (
            id, deployment_id, step, type, message, timestamp
          ) VALUES (
            ${logId}, ${deploymentId}, ${log.step}, ${log.type}, ${log.message}, ${timestamp}
          )
        `
        logCount++
      }
      
      console.log(`  ✅ Inserted ${logCount} detailed build logs`)
      passCount++
    }
  } catch (err) {
    console.error('  ❌ Failed deployment creation failed:', err.message)
    failCount++
  }

  // Test 3: Create a successful deployment with logs
  console.log('\nTest 3: Create successful deployment with logs')
  try {
    const deploymentId = crypto.randomUUID()
    const projectId = await sql`SELECT id FROM projects WHERE name = 'Test Project' LIMIT 1`
    const testProjectId = projectId[0].id
    
    await sql`
      INSERT INTO deployments (
        id, project_id, branch, commit, status, summary, duration_seconds, author, created_at
      ) VALUES (
        ${deploymentId}, ${testProjectId}, 'main', 'def5678', 'success',
        'Deploy successful: ItsMysterix/Sarge@main', 32, 'ItsMysterix', NOW()
      )
    `
    
    console.log(`  ✅ Created successful deployment: ${deploymentId}`)
    
    const successLogs = [
      // Git clone
      { type: 'info', message: '� Starting deployment for ItsMysterix/Sarge', service: 'deploy' },
      { type: 'info', message: 'Cloning repository from GitHub...', service: 'git' },
      { type: 'info', message: '> git clone --depth=1 --branch=main https://github.com/ItsMysterix/Sarge.git', service: 'git' },
      { type: 'info', message: 'Cloning into \'Sarge\'...', service: 'git' },
      { type: 'info', message: 'remote: Enumerating objects: 247, done.', service: 'git' },
      { type: 'info', message: 'remote: Counting objects: 100% (247/247), done.', service: 'git' },
      { type: 'info', message: 'remote: Compressing objects: 100% (198/198), done.', service: 'git' },
      { type: 'info', message: 'Receiving objects: 100% (247/247), 2.43 MiB | 8.21 MiB/s, done.', service: 'git' },
      { type: 'info', message: 'Resolving deltas: 100% (89/89), done.', service: 'git' },
      { type: 'info', message: '✓ Repository cloned successfully', service: 'git' },
      
      // Environment setup
      { type: 'info', message: '', service: 'build' },
      { type: 'info', message: '📋 Analyzing project structure...', service: 'build' },
      { type: 'info', message: 'Detected: Next.js 14.2.x with App Router', service: 'build' },
      { type: 'info', message: 'Node.js version: v20.11.0', service: 'build' },
      { type: 'info', message: 'Package manager: pnpm 9.1.0', service: 'build' },
      { type: 'info', message: 'Framework preset: Next.js', service: 'build' },
      { type: 'info', message: 'Build command: next build', service: 'build' },
      { type: 'info', message: 'Output directory: .next', service: 'build' },
      
      // Install dependencies
      { type: 'info', message: '', service: 'build' },
      { type: 'info', message: '📦 Installing dependencies...', service: 'build' },
      { type: 'info', message: '> pnpm install --frozen-lockfile', service: 'build' },
      { type: 'info', message: 'Lockfile is up to date, resolution step is skipped', service: 'build' },
      { type: 'info', message: 'Packages: +1247', service: 'build' },
      { type: 'info', message: 'Progress: resolved 1247, reused 1103, downloaded 144, added 1247', service: 'build' },
      { type: 'info', message: '', service: 'build' },
      { type: 'info', message: 'dependencies:', service: 'build' },
      { type: 'info', message: '+ @neondatabase/serverless 0.9.0', service: 'build' },
      { type: 'info', message: '+ @trpc/server 10.45.0', service: 'build' },
      { type: 'info', message: '+ next 14.2.3', service: 'build' },
      { type: 'info', message: '+ react 18.3.1', service: 'build' },
      { type: 'info', message: '+ typescript 5.4.5', service: 'build' },
      { type: 'info', message: '', service: 'build' },
      { type: 'info', message: '✓ Done in 8.7s', service: 'build' },
      
      // Build process
      { type: 'info', message: '', service: 'build' },
      { type: 'info', message: '🔧 Running build command...', service: 'build' },
      { type: 'info', message: '> next build', service: 'build' },
      { type: 'info', message: '', service: 'build' },
      { type: 'info', message: '   ▲ Next.js 14.2.3', service: 'build' },
      { type: 'info', message: '   - Environments: .env', service: 'build' },
      { type: 'info', message: '', service: 'build' },
      { type: 'info', message: '   Creating an optimized production build ...', service: 'build' },
      { type: 'info', message: '✓ Compiled successfully', service: 'build' },
      { type: 'info', message: '✓ Linting and checking validity of types', service: 'build' },
      { type: 'info', message: '✓ Collecting page data', service: 'build' },
      { type: 'info', message: '✓ Generating static pages (0/18)', service: 'build' },
      { type: 'info', message: '✓ Generating static pages (9/18)', service: 'build' },
      { type: 'info', message: '✓ Generating static pages (18/18)', service: 'build' },
      { type: 'info', message: '✓ Collecting build traces', service: 'build' },
      { type: 'info', message: '✓ Finalizing page optimization', service: 'build' },
      { type: 'info', message: '', service: 'build' },
      { type: 'info', message: 'Route (app)                              Size     First Load JS', service: 'build' },
      { type: 'info', message: '┌ ○ /                                    5.21 kB        87.2 kB', service: 'build' },
      { type: 'info', message: '├ ○ /_not-found                          871 B          82.8 kB', service: 'build' },
      { type: 'info', message: '├ ○ /api/auth/[...nextauth]             0 B                0 B', service: 'build' },
      { type: 'info', message: '├ ○ /api/deployments                    0 B                0 B', service: 'build' },
      { type: 'info', message: '├ ○ /aws/detection                      142 kB           156 kB', service: 'build' },
      { type: 'info', message: '├ ○ /deployments                        128 kB           142 kB', service: 'build' },
      { type: 'info', message: '├ ƒ /deployments/[id]                   89.3 kB          103 kB', service: 'build' },
      { type: 'info', message: '├ ○ /logs                               94.7 kB          109 kB', service: 'build' },
      { type: 'info', message: '├ ○ /oneclick                           156 kB           170 kB', service: 'build' },
      { type: 'info', message: '├ ○ /projects                           112 kB           126 kB', service: 'build' },
      { type: 'info', message: '├ ○ /settings                           98.2 kB          112 kB', service: 'build' },
      { type: 'info', message: '└ ○ /stacks                             134 kB           148 kB', service: 'build' },
      { type: 'info', message: '+ First Load JS shared by all           82 kB', service: 'build' },
      { type: 'info', message: '  ├ chunks/23-e9dcf48f.js               31.5 kB', service: 'build' },
      { type: 'info', message: '  ├ chunks/fd9d1056-735d320b.js         50.5 kB', service: 'build' },
      { type: 'info', message: '  └ other shared chunks (total)         295 B', service: 'build' },
      { type: 'info', message: '', service: 'build' },
      { type: 'info', message: '○  (Static)   prerendered as static content', service: 'build' },
      { type: 'info', message: 'ƒ  (Dynamic)  server-rendered on demand', service: 'build' },
      { type: 'info', message: '', service: 'build' },
      { type: 'info', message: '✓ Build completed in 24.3s', service: 'build' },
      
      // Upload and deploy
      { type: 'info', message: '', service: 'deploy' },
      { type: 'info', message: '� Uploading build artifacts...', service: 'deploy' },
      { type: 'info', message: 'Compressing 247 files...', service: 'deploy' },
      { type: 'info', message: 'Uploading [==========] 100% (5.2 MB / 5.2 MB)', service: 'deploy' },
      { type: 'info', message: '✓ Upload completed in 2.1s', service: 'deploy' },
      { type: 'info', message: '', service: 'deploy' },
      { type: 'info', message: '🌐 Deploying to production...', service: 'deploy' },
      { type: 'info', message: 'Deploying application to edge network...', service: 'deploy' },
      { type: 'info', message: '✓ Deployed to 12 edge locations', service: 'deploy' },
      { type: 'info', message: '✓ Propagating to global CDN...', service: 'deploy' },
      { type: 'info', message: '✓ Assigned deployment URL', service: 'deploy' },
      { type: 'info', message: '', service: 'deploy' },
      { type: 'info', message: '✅ Deployment completed successfully!', service: 'deploy' },
      { type: 'info', message: '', service: 'deploy' },
      { type: 'info', message: '🔗 Production: https://sarge-production.vercel.app', service: 'deploy' },
      { type: 'info', message: '🔗 Preview: https://sarge-git-main-itsmysterix.vercel.app', service: 'deploy' },
      { type: 'info', message: '', service: 'deploy' },
      { type: 'info', message: '📊 Deployment Summary:', service: 'deploy' },
      { type: 'info', message: '   Duration: 35.1s', service: 'deploy' },
      { type: 'info', message: '   Build: 24.3s', service: 'deploy' },
      { type: 'info', message: '   Upload: 2.1s', service: 'deploy' },
      { type: 'info', message: '   Deploy: 8.7s', service: 'deploy' },
    ]
    
    let logCount = 0
    for (const log of successLogs) {
      const logId = crypto.randomUUID()
      const timestamp = new Date(Date.now() - (successLogs.length - logCount) * 500)
      
      await sql`
        INSERT INTO deployment_logs (
          id, deployment_id, type, message, timestamp
        ) VALUES (
          ${logId}, ${deploymentId}, ${log.type}, ${log.message}, ${timestamp}
        )
      `
      logCount++
    }
    
    console.log(`  ✅ Inserted ${logCount} success build logs`)
    passCount++
  } catch (err) {
    console.error('  ❌ Successful deployment creation failed:', err.message)
    failCount++
  }

  // Test 4: Query deployment logs
  console.log('\nTest 4: Query deployment logs')
  try {
    const recentDeploy = await sql`
      SELECT id FROM deployments WHERE status = 'failed' ORDER BY created_at DESC LIMIT 1
    `
    
    if (recentDeploy.length === 0) {
      console.log('  ⚠️  No failed deployments found')
    } else {
      const recentLogs = await sql`
        SELECT step, type, message, timestamp 
        FROM deployment_logs 
        WHERE deployment_id = ${recentDeploy[0].id}
        ORDER BY timestamp ASC 
        LIMIT 10
      `
      
      console.log(`  ✅ Found ${recentLogs.length} logs for deployment ${recentDeploy[0].id.substring(0, 8)}`)
      console.log('  Recent logs:')
      recentLogs.slice(0, 5).forEach(log => {
        const icon = log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : 'ℹ️'
        const stepLabel = log.step ? `[${log.step}]` : ''
        console.log(`    ${icon} ${stepLabel} ${log.message.substring(0, 50)}${log.message.length > 50 ? '...' : ''}`)
      })
    }
    passCount++
  } catch (err) {
    console.error('  ❌ Log query failed:', err.message)
    failCount++
  }

  // Test 5: Count deployments by status
  console.log('\nTest 5: Count deployments by status')
  try {
    const stats = await sql`
      SELECT status, COUNT(*) as count 
      FROM deployments 
      GROUP BY status 
      ORDER BY count DESC
    `
    
    console.log('  ✅ Deployment statistics:')
    stats.forEach(stat => {
      const icon = stat.status === 'success' ? '✅' : stat.status === 'failed' ? '❌' : '⏳'
      console.log(`    ${icon} ${stat.status}: ${stat.count}`)
    })
    passCount++
  } catch (err) {
    console.error('  ❌ Stats query failed:', err.message)
    failCount++
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log(`✅ Tests passed: ${passCount}`)
  console.log(`❌ Tests failed: ${failCount}`)
  console.log('='.repeat(60))

  if (failCount > 0) {
    console.log('\n⚠️  Some tests failed. Check the errors above.')
    process.exit(1)
  } else {
    console.log('\n🎉 All deployment log tests passed!')
    console.log('\n📊 Summary:')
    console.log('  - Created failed deployment with detailed build error logs')
    console.log('  - Created successful deployment with complete build logs')
    console.log('  - Logs include step information, error traces, and tips')
    console.log('  - Ready for Vercel-style deployment log viewing')
  }
}

testDeploymentLogs().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
