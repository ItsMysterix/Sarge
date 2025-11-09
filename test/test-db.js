// Database check script
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAuth() {
  console.log('🔍 Checking Auth.js database state...\n');
  
  try {
    // Check users
    const users = await pool.query('SELECT id, email, name, email_verified, created_at FROM users ORDER BY created_at DESC LIMIT 5');
    console.log('📊 Recent Users:');
    console.table(users.rows);
    
    // Check accounts (OAuth)
    const accounts = await pool.query('SELECT user_id, provider, provider_account_id FROM accounts ORDER BY user_id DESC LIMIT 5');
    console.log('\n📊 Recent OAuth Accounts:');
    console.table(accounts.rows);
    
    // Check sessions
    const sessions = await pool.query('SELECT user_id, expires, session_token FROM sessions ORDER BY expires DESC LIMIT 5');
    console.log('\n📊 Active Sessions:');
    console.table(sessions.rows);
    
  } catch (error) {
    console.error('❌ Database Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAuth();
