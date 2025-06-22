import { Pool } from "pg"
import dotenv from "dotenv"
import { EventEmitter } from "events"

dotenv.config()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

export const ee = new EventEmitter() // ← Add this

pool.connect((err, client, release) => {
  if (err) console.error("❌ Error connecting to Neon:", err)
  else {
    console.log("✅ Connected to Neon database")
    release()
  }
})
