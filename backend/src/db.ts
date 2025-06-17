import { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config()

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Test connection
db.connect((err, client, release) => {
  if (err) {
    console.error("❌ Error connecting to Neon database:", err)
  } else {
    console.log("✅ Connected to Neon database")
    release()
  }
})
