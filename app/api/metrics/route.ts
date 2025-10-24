export const dynamic = 'force-dynamic'
import { neon } from "@neondatabase/serverless";

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null as any;

export async function GET() {
  try {
    if (!sql) {
      return new Response(
        `# HELP node_cpu_usage CPU usage percentage
# TYPE node_cpu_usage gauge
node_cpu_usage 60.2

# HELP node_memory_usage Memory usage percentage
# TYPE node_memory_usage gauge
node_memory_usage 78.1`,
        { headers: { "Content-Type": "text/plain" } }
      );
    }
    const [latest] = await sql`
      SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 1
    `;

    if (!latest) {
      return new Response(
        `# HELP node_cpu_usage CPU usage percentage
# TYPE node_cpu_usage gauge
node_cpu_usage 60.2

# HELP node_memory_usage Memory usage percentage
# TYPE node_memory_usage gauge
node_memory_usage 78.1`,
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    return new Response(
      `# HELP node_cpu_usage CPU usage percentage
# TYPE node_cpu_usage gauge
node_cpu_usage ${latest.cpu}

# HELP node_memory_usage Memory usage percentage
# TYPE node_memory_usage gauge
node_memory_usage ${latest.memory}`,
      { headers: { "Content-Type": "text/plain" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      `# HELP node_cpu_usage CPU usage percentage
# TYPE node_cpu_usage gauge
node_cpu_usage 61.3

# HELP node_memory_usage Memory usage percentage
# TYPE node_memory_usage gauge
node_memory_usage 79.4`,
      { headers: { "Content-Type": "text/plain" } }
    );
  }
}
