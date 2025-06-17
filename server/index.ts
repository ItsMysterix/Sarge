import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import dotenv from "dotenv"
import { Pool } from "pg"

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Middleware
app.use(cors())
app.use(express.json())

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting to database:", err)
  } else {
    console.log("✅ Connected to database")
    release()
  }
})

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`)

  // Join dashboard room for real-time updates
  socket.join("dashboard")

  // Handle client disconnect
  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`)
  })

  // Handle manual metric refresh
  socket.on("refresh-metrics", async () => {
    try {
      const metrics = await getLatestMetrics()
      socket.emit("metrics-update", metrics)
    } catch (error) {
      socket.emit("error", { message: "Failed to fetch metrics" })
    }
  })

  // Handle deployment trigger
  socket.on("trigger-deployment", async (data) => {
    try {
      const deployment = await createDeployment(data.branch || "main")
      io.to("dashboard").emit("deployment-started", deployment)

      // Simulate deployment progress
      simulateDeployment(deployment.id)
    } catch (error) {
      socket.emit("error", { message: "Failed to trigger deployment" })
    }
  })
})

// Database helper functions
async function getLatestMetrics() {
  try {
    const result = await pool.query(`
      SELECT * FROM metrics 
      ORDER BY timestamp DESC 
      LIMIT 1
    `)

    if (result.rows.length === 0) {
      return generateMockMetrics()
    }

    return result.rows[0]
  } catch (error) {
    console.error("Database error, using mock data:", error)
    return generateMockMetrics()
  }
}

async function createDeployment(branch: string) {
  const commit = Math.random().toString(36).substring(2, 9)
  const deployment = {
    id: Math.random().toString(36).substring(2, 9),
    branch,
    commit,
    status: "pending",
    summary: `Deployment triggered from ${branch} branch`,
    created_at: new Date().toISOString(),
  }

  try {
    await pool.query(
      `
      INSERT INTO deployments (branch, commit, status, summary, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [deployment.branch, deployment.commit, deployment.status, deployment.summary, deployment.created_at],
    )
  } catch (error) {
    console.error("Failed to save deployment to database:", error)
  }

  return deployment
}

async function addLogEntry(type: string, message: string, service: string) {
  const logEntry = {
    id: Math.random().toString(36).substring(2, 9),
    type,
    message,
    service,
    timestamp: new Date().toISOString(),
  }

  try {
    await pool.query(
      `
      INSERT INTO logs (type, message, service, timestamp)
      VALUES ($1, $2, $3, $4)
    `,
      [logEntry.type, logEntry.message, logEntry.service, logEntry.timestamp],
    )
  } catch (error) {
    console.error("Failed to save log to database:", error)
  }

  // Broadcast to all connected clients
  io.to("dashboard").emit("new-log", logEntry)

  return logEntry
}

// Mock data generators
function generateMockMetrics() {
  return {
    id: Math.random().toString(36).substring(2, 9),
    cpu: 68 + Math.floor(Math.random() * 20) - 10,
    memory: 83 + Math.floor(Math.random() * 10) - 5,
    latency: 45 + Math.floor(Math.random() * 20) - 10,
    cost: 91.4 + Math.random() * 10 - 5,
    timestamp: new Date().toISOString(),
  }
}

// Simulate deployment process
async function simulateDeployment(deploymentId: string) {
  const stages = [
    { stage: "building", message: "Building application...", duration: 2000 },
    { stage: "testing", message: "Running tests...", duration: 3000 },
    { stage: "deploying", message: "Deploying to production...", duration: 2000 },
  ]

  for (const stage of stages) {
    await new Promise((resolve) => setTimeout(resolve, stage.duration))

    io.to("dashboard").emit("deployment-progress", {
      id: deploymentId,
      stage: stage.stage,
      message: stage.message,
    })

    // Add log entries for deployment stages
    await addLogEntry("info", stage.message, "deployment-service")
  }

  // Final deployment result
  const success = Math.random() > 0.2 // 80% success rate
  const finalStatus = success ? "success" : "failed"
  const finalMessage = success ? "Deployment completed successfully" : "Deployment failed - check logs"

  try {
    await pool.query(
      `
      UPDATE deployments 
      SET status = $1, summary = $2 
      WHERE id = $3
    `,
      [finalStatus, finalMessage, deploymentId],
    )
  } catch (error) {
    console.error("Failed to update deployment status:", error)
  }

  io.to("dashboard").emit("deployment-complete", {
    id: deploymentId,
    status: finalStatus,
    message: finalMessage,
  })

  await addLogEntry(success ? "info" : "error", finalMessage, "deployment-service")
}

// REST API endpoints (for compatibility with existing frontend)
app.get("/api/metrics", async (req, res) => {
  try {
    const metrics = await getLatestMetrics()
    res.json(metrics)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch metrics" })
  }
})

app.get("/api/logs", async (req, res) => {
  try {
    const { type } = req.query
    let query = "SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100"
    let params: any[] = []

    if (type && type !== "all") {
      query = "SELECT * FROM logs WHERE type = $1 ORDER BY timestamp DESC LIMIT 100"
      params = [type]
    }

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error("Database error:", error)
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
    res.json(mockLogs)
  }
})

// Simulate real-time data updates
setInterval(async () => {
  const metrics = generateMockMetrics()
  io.to("dashboard").emit("metrics-update", metrics)

  // Occasionally generate random log entries
  if (Math.random() > 0.7) {
    const logTypes = ["info", "warn", "error"]
    const services = ["api-gateway", "database", "worker-queue", "cache-service"]
    const messages = [
      "Request processed successfully",
      "High memory usage detected",
      "Connection timeout occurred",
      "Cache miss for key: user_session_123",
      "Database query executed in 45ms",
    ]

    await addLogEntry(
      logTypes[Math.floor(Math.random() * logTypes.length)],
      messages[Math.floor(Math.random() * messages.length)],
      services[Math.floor(Math.random() * services.length)],
    )
  }
}, 5000) // Update every 5 seconds

const PORT = process.env.PORT || 8000

server.listen(PORT, () => {
  console.log(`🚀 Sarge Backend Server running on port ${PORT}`)
  console.log(`📊 Dashboard updates: ws://localhost:${PORT}`)
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api/*`)
})

export { io, pool }
