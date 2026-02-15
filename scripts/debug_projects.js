const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkProjects() {
    try {
        const res = await pool.query('SELECT id, name, slug, user_id FROM projects');
        console.log('--- ALL PROJECTS IN DB ---');
        console.table(res.rows);
        console.log(`Total count: ${res.rowCount}`);

        // Also check users to help map user_ids
        const users = await pool.query('SELECT id, email, name FROM users'); // Assuming 'users' table exists, or maybe it's managed by Clerk/NextAuth only?
        // Often in these setups, user_id is just stored in projects. Let's try to query distinct user_ids from projects.

        const distinctUsers = await pool.query('SELECT DISTINCT user_id FROM projects');
        console.log('\n--- DISTINCT USER IDs OWNING PROJECTS ---');
        console.table(distinctUsers.rows);

    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await pool.end();
    }
}

checkProjects();
