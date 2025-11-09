#!/usr/bin/env node
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  try {
    console.log('🚀 Running stacks migration...');
    
    // Create stacks table
    console.log('Creating stacks table...');
    await sql.query(`
      CREATE TABLE IF NOT EXISTS stacks (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL CHECK (status IN ('running', 'stopped', 'deploying', 'error')),
        services JSONB DEFAULT '[]'::jsonb,
        environment JSONB DEFAULT '{}'::jsonb,
        resource_usage JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        user_id TEXT,
        CONSTRAINT stacks_name_unique UNIQUE (name, user_id)
      )
    `);
    
    // Create stack_services table
    console.log('Creating stack_services table...');
    await sql.query(`
      CREATE TABLE IF NOT EXISTS stack_services (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        stack_id TEXT NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('running', 'stopped', 'error')),
        port INTEGER,
        config JSONB DEFAULT '{}'::jsonb,
        health_check_url TEXT,
        last_health_check TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create stack_deployments table
    console.log('Creating stack_deployments table...');
    await sql.query(`
      CREATE TABLE IF NOT EXISTS stack_deployments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        stack_id TEXT NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
        version TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed')),
        changes JSONB DEFAULT '[]'::jsonb,
        deployed_by TEXT,
        deployed_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        error_message TEXT
      )
    `);
    
    // Create indexes
    console.log('Creating indexes...');
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_stacks_user_id ON stacks(user_id)`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_stacks_status ON stacks(status)`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_stack_services_stack_id ON stack_services(stack_id)`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_stack_deployments_stack_id ON stack_deployments(stack_id)`);
    
    // Insert sample data
    console.log('Inserting sample data...');
    const sampleStacks = [
      {
        name: 'production-api',
        description: 'Main production API stack',
        status: 'running',
        services: JSON.stringify([
          {name: 'api-server', type: 'container', port: 3000},
          {name: 'redis', type: 'container', port: 6379},
          {name: 'users-table', type: 'dynamodb'}
        ]),
        environment: JSON.stringify({NODE_ENV: 'production', DATABASE_URL: '***', REDIS_URL: 'redis://localhost:6379'}),
        resource_usage: JSON.stringify({cpu: 35.2, memory: 512, containers: 2})
      },
      {
        name: 'dev-fullstack',
        description: 'Development full-stack application',
        status: 'running',
        services: JSON.stringify([
          {name: 'frontend', type: 'container', port: 3001},
          {name: 'backend', type: 'container', port: 4000},
          {name: 'postgres', type: 'container', port: 5432}
        ]),
        environment: JSON.stringify({NODE_ENV: 'development', API_URL: 'http://localhost:4000'}),
        resource_usage: JSON.stringify({cpu: 28.7, memory: 768, containers: 3})
      }
    ];
    
    for (const stack of sampleStacks) {
      try {
        await sql.query(`
          INSERT INTO stacks (name, description, status, services, environment, resource_usage)
          VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb)
          ON CONFLICT (name, user_id) DO NOTHING
        `, [stack.name, stack.description, stack.status, stack.services, stack.environment, stack.resource_usage]);
      } catch (err) {
        console.log(`  ⚠️  Stack ${stack.name} may already exist`);
      }
    }
    
    console.log('✅ Stacks migration completed!');
    
    // Check results
    const stacks = await sql`SELECT COUNT(*) as count FROM stacks`;
    console.log(`📦 Total stacks: ${stacks[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
