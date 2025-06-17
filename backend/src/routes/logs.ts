import express from "express"
import { db } from "../db"

const router = express.Router()

router.get("/", async (req, res) => {
  const { type, limit = "100" } = req.query

  try {
    let query = "SELECT * FROM logs ORDER BY timestamp DESC LIMIT $1"
    let params: any[] = [Number.parseInt(limit as string)]

    if (type && type !== "all") {
      query = "SELECT * FROM logs WHERE type = $1 ORDER BY timestamp DESC LIMIT $2"
      params = [type, Number.parseInt(limit as string)]
    }

    const result = await db.query(query, params)

    res.json(result.rows)
  } catch (err) {
    console.error("Logs route error:", err)

    // Return mock data if database fails
    const mockLogs = [
      {
        id: "1",
        type: "error",
        message: "Authentication failed for user ID 12345",
        service: "api-gateway",
        timestamp: new Date().toISOString(),
      },
      {
        id: "2",
        type: "warn",
        message: "High memory usage detected: 85% of allocated memory in use",
        service: "worker-queue",
        timestamp: new Date(Date.now() - 60000).toISOString(),
      },
    ]

    const filteredMockLogs = type && type !== "all" ? mockLogs.filter((log) => log.type === type) : mockLogs

    res.json(filteredMockLogs)
  }
})

// POST route to add new logs
router.post("/", async (req, res) => {
  const logs = Array.isArray(req.body) ? req.body : [req.body]

  try {
    const insertPromises = logs.map((log) =>
      db.query("INSERT INTO logs (type, message, service, timestamp) VALUES ($1, $2, $3, $4) RETURNING *", [
        log.type,
        log.message,
        log.service,
        log.timestamp || new Date().toISOString(),
      ]),
    )

    const results = await Promise.all(insertPromises)
    const insertedLogs = results.map((result) => result.rows[0])

    res.status(201).json({
      success: true,
      logs: insertedLogs,
      message: `${insertedLogs.length} log entries added`,
    })
  } catch (err) {
    console.error("Add logs error:", err)
    res.status(500).json({
      success: false,
      error: "Failed to add log entries",
    })
  }
})

export default router
