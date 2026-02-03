
require('dotenv').config();
const { Pool } = require('pg');

async function main() {
    console.log('Checking projects in database...');
    console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);

    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is missing!');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query('SELECT id, name, created_at, user_id, slug FROM projects ORDER BY created_at DESC');
        console.log(`Found ${res.rows.length} projects:`);
        res.rows.forEach((row) => {
            console.log(`- [${row.created_at}] ${row.name} (${row.slug}) ID: ${row.id} User: ${row.user_id}`);
        });
    } catch (err) {
        console.error('Database error:', err);
    } finally {
        await pool.end();
    }
}

main();
