#!/usr/bin/env node

/**
 * Seed logs table with realistic data for testing
 */

const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env or .env.local
function loadEnv() {
  const envFiles = ['.env.local', '.env']
  
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, '..', envFile)
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          const value = match[2].trim().replace(/^["']|["']$/g, '')
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      })
      console.log(`✅ Loaded environment variables from ${envFile}`)
      return envPath
    }
  }
  
  return null
}

loadEnv()

async function seedLogs() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set')
    console.log('Please ensure DATABASE_URL is in your .env or .env.local file')
    process.exit(1)
  }

  console.log('🔄 Starting logs seeding...')
  
  const sql = neon(databaseUrl)
  
  try {
    // Read the SQL seed file
    const sqlFile = path.join(__dirname, 'seed-logs.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')
    
    console.log('📝 Seeding logs table...')
    
    // Execute the seed SQL - use .query for raw SQL strings
    await sql.query(sqlContent)
    
    // Verify the data was inserted
    const result = await sql`SELECT COUNT(*) as count FROM logs`
    const count = result[0]?.count || 0
    
    console.log('\n✅ Logs seeding completed successfully!')
    console.log(`📊 Total logs in database: ${count}`)
    
    // Show sample of logs
    const sampleLogs = await sql`
      SELECT type, message, service, timestamp 
      FROM logs 
      ORDER BY timestamp DESC 
      LIMIT 5
    `
    
    console.log('\n📋 Sample logs:')
    sampleLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. [${log.type.toUpperCase()}] ${log.message.substring(0, 60)}...`)
    })
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message)
    process.exit(1)
  }
}

seedLogs()
