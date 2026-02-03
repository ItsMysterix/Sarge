
require('dotenv').config();
const { Pool } = require('pg');

async function main() {
    console.log('Adding updated_at column to projects...');

    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is missing!');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Add column if not exists
        await pool.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
        console.log('Column updated_at added successfully.');

        // Now try to run the fix-slugs logic again
        console.log('Retrying slug fixes...');
        const res = await pool.query('SELECT id, name, slug FROM projects WHERE slug IS NULL');
        console.log(`Found ${res.rows.length} projects with missing slugs.`);

        for (const row of res.rows) {
            const newSlug = row.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            console.log(`Updating project "${row.name}" -> slug: "${newSlug}"`);
            await pool.query('UPDATE projects SET slug = $1 WHERE id = $2', [newSlug, row.id]);
        }
        console.log('Done!');
    } catch (err) {
        console.error('Database error:', err);
    } finally {
        await pool.end();
    }
}

main();
