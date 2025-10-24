import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../.env') });

async function run() {
  const DATABASE_URL = process.env.DATABASE_URL;
  const daysRaw = process.env.LOG_RETENTION_DAYS;
  const days = daysRaw ? parseInt(daysRaw, 10) : 7;
  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is required');
    process.exit(1);
  }
  if (!Number.isFinite(days) || days <= 0) {
    console.error('ERROR: LOG_RETENTION_DAYS must be a positive integer if provided');
    process.exit(1);
  }

  const sqlPath = resolve(__dirname, './retention.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const res = await client.query(sql, [days]);
    console.log(`Retention applied for ${days} day(s). Rows affected: ${res.rowCount ?? 'unknown'}`);
  } finally {
    await client.end();
  }
}

run().catch((e) => {
  console.error('Retention run failed:', e);
  process.exit(1);
});
