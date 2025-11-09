#!/usr/bin/env node
/**
 * Run database migrations for Sarge
 * This script creates all necessary tables for the application
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable not set');
    console.log('Please set DATABASE_URL in your .env file');
    process.exit(1);
  }

  console.log('🚀 Running Sarge Database Migrations\n');

  const sql = neon(databaseUrl);

  // Migration files to run in order
  const migrations = [
    'create-users-repositories.sql',
    'migrate-to-multi-project.sql',
    'create-neon-tables.sql',
    'create-stacks-table.sql',
    'create-aws-resources-table.sql',
  ];

  for (const migrationFile of migrations) {
    const migrationPath = path.join(__dirname, '..', 'scripts', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.log(`⚠️  SKIP: ${migrationFile} not found`);
      continue;
    }

    console.log(`📄 Running migration: ${migrationFile}`);
    
    try {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
      
      // Execute the entire migration as one statement (Neon requires tagged templates)
      await sql([migrationSQL]);
      
      console.log(`✅ SUCCESS: ${migrationFile}\n`);
    } catch (error) {
      console.error(`❌ ERROR in ${migrationFile}:`, error.message);
      console.log('Continuing with next migration...\n');
    }
  }

  console.log('🎉 Migration complete!\n');

  // Verify tables were created
  console.log('📋 Verifying tables...');
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('✅ Tables in database:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));
  } catch (error) {
    console.error('❌ Error verifying tables:', error.message);
  }

  process.exit(0);
}

runMigrations().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
