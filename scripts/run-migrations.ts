import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../.env') });

async function run() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is required');
    process.exit(1);
  }

  const migrationsDir = resolve(__dirname, './migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    for (const file of files) {
      const fullPath = join(migrationsDir, file);
      const sql = readFileSync(fullPath, 'utf8');
      console.log(`Applying migration: ${file}`);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`Applied: ${file}`);
    }
  } catch (err) {
    console.error('Migration failed:', err);
    try { await client.query('ROLLBACK'); } catch {}
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
