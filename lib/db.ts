import { Pool } from "@neondatabase/serverless"

let pool: Pool | null = null

function createMockPool(): Pool {
  console.warn("[frontend/lib/db] DATABASE_URL not set; using mock pool that returns empty results")
  const mock: any = {
    async query(_sql: string, _params?: any[]) {
      return { rows: [] }
    },
    async end() { /* noop */ },
  }
  return mock as unknown as Pool
}

export function getDbPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.length === 0) {
      pool = createMockPool()
    } else {
      pool = new Pool({ connectionString: process.env.DATABASE_URL })
    }
  }
  return pool
}
