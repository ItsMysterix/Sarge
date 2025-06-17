import type { Server as HttpServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import { db } from "./db"

export let io: SocketIOServer

export function initSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id)

    // Join dashboard room for organized broadcasting
    socket.join("dashboard")

    // Handle client requests
    socket.on("request:metrics", async () => {
      try {
        const result = await db.query("SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 1")
        const metrics = result.rows[0] || generateMockMetrics()
        socket.emit("metrics:update", metrics)
      } catch (error) {
        socket.emit("metrics:update", generateMockMetrics())
      }
    })

    socket.on("request:logs", async (data) => {
      try {
        const { type = "all", limit = 50 } = data
        let query = "SELECT * FROM logs ORDER BY timestamp DESC LIMIT $1"
        let params = [limit]

        if (type !== "all") {
          query = "SELECT * FROM logs WHERE type = $1 ORDER BY timestamp DESC LIMIT $2"
          params = [type, limit]
        }

        const result = await db.query(query, params)
        socket.emit("logs:update", result.rows)
      } catch (error) {
        socket.emit("logs:update", [])
      }
    })

    socket.on("trigger:deployment", async (data) => {
      const { branch = "main" } = data
      try {
        const deployment = await createDeployment(branch)
        io.to("dashboard").emit("deployment:started", deployment)

        // Simulate deployment process
        simulateDeployment(deployment.id)
      } catch (error) {
        socket.emit("error", { message: "Failed to trigger deployment" })
      }
    })

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id)
    })
  })

  // Broadcast real-time updates every 5 seconds
  setInterval(async () => {
    try {
      // Send live metrics
      const metricsResult = await db.query("SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 1")
      const metrics = metricsResult.rows[0] || generateMockMetrics()
      io.to("dashboard").emit("metrics:update", metrics)

      // Occasionally generate random log entries for demo
      if (Math.random() > 0.7) {
        const mockLog = generateMockLog()
        await addLogToDatabase(mockLog)
        io.to("dashboard").emit("log:new", mockLog)
      }
    } catch (error) {
      console.error("Error in real-time updates:", error)
    }
  }, 5000)

  console.log("🔌 Socket.IO initialized")
}

// Helper functions
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
    await db.query(
      "INSERT INTO deployments (branch, commit, status, summary, created_at) VALUES ($1, $2, $3, $4, $5)",
      [deployment.branch, deployment.commit, deployment.status, deployment.summary, deployment.created_at],
    )
  } catch (error) {
    console.error("Failed to save deployment:", error)
  }

  return deployment
}

async function simulateDeployment(deploymentId: string) {
  const stages = [
    { stage: "building", message: "Building application...", duration: 2000 },
    { stage: "testing", message: "Running tests...", duration: 3000 },
    { stage: "deploying", message: "Deploying to production...", duration: 2000 },
  ]

  for (const stage of stages) {
    await new Promise((resolve) => setTimeout(resolve, stage.duration))

    io.to("dashboard").emit("deployment:progress", {
      id: deploymentId,
      stage: stage.stage,
      message: stage.message,
    })

    // Add log entry for each stage
    const logEntry = {
      type: "info",
      message: stage.message,
      service: "deployment-service",
      timestamp: new Date().toISOString(),
    }
    await addLogToDatabase(logEntry)
    io.to("dashboard").emit("log:new", logEntry)
  }

  // Final result
  const success = Math.random() > 0.2
  const finalStatus = success ? "success" : "failed"
  const finalMessage = success ? "Deployment completed successfully" : "Deployment failed - check logs"

  try {
    await db.query("UPDATE deployments SET status = $1, summary = $2 WHERE id = $3", [
      finalStatus,
      finalMessage,
      deploymentId,
    ])
  } catch (error) {
    console.error("Failed to update deployment:", error)
  }

  io.to("dashboard").emit("deployment:complete", {
    id: deploymentId,
    status: finalStatus,
    message: finalMessage,
  })

  const finalLog = {
    type: success ? "info" : "error",
    message: finalMessage,
    service: "deployment-service",
    timestamp: new Date().toISOString(),
  }
  await addLogToDatabase(finalLog)
  io.to("dashboard").emit("log:new", finalLog)
}

async function addLogToDatabase(log: any) {
  try {
    await db.query("INSERT INTO logs (type, message, service, timestamp) VALUES ($1, $2, $3, $4)", [
      log.type,
      log.message,
      log.service,
      log.timestamp,
    ])
  } catch (error) {
    console.error("Failed to save log:", error)
  }
}

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

function generateMockLog() {
  const types = ["info", "warn", "error"]
  const services = ["api-gateway", "database", "worker-queue", "cache-service"]
  const messages = [
    "Request processed successfully",
    "High memory usage detected",
    "Connection timeout occurred",
    "Cache miss for key: user_session_123",
    "Database query executed in 45ms",
    "Authentication successful",
    "Rate limit exceeded for IP",
  ]

  return {
    id: Math.random().toString(36).substring(2, 9),
    type: types[Math.floor(Math.random() * types.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    service: services[Math.floor(Math.random() * services.length)],
    timestamp: new Date().toISOString(),
  }
}
