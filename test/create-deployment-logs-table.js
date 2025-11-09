#!/usr/bin/env node
/**
 * Create deployment_logs table to link logs with deployments
 * This allows showing detailed build logs for each deployment
 */

const { neon } = require('@neondatabase/serverless')

async function createDeploymentLogsTable() {
  console.log('🔧 Creating deployment_logs table...\n')
  
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set')
    process.exit(1)
  }

  const sql = neon(DATABASE_URL)

  try {
    // Create deployment_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS deployment_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
        step VARCHAR(50),
        type VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log('✅ Created deployment_logs table')

    // Create index for fast queries by deployment_id
    await sql`
      CREATE INDEX IF NOT EXISTS idx_deployment_logs_deployment_id 
      ON deployment_logs(deployment_id, timestamp DESC)
    `
    console.log('✅ Created index on deployment_id')

    // Create index for step filtering
    await sql`
      CREATE INDEX IF NOT EXISTS idx_deployment_logs_step 
      ON deployment_logs(deployment_id, step, timestamp DESC)
    `
    console.log('✅ Created index on step')

    console.log('\n🎉 deployment_logs table created successfully!')
  } catch (err) {
    console.error('❌ Error creating table:', err.message)
    process.exit(1)
  }
}

createDeploymentLogsTable().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
