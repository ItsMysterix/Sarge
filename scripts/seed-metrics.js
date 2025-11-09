#!/usr/bin/env node
require('dotenv').config()
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function seedMetrics() {
  console.log('📊 Seeding project metrics data...')

  try {
    // Get project
    const projects = await sql`SELECT id FROM projects LIMIT 1`
    
    if (projects.length === 0) {
      console.log('❌ No project found. Please run seed-services.js first.')
      process.exit(1)
    }

    const projectId = projects[0].id
    console.log(`Using project: ${projectId}`)

    // Generate metrics for the project over the last 24 hours
    console.log('Generating metrics for last 24 hours...')
    
    const metricsToInsert = []
    const now = new Date()
    
    // Generate hourly metrics for the last 24 hours
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
      
      // Realistic project metrics
      const cpu_usage = Math.random() * 25 + 15 // 15-40% CPU
      const memory_usage = Math.random() * 30 + 35 // 35-65% memory
      const latency_ms = Math.floor(Math.random() * 50) + 25 // 25-75ms latency
      const cost_daily = parseFloat((cpu_usage * 0.05 + memory_usage * 0.03).toFixed(2)) // Daily cost
      const uptime_percent = 99.5 + Math.random() * 0.5 // 99.5-100% uptime
      
      metricsToInsert.push({
        project_id: projectId,
        cpu_usage,
        memory_usage,
        latency_ms,
        cost_daily,
        uptime_percent,
        timestamp,
      })
    }

    // Insert all metrics
    console.log(`Inserting ${metricsToInsert.length} metric entries...`)
    
    for (const metric of metricsToInsert) {
      await sql`
        INSERT INTO metrics (project_id, cpu_usage, memory_usage, latency_ms, cost_daily, uptime_percent, timestamp)
        VALUES (
          ${metric.project_id},
          ${metric.cpu_usage},
          ${metric.memory_usage},
          ${metric.latency_ms},
          ${metric.cost_daily},
          ${metric.uptime_percent},
          ${metric.timestamp}
        )
      `
    }

    // Summary
    const total = await sql`SELECT COUNT(*) as count FROM metrics`
    const avgMetrics = await sql`
      SELECT 
        AVG(cpu_usage) as avg_cpu,
        AVG(memory_usage) as avg_memory,
        AVG(latency_ms) as avg_latency,
        AVG(uptime_percent) as avg_uptime
      FROM metrics
    `

    console.log('\n✅ Metrics seeding completed!')
    console.log(`📊 Total metrics: ${total[0].count}`)
    console.log(`📈 Average CPU: ${Number(avgMetrics[0].avg_cpu).toFixed(2)}%`)
    console.log(`💾 Average Memory: ${Number(avgMetrics[0].avg_memory).toFixed(2)}%`)
    console.log(`⚡ Average Latency: ${Number(avgMetrics[0].avg_latency).toFixed(2)} ms`)
    console.log(`✅ Average Uptime: ${Number(avgMetrics[0].avg_uptime).toFixed(2)}%`)

  } catch (error) {
    console.error('❌ Error seeding metrics:', error)
    process.exit(1)
  }
}

seedMetrics()
