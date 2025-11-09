#!/usr/bin/env node
const { neon } = require('@neondatabase/serverless')
require('dotenv').config()

const sql = neon(process.env.DATABASE_URL)

async function runMigration() {
  console.log('🚀 Running AWS resources migration...')

  try {
    // Create S3 Buckets table
    console.log('Creating s3_buckets table...')
    await sql`
      CREATE TABLE IF NOT EXISTS s3_buckets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        region VARCHAR(50) DEFAULT 'us-east-1',
        versioning_enabled BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        user_id VARCHAR(255),
        size_bytes BIGINT DEFAULT 0,
        object_count INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}'::jsonb
      )
    `

    // Create S3 Objects table
    console.log('Creating s3_objects table...')
    await sql`
      CREATE TABLE IF NOT EXISTS s3_objects (
        id SERIAL PRIMARY KEY,
        bucket_id INTEGER REFERENCES s3_buckets(id) ON DELETE CASCADE,
        key VARCHAR(1024) NOT NULL,
        size_bytes BIGINT NOT NULL,
        content_type VARCHAR(255),
        etag VARCHAR(255),
        version_id VARCHAR(255),
        storage_class VARCHAR(50) DEFAULT 'STANDARD',
        last_modified TIMESTAMP DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb,
        UNIQUE(bucket_id, key, version_id)
      )
    `

    // Create DynamoDB Tables table
    console.log('Creating dynamodb_tables table...')
    await sql`
      CREATE TABLE IF NOT EXISTS dynamodb_tables (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        partition_key VARCHAR(255) NOT NULL,
        partition_key_type VARCHAR(10) NOT NULL,
        sort_key VARCHAR(255),
        sort_key_type VARCHAR(10),
        item_count BIGINT DEFAULT 0,
        size_bytes BIGINT DEFAULT 0,
        read_capacity_units INTEGER DEFAULT 5,
        write_capacity_units INTEGER DEFAULT 5,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        user_id VARCHAR(255),
        metadata JSONB DEFAULT '{}'::jsonb
      )
    `

    // Create DynamoDB Items table
    console.log('Creating dynamodb_items table...')
    await sql`
      CREATE TABLE IF NOT EXISTS dynamodb_items (
        id SERIAL PRIMARY KEY,
        table_id INTEGER REFERENCES dynamodb_tables(id) ON DELETE CASCADE,
        partition_key_value TEXT NOT NULL,
        sort_key_value TEXT,
        item_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(table_id, partition_key_value, sort_key_value)
      )
    `

    // Create Lambda Functions table
    console.log('Creating lambda_functions table...')
    await sql`
      CREATE TABLE IF NOT EXISTS lambda_functions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        runtime VARCHAR(50) NOT NULL,
        handler VARCHAR(255) NOT NULL,
        code_size BIGINT DEFAULT 0,
        memory_size INTEGER DEFAULT 128,
        timeout INTEGER DEFAULT 3,
        status VARCHAR(50) DEFAULT 'Active',
        last_modified TIMESTAMP DEFAULT NOW(),
        invocation_count BIGINT DEFAULT 0,
        error_count BIGINT DEFAULT 0,
        environment JSONB DEFAULT '{}'::jsonb,
        role_arn VARCHAR(512),
        created_at TIMESTAMP DEFAULT NOW(),
        user_id VARCHAR(255)
      )
    `

    // Create Lambda Invocations table
    console.log('Creating lambda_invocations table...')
    await sql`
      CREATE TABLE IF NOT EXISTS lambda_invocations (
        id SERIAL PRIMARY KEY,
        function_id INTEGER REFERENCES lambda_functions(id) ON DELETE CASCADE,
        request_id VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) NOT NULL,
        duration_ms INTEGER,
        memory_used_mb INTEGER,
        billed_duration_ms INTEGER,
        invoked_at TIMESTAMP DEFAULT NOW(),
        error_message TEXT,
        logs TEXT
      )
    `

    // Create IAM tables
    console.log('Creating IAM tables...')
    await sql`
      CREATE TABLE IF NOT EXISTS iam_roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        arn VARCHAR(512) UNIQUE NOT NULL,
        assume_role_policy JSONB NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        user_id VARCHAR(255)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS iam_policies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        arn VARCHAR(512) UNIQUE NOT NULL,
        policy_document JSONB NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        user_id VARCHAR(255)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS iam_role_policies (
        id SERIAL PRIMARY KEY,
        role_id INTEGER REFERENCES iam_roles(id) ON DELETE CASCADE,
        policy_id INTEGER REFERENCES iam_policies(id) ON DELETE CASCADE,
        attached_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(role_id, policy_id)
      )
    `

    // Create CloudWatch tables
    console.log('Creating CloudWatch tables...')
    await sql`
      CREATE TABLE IF NOT EXISTS cloudwatch_metrics (
        id SERIAL PRIMARY KEY,
        namespace VARCHAR(255) NOT NULL,
        metric_name VARCHAR(255) NOT NULL,
        dimensions JSONB DEFAULT '{}'::jsonb,
        value DOUBLE PRECISION NOT NULL,
        unit VARCHAR(50),
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS cloudwatch_log_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(512) UNIQUE NOT NULL,
        retention_days INTEGER,
        size_bytes BIGINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        user_id VARCHAR(255)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS cloudwatch_log_streams (
        id SERIAL PRIMARY KEY,
        log_group_id INTEGER REFERENCES cloudwatch_log_groups(id) ON DELETE CASCADE,
        name VARCHAR(512) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        last_event_time TIMESTAMP,
        UNIQUE(log_group_id, name)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS cloudwatch_log_events (
        id SERIAL PRIMARY KEY,
        log_stream_id INTEGER REFERENCES cloudwatch_log_streams(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        ingestion_time TIMESTAMP DEFAULT NOW()
      )
    `

    // Create indexes
    console.log('Creating indexes...')
    await sql`CREATE INDEX IF NOT EXISTS idx_s3_objects_bucket ON s3_objects(bucket_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_s3_objects_key ON s3_objects(key)`
    await sql`CREATE INDEX IF NOT EXISTS idx_dynamodb_items_table ON dynamodb_items(table_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_dynamodb_items_partition ON dynamodb_items(partition_key_value)`
    await sql`CREATE INDEX IF NOT EXISTS idx_lambda_invocations_function ON lambda_invocations(function_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_lambda_invocations_time ON lambda_invocations(invoked_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_cloudwatch_metrics_namespace ON cloudwatch_metrics(namespace)`
    await sql`CREATE INDEX IF NOT EXISTS idx_cloudwatch_metrics_time ON cloudwatch_metrics(timestamp)`
    await sql`CREATE INDEX IF NOT EXISTS idx_cloudwatch_log_events_stream ON cloudwatch_log_events(log_stream_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_cloudwatch_log_events_time ON cloudwatch_log_events(timestamp)`

    // Insert sample data
    console.log('Inserting sample AWS resources...')

    // Sample S3 Buckets
    const buckets = await sql`
      INSERT INTO s3_buckets (name, region, versioning_enabled, size_bytes, object_count)
      VALUES 
        ('my-app-assets', 'us-east-1', false, 15728640, 23),
        ('user-uploads', 'us-west-2', true, 104857600, 156),
        ('backup-storage', 'eu-west-1', true, 524288000, 42)
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name
    `

    // Sample DynamoDB Tables
    const tables = await sql`
      INSERT INTO dynamodb_tables (name, partition_key, partition_key_type, sort_key, sort_key_type, item_count, size_bytes, read_capacity_units, write_capacity_units)
      VALUES 
        ('Users', 'userId', 'S', 'createdAt', 'N', 1247, 2621440, 10, 5),
        ('Products', 'productId', 'S', NULL, NULL, 892, 1835008, 5, 5),
        ('Orders', 'orderId', 'S', 'timestamp', 'N', 3456, 7864320, 15, 10)
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name
    `

    // Sample Lambda Functions
    const functions = await sql`
      INSERT INTO lambda_functions (name, runtime, handler, code_size, memory_size, timeout, invocation_count, error_count, role_arn)
      VALUES 
        ('image-processor', 'nodejs20.x', 'index.handler', 2048576, 512, 30, 1523, 12, 'arn:aws:iam::000000000000:role/lambda-exec'),
        ('api-handler', 'python3.11', 'app.lambda_handler', 5242880, 256, 10, 8947, 3, 'arn:aws:iam::000000000000:role/lambda-exec'),
        ('data-transformer', 'nodejs18.x', 'transform.handler', 1572864, 1024, 60, 456, 8, 'arn:aws:iam::000000000000:role/lambda-exec')
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name
    `

    // Sample IAM Role
    await sql`
      INSERT INTO iam_roles (name, arn, assume_role_policy, description)
      VALUES (
        'lambda-exec',
        'arn:aws:iam::000000000000:role/lambda-exec',
        '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'::jsonb,
        'Lambda execution role'
      )
      ON CONFLICT (name) DO NOTHING
    `

    // Sample CloudWatch Log Group
    const logGroups = await sql`
      INSERT INTO cloudwatch_log_groups (name, retention_days, size_bytes)
      VALUES 
        ('/aws/lambda/image-processor', 7, 10485760),
        ('/aws/lambda/api-handler', 7, 5242880),
        ('/aws/lambda/data-transformer', 14, 2097152)
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name
    `

    // Get total counts
    const s3Count = await sql`SELECT COUNT(*) as count FROM s3_buckets`
    const dynamoCount = await sql`SELECT COUNT(*) as count FROM dynamodb_tables`
    const lambdaCount = await sql`SELECT COUNT(*) as count FROM lambda_functions`
    const iamCount = await sql`SELECT COUNT(*) as count FROM iam_roles`
    const cwCount = await sql`SELECT COUNT(*) as count FROM cloudwatch_log_groups`

    console.log('✅ AWS resources migration completed!')
    console.log(`📦 S3 Buckets: ${s3Count[0].count}`)
    console.log(`📊 DynamoDB Tables: ${dynamoCount[0].count}`)
    console.log(`⚡ Lambda Functions: ${lambdaCount[0].count}`)
    console.log(`🔐 IAM Roles: ${iamCount[0].count}`)
    console.log(`📈 CloudWatch Log Groups: ${cwCount[0].count}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
