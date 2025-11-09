#!/usr/bin/env node
require('dotenv').config()
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function seedDeployments() {
  console.log('🚀 Seeding deployments data...')

  try {
    // Get or create a project
    let project = await sql`SELECT id FROM projects LIMIT 1`
    let projectId

    if (project.length === 0) {
      console.log('Creating new project...')
      const newProject = await sql`
        INSERT INTO projects (id, name, user_id)
        VALUES (gen_random_uuid(), 'main-project', 'system')
        RETURNING id
      `
      projectId = newProject[0].id
    } else {
      projectId = project[0].id
      console.log('Using existing project:', projectId)
    }

    // Insert sample deployments with various statuses
    console.log('Inserting sample deployments...')
    const deployments = await sql`
      INSERT INTO deployments (project_id, branch, commit, status, summary, duration_seconds, author, created_at)
      VALUES 
        (${projectId}, 'main', 'a3f8d92', 'success', 'Deploy production API v2.4.1', 145, 'Arkaparna', NOW() - INTERVAL '2 hours'),
        (${projectId}, 'main', 'b7e2c41', 'success', 'Hotfix: database connection pool', 89, 'DevOps Bot', NOW() - INTERVAL '5 hours'),
        (${projectId}, 'develop', 'c9d4a82', 'failed', 'Feature: new authentication flow', 67, 'Arkaparna', NOW() - INTERVAL '8 hours'),
        (${projectId}, 'feature/dashboard', 'd1e5f73', 'success', 'Update dashboard metrics', 123, 'Arkaparna', NOW() - INTERVAL '1 day'),
        (${projectId}, 'main', 'e2f6a94', 'success', 'Deploy AWS emulation support', 178, 'DevOps Bot', NOW() - INTERVAL '2 days'),
        (${projectId}, 'staging', 'f3a7b15', 'success', 'Staging environment sync', 92, 'DevOps Bot', NOW() - INTERVAL '3 days'),
        (${projectId}, 'main', 'g4b8c26', 'failed', 'Database migration v3.1', 34, 'Arkaparna', NOW() - INTERVAL '4 days'),
        (${projectId}, 'hotfix/memory-leak', 'h5c9d37', 'success', 'Fix memory leak in worker', 156, 'Arkaparna', NOW() - INTERVAL '5 days'),
        (${projectId}, 'main', 'i6d0e48', 'success', 'Deploy stacks management', 201, 'DevOps Bot', NOW() - INTERVAL '6 days'),
        (${projectId}, 'develop', 'j7e1f59', 'success', 'Add profile page', 87, 'Arkaparna', NOW() - INTERVAL '7 days'),
        (${projectId}, 'main', 'k8f2a60', 'success', 'Performance improvements', 143, 'DevOps Bot', NOW() - INTERVAL '1 week'),
        (${projectId}, 'feature/services', 'l9g3b71', 'success', 'Services monitoring dashboard', 167, 'Arkaparna', NOW() - INTERVAL '8 days')
      ON CONFLICT DO NOTHING
      RETURNING id, branch, status
    `

    console.log(`✅ Inserted ${deployments.length} deployments`)
    deployments.forEach(d => console.log(`  - ${d.branch} (${d.status})`))

    // Summary
    const total = await sql`SELECT COUNT(*) as count FROM deployments`
    const byStatus = await sql`
      SELECT status, COUNT(*) as count 
      FROM deployments 
      GROUP BY status 
      ORDER BY count DESC
    `

    console.log('\n✅ Deployments seeding completed!')
    console.log(`📦 Total deployments: ${total[0].count}`)
    console.log('📊 By status:')
    byStatus.forEach(s => console.log(`  - ${s.status}: ${s.count}`))

  } catch (error) {
    console.error('❌ Error seeding deployments:', error)
    process.exit(1)
  }
}

seedDeployments()
