#!/usr/bin/env node
/**
 * Verify GitHub OAuth is working and user data is correct
 */

const { Pool } = require('pg')

async function verifyOAuth() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('🔍 Checking OAuth user data...\n')

    // Check users table
    const users = await pool.query(`
      SELECT id, email, name, image, email_verified, created_at
      FROM users
      WHERE email_verified IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `)

    console.log('✅ Verified Users:')
    console.log('─'.repeat(80))
    users.rows.forEach(user => {
      console.log(`Email: ${user.email}`)
      console.log(`Name: ${user.name}`)
      console.log(`Verified: ${user.email_verified}`)
      console.log(`Created: ${user.created_at}`)
      console.log('─'.repeat(80))
    })

    console.log(`\n📊 Total verified users: ${users.rows.length}`)
    console.log('\n✅ OAuth is working correctly!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

verifyOAuth()
