#!/usr/bin/env node
/**
 * Test AWS emulation with real database operations
 * Tests S3, DynamoDB, and Lambda database-backed APIs
 */

const { neon } = require('@neondatabase/serverless')

async function testAWSEmulation() {
  console.log('🔧 Testing AWS Emulation with Database...\n')
  
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set')
    process.exit(1)
  }

  const sql = neon(DATABASE_URL)
  let passCount = 0
  let failCount = 0

  // Test 1: Check if AWS tables exist
  console.log('Test 1: Verify AWS database tables exist')
  try {
    const s3Count = await sql`SELECT COUNT(*) as count FROM s3_buckets`
    const dynamoCount = await sql`SELECT COUNT(*) as count FROM dynamodb_tables`
    const lambdaCount = await sql`SELECT COUNT(*) as count FROM lambda_functions`
    
    console.log(`  ✅ s3_buckets table exists (${s3Count[0].count} buckets)`)
    console.log(`  ✅ dynamodb_tables table exists (${dynamoCount[0].count} tables)`)
    console.log(`  ✅ lambda_functions table exists (${lambdaCount[0].count} functions)`)
    passCount++
  } catch (err) {
    console.error('  ❌ AWS tables check failed:', err.message)
    failCount++
  }

  // Test 2: Create S3 bucket
  console.log('\nTest 2: Create S3 bucket')
  try {
    const bucketName = `my-test-bucket-${Date.now()}`
    
    await sql`
      INSERT INTO s3_buckets (name, region, versioning_enabled, size_bytes, object_count, created_at)
      VALUES (${bucketName}, 'us-east-1', false, 0, 0, NOW())
    `
    
    const buckets = await sql`SELECT * FROM s3_buckets WHERE name = ${bucketName}`
    if (buckets.length === 1 && buckets[0].name === bucketName) {
      console.log(`  ✅ S3 bucket created: ${bucketName}`)
      passCount++
    } else {
      console.error('  ❌ S3 bucket not found after creation')
      failCount++
    }
  } catch (err) {
    console.error('  ❌ S3 bucket creation failed:', err.message)
    failCount++
  }

  // Test 3: List S3 buckets
  console.log('\nTest 3: List S3 buckets')
  try {
    const buckets = await sql`
      SELECT id, name, region, versioning_enabled, size_bytes, object_count 
      FROM s3_buckets 
      ORDER BY created_at DESC
    `
    console.log(`  ✅ Found ${buckets.length} S3 buckets`)
    buckets.slice(0, 3).forEach(bucket => {
      console.log(`     - ${bucket.name} (${bucket.region}, ${bucket.size_bytes} bytes, ${bucket.object_count} objects)`)
    })
    passCount++
  } catch (err) {
    console.error('  ❌ S3 bucket listing failed:', err.message)
    failCount++
  }

  // Test 4: Create DynamoDB table
  console.log('\nTest 4: Create DynamoDB table')
  try {
    const tableName = `TestTable${Date.now()}`
    
    await sql`
      INSERT INTO dynamodb_tables (
        name, status, partition_key, partition_key_type, sort_key, 
        read_capacity_units, write_capacity_units, item_count, created_at
      )
      VALUES (
        ${tableName}, 'ACTIVE', 'id', 'S', NULL,
        5, 5, 0, NOW()
      )
    `
    
    const tables = await sql`SELECT * FROM dynamodb_tables WHERE name = ${tableName}`
    if (tables.length === 1 && tables[0].name === tableName) {
      console.log(`  ✅ DynamoDB table created: ${tableName}`)
      passCount++
    } else {
      console.error('  ❌ DynamoDB table not found after creation')
      failCount++
    }
  } catch (err) {
    console.error('  ❌ DynamoDB table creation failed:', err.message)
    failCount++
  }

  // Test 5: List DynamoDB tables
  console.log('\nTest 5: List DynamoDB tables')
  try {
    const tables = await sql`
      SELECT id, name, status, partition_key, sort_key, read_capacity_units, write_capacity_units, item_count
      FROM dynamodb_tables
      ORDER BY created_at DESC
    `
    console.log(`  ✅ Found ${tables.length} DynamoDB tables`)
    tables.slice(0, 3).forEach(table => {
      console.log(`     - ${table.name} (${table.status}, ${table.item_count} items, PK: ${table.partition_key})`)
    })
    passCount++
  } catch (err) {
    console.error('  ❌ DynamoDB table listing failed:', err.message)
    failCount++
  }

  // Test 6: Create Lambda function
  console.log('\nTest 6: Create Lambda function')
  try {
    const functionName = `testFunction${Date.now()}`
    
    await sql`
      INSERT INTO lambda_functions (
        name, runtime, handler, memory_size, timeout, 
        last_modified, code_size, status, created_at
      )
      VALUES (
        ${functionName}, 'nodejs18.x', 'index.handler', 256, 30,
        NOW(), 1024, 'Active', NOW()
      )
    `
    
    const functions = await sql`SELECT * FROM lambda_functions WHERE name = ${functionName}`
    if (functions.length === 1 && functions[0].name === functionName) {
      console.log(`  ✅ Lambda function created: ${functionName}`)
      passCount++
    } else {
      console.error('  ❌ Lambda function not found after creation')
      failCount++
    }
  } catch (err) {
    console.error('  ❌ Lambda function creation failed:', err.message)
    failCount++
  }

  // Test 7: List Lambda functions
  console.log('\nTest 7: List Lambda functions')
  try {
    const functions = await sql`
      SELECT id, name, runtime, handler, memory_size, timeout, code_size, status
      FROM lambda_functions
      ORDER BY created_at DESC
    `
    console.log(`  ✅ Found ${functions.length} Lambda functions`)
    functions.slice(0, 3).forEach(func => {
      console.log(`     - ${func.name} (${func.runtime}, ${func.memory_size}MB, ${func.status})`)
    })
    passCount++
  } catch (err) {
    console.error('  ❌ Lambda function listing failed:', err.message)
    failCount++
  }

  // Test 8: Get AWS summary (all resources)
  console.log('\nTest 8: Get AWS resource summary')
  try {
    const summary = {
      s3: await sql`SELECT COUNT(*) as count FROM s3_buckets`,
      dynamodb: await sql`SELECT COUNT(*) as count FROM dynamodb_tables`,
      lambda: await sql`SELECT COUNT(*) as count FROM lambda_functions`,
      iam: await sql`SELECT COUNT(*) as count FROM iam_roles`,
      cloudwatch: await sql`SELECT COUNT(*) as count FROM cloudwatch_log_groups`,
    }
    
    console.log(`  ✅ AWS Summary:`)
    console.log(`     - S3 Buckets: ${summary.s3[0].count}`)
    console.log(`     - DynamoDB Tables: ${summary.dynamodb[0].count}`)
    console.log(`     - Lambda Functions: ${summary.lambda[0].count}`)
    console.log(`     - IAM Roles: ${summary.iam[0].count}`)
    console.log(`     - CloudWatch Log Groups: ${summary.cloudwatch[0].count}`)
    passCount++
  } catch (err) {
    console.error('  ❌ AWS summary failed:', err.message)
    failCount++
  }

  // Test 9: Delete test resources
  console.log('\nTest 9: Delete test resources')
  try {
    const s3Result = await sql`DELETE FROM s3_buckets WHERE name LIKE 'my-test-bucket-%' RETURNING id`
    const dynamoResult = await sql`DELETE FROM dynamodb_tables WHERE name LIKE 'TestTable%' RETURNING id`
    const lambdaResult = await sql`DELETE FROM lambda_functions WHERE name LIKE 'testFunction%' RETURNING id`
    
    console.log(`  ✅ Cleaned up ${s3Result.length} S3 buckets, ${dynamoResult.length} DynamoDB tables, ${lambdaResult.length} Lambda functions`)
    passCount++
  } catch (err) {
    console.error('  ❌ Cleanup failed:', err.message)
    failCount++
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log(`✅ Tests passed: ${passCount}`)
  console.log(`❌ Tests failed: ${failCount}`)
  console.log('='.repeat(60))

  if (failCount > 0) {
    console.log('\n⚠️  Some tests failed. Check the errors above.')
    process.exit(1)
  } else {
    console.log('\n🎉 All AWS emulation tests passed!')
  }
}

testAWSEmulation().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
