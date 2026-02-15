const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function initDb() {
    try {
        console.log('Initializing database schema...');

        // Create user_settings table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        deployment_emails BOOLEAN DEFAULT TRUE,
        product_emails BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Created user_settings table (if not exists).');

    } catch (err) {
        console.error('Error initializing DB:', err);
    } finally {
        pool.end();
    }
}

initDb();
