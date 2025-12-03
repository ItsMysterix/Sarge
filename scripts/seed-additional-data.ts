// Seed additional data: logs, metrics, deployments
try {
  var dotenv = require('dotenv')
  dotenv.config({ path: '.env.local' })
  dotenv.config()
} catch {}
var neonPkg = require('@neondatabase/serverless')
var neonFn = neonPkg.neon

async function seedAdditional() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL not configured')
  const sql: any = neonFn(dbUrl)

  console.log('Seeding logs...')
  await sql`
    INSERT INTO logs (type, message, service, severity, timestamp) VALUES 
    ('error', 'Authentication failed for user - invalid token', 'api-gateway', 'high', NOW() - INTERVAL '1 hour'),
    ('warn', 'High memory usage detected: 85% of allocated memory', 'worker-queue', 'medium', NOW() - INTERVAL '2 hours'),
    ('error', 'Database connection timeout - retrying', 'database', 'medium', NOW() - INTERVAL '3 hours'),
    ('info', 'Deployment completed successfully in 2m 15s', 'deployment-service', 'low', NOW() - INTERVAL '4 hours'),
    ('alert', 'API response time exceeded 5000ms threshold', 'api-gateway', 'high', NOW() - INTERVAL '5 hours'),
    ('warn', 'Cache hit ratio dropped below 90% - current: 87%', 'redis-cache', 'medium', NOW() - INTERVAL '6 hours'),
    ('info', 'Scheduled backup completed - 2.3GB archived', 'file-storage', 'low', NOW() - INTERVAL '7 hours'),
    ('error', 'Failed to process webhook - connection refused', 'api-gateway', 'medium', NOW() - INTERVAL '8 hours')
    ON CONFLICT DO NOTHING
  `

  console.log('Seeding metrics...')
  await sql`
    INSERT INTO metrics (cpu_usage, memory_usage, latency_ms, cost_daily, uptime_percent, timestamp) VALUES 
    (68.5, 83.2, 45, 91.40, 99.8, NOW() - INTERVAL '1 hour'),
    (72.1, 85.7, 52, 92.15, 99.7, NOW() - INTERVAL '2 hours'),
    (65.3, 81.9, 38, 90.85, 99.9, NOW() - INTERVAL '3 hours'),
    (70.8, 84.1, 47, 91.75, 99.8, NOW() - INTERVAL '4 hours'),
    (69.2, 82.6, 43, 91.20, 99.8, NOW() - INTERVAL '5 hours')
  `

  console.log('Seeding deployments...')
  await sql`
    INSERT INTO deployments (branch, commit, status, summary, duration_seconds, author, created_at) VALUES 
    ('main', 'a7f3c2d', 'success', 'API performance improvements', 135, 'Alex Chen', NOW() - INTERVAL '1 day'),
    ('feature/auth', 'b8e4d3f', 'failed', 'Database migration timeout', 92, 'Sarah Kim', NOW() - INTERVAL '2 days'),
    ('main', 'c9f5e4a', 'success', 'Hotfix for memory leak', 156, 'Mike Johnson', NOW() - INTERVAL '3 days'),
    ('feature/ui', 'd1a2b3c', 'pending', 'UI redesign in progress', 0, 'Alex Chen', NOW() - INTERVAL '1 hour'),
    ('main', 'e4f5g6h', 'success', 'Security patches', 142, 'Sarah Kim', NOW() - INTERVAL '4 days')
  `

  console.log('✅ Additional seed data complete!')
}

seedAdditional().catch((e: any) => { 
  console.error('Seed failed:', e.message)
  process.exit(1) 
})
