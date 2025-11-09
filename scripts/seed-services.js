#!/usr/bin/env node
const { neon } = require('@neondatabase/serverless')
require('dotenv').config()

const sql = neon(process.env.DATABASE_URL)

async function seedServices() {
  console.log('🚀 Seeding services data...')

  try {
    // Get or create default project
    let projectId;
    const projects = await sql`SELECT id FROM projects LIMIT 1`
    
    if (projects.length === 0) {
      const [project] = await sql`
        INSERT INTO projects (name, user_id)
        VALUES ('Default Project', 'system')
        RETURNING id
      `
      projectId = project.id
      console.log('Created default project:', projectId)
    } else {
      projectId = projects[0].id
      console.log('Using existing project:', projectId)
    }

    // Insert sample services
    console.log('Inserting sample services...')
    const services = await sql`
      INSERT INTO services (project_id, name, status, cost_per_hour, uptime_percent, service_type)
      VALUES 
        (${projectId}, 'API Gateway', 'up', 0.05, 99.9, 'api'),
        (${projectId}, 'Auth Service', 'up', 0.03, 99.8, 'api'),
        (${projectId}, 'Database Primary', 'up', 0.15, 99.95, 'database'),
        (${projectId}, 'Redis Cache', 'up', 0.02, 99.7, 'cache'),
        (${projectId}, 'Worker Queue', 'up', 0.04, 98.5, 'worker'),
        (${projectId}, 'Frontend Storage', 'up', 0.01, 99.99, 'storage'),
        (${projectId}, 'Monitoring API', 'up', 0.02, 99.5, 'api'),
        (${projectId}, 'Background Jobs', 'down', 0.03, 95.2, 'worker')
      ON CONFLICT DO NOTHING
      RETURNING id, name
    `

    console.log(`✅ Inserted ${services.length} services`)

    // Insert uptime logs for each service (last 24 hours)
    console.log('Generating uptime logs...')
    for (const service of services) {
      const uptimeLogs = []
      const baseUptime = 95 + Math.random() * 4 // 95-99%
      
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(Date.now() - i * 60 * 60 * 1000) // Hourly for 24 hours
        const uptime = Math.min(99.99, Math.max(90, baseUptime + (Math.random() - 0.5) * 2))
        const responseTime = Math.floor(50 + Math.random() * 150)
        
        uptimeLogs.push({
          project_id: projectId,
          service_id: service.id,
          uptime_value: uptime,
          response_time_ms: responseTime,
          timestamp: timestamp.toISOString()
        })
      }

      // Batch insert uptime logs
      for (const log of uptimeLogs) {
        await sql`
          INSERT INTO uptime_logs (project_id, service_id, uptime_value, response_time_ms, timestamp)
          VALUES (${log.project_id}, ${log.service_id}, ${log.uptime_value}, ${log.response_time_ms}, ${log.timestamp})
        `
      }
      
      console.log(`  ✓ Created ${uptimeLogs.length} uptime logs for ${service.name}`)
    }

    // Get final counts
    const serviceCount = await sql`SELECT COUNT(*) as count FROM services WHERE project_id = ${projectId}`
    const uptimeCount = await sql`SELECT COUNT(*) as count FROM uptime_logs WHERE project_id = ${projectId}`

    console.log('\n✅ Services seeding completed!')
    console.log(`📦 Total services: ${serviceCount[0].count}`)
    console.log(`📊 Total uptime logs: ${uptimeCount[0].count}`)

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seedServices()
