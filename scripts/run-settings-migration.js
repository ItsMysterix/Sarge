#!/usr/bin/env node

/**
 * Migration script to update settings table schema
 * Adds new columns: enable_animations, theme_mode, notifications
 */

const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local or .env
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

const envPath = loadEnv()

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set')
    console.log('Please ensure DATABASE_URL is in your .env or .env.local file')
    if (envPath) {
      console.log('Checked file:', envPath)
    }
    process.exit(1)
  }

  console.log('🔄 Starting settings schema migration...')
  
  const sql = neon(databaseUrl)
  
  try {
    // Read the SQL migration file
    const sqlFile = path.join(__dirname, 'update-settings-schema.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')
    
    console.log('📝 Executing migration SQL...')
    
    // Split by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      try {
        await sql(statement)
        console.log('✅ Executed:', statement.substring(0, 60) + '...')
      } catch (err) {
        // Ignore "already exists" errors
        if (err.message && err.message.includes('already exists')) {
          console.log('⚠️  Already exists, skipping:', statement.substring(0, 60) + '...')
        } else {
          throw err
        }
      }
    }
    
    console.log('\n✅ Settings schema migration completed successfully!')
    console.log('\nNew fields added to settings table:')
    console.log('  - enable_animations (BOOLEAN)')
    console.log('  - theme_mode (VARCHAR)')
    console.log('  - notifications (JSONB)')
    console.log('\nNew tables created:')
    console.log('  - user_preferences')
    console.log('  - keyboard_shortcuts')
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration()
