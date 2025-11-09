#!/usr/bin/env node
/**
 * Run the repositories table migration
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('🔧 Running repositories table migration...\n')

    const sql = fs.readFileSync(
      path.join(__dirname, 'create-repositories-table.sql'),
      'utf8'
    )

    await pool.query(sql)
    
    console.log('✅ Migration completed successfully!')
    console.log('📊 Repositories table created')
    console.log('   - Can store GitHub repo connections')
    console.log('   - One primary repo per user')
    console.log('   - Indexed for fast lookups\n')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
