const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function resetDb() {
    try {
        console.log('Resetting database...');
        const tables = ['projects', 'stacks', 'deployments', 'services', 'audit_logs', 'users', 'tokens'];

        for (const table of tables) {
            try {
                await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
                console.log(`Truncated ${table}.`);
            } catch (e) {
                console.log(`Could not truncate ${table} (might not exist): ${e.message}`);
            }
        }

        console.log('Database reset complete.');
    } catch (err) {
        console.error('Error resetting DB:', err);
    } finally {
        await pool.end();
    }
}

resetDb();
