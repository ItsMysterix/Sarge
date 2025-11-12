import { Pool } from "@neondatabase/serverless"

let pool: Pool | null = null

export function getDbPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
  }
  return pool
}
