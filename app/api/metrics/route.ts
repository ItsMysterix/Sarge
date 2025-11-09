export const dynamic = 'force-dynamic'
import { neon } from "@neondatabase/serverless";

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any;

export async function GET() {
  try {
    if (!sql) {
      return new Response(
        `# No database configured
# Metrics unavailable`,
        { 
          headers: { "Content-Type": "text/plain" },
          status: 503 
        }
      );
    }
    
    // Get latest metrics from service_metrics table
    const [latest] = await sql`
      SELECT 
        service_name,
        AVG(cpu_percent) as cpu,
        AVG(memory_mb) as memory,
        AVG(avg_response_ms) as latency,
        SUM(request_count) as requests,
        SUM(error_count) as errors
      FROM service_metrics 
      WHERE updated_at > NOW() - INTERVAL '5 minutes'
      GROUP BY service_name
      ORDER BY updated_at DESC 
      LIMIT 1
    `;

    if (!latest) {
      return new Response(
        `# No recent metrics
# Waiting for service data...`,
        { 
          headers: { "Content-Type": "text/plain" },
          status: 404
        }
      );
    }

    return new Response(
      `# HELP service_cpu_usage CPU usage percentage
# TYPE service_cpu_usage gauge
service_cpu_usage{service="${latest.service_name}"} ${latest.cpu || 0}

# HELP service_memory_usage Memory usage in MB
# TYPE service_memory_usage gauge
service_memory_usage{service="${latest.service_name}"} ${latest.memory || 0}

# HELP service_latency_ms Average response latency in milliseconds
# TYPE service_latency_ms gauge
service_latency_ms{service="${latest.service_name}"} ${latest.latency || 0}

# HELP service_requests_total Total request count
# TYPE service_requests_total counter
service_requests_total{service="${latest.service_name}"} ${latest.requests || 0}

# HELP service_errors_total Total error count
# TYPE service_errors_total counter
service_errors_total{service="${latest.service_name}"} ${latest.errors || 0}`,
      { headers: { "Content-Type": "text/plain" } }
    );
  } catch (err) {
    console.error('Metrics error:', err);
    return new Response(
      `# Error fetching metrics
# ${err instanceof Error ? err.message : 'Unknown error'}`,
      { 
        headers: { "Content-Type": "text/plain" },
        status: 500
      }
    );
  }
}
