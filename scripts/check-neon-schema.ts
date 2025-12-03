// CommonJS-compatible script to avoid ESM import issues in ts-node
// Load environment variables from .env/.env.local if available
try {
  const dotenv = require('dotenv')
  // Load .env.local first, then .env as fallback
  dotenv.config({ path: '.env.local' })
  dotenv.config()
} catch {}
const { neon } = require("@neondatabase/serverless")

const sql: any = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

async function getTableColumns(table: string) {
  if (!sql) throw new Error("DATABASE_URL not configured")
  const result = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = ${table}
    ORDER BY ordinal_position
  `
  return result
}

async function getTables() {
  if (!sql) throw new Error("DATABASE_URL not configured")
  const result = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `
  return result.map((row: any) => row.table_name)
}

async function checkNeonSchema() {
  const expected = ["users", "repositories", "projects", "stacks"]
  const foundTables = await getTables()
  const missingTables = expected.filter(t => !foundTables.includes(t))
  const columns: Record<string, any[] | null> = {}
  for (const table of expected) {
    if (foundTables.includes(table)) {
      columns[table] = await getTableColumns(table)
    } else {
      columns[table] = null
    }
  }
  return { missingTables, columns }
}

module.exports = { checkNeonSchema }

if (require.main === module) {
  checkNeonSchema().then(result => {
    console.log("Neon DB Schema Check:")
    if (result.missingTables.length) {
      console.log("Missing tables:", result.missingTables)
    }
    for (const [table, cols] of Object.entries(result.columns)) {
      if (cols === null) {
        console.log(`Table '${table}' is missing.`)
      } else {
        console.log(`Table '${table}' columns:`)
        ;(cols as any[]).forEach((col: any) => {
          console.log(`- ${col.column_name} (${col.data_type})${col.is_nullable === "NO" ? " NOT NULL" : ""}${col.column_default ? ` DEFAULT ${col.column_default}` : ""}`)
        })
      }
    }
  }).catch((e: any) => {
    console.error("Error checking Neon schema:", e)
  })
}
