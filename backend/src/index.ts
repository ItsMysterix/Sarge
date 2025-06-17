import express from "express"
import http from "http"
import cors from "cors"
import dotenv from "dotenv"
import { initSocket, io } from "./socket"

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Create HTTP server
const server = http.createServer(app)

// Initialize Socket.IO
initSocket(server)

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())

// Import routes
import deployRoute from "./routes/deploy"
import logsRoute from "./routes/logs"
import metricsRoute from "./routes/metrics"
import insightsRoute from "./routes/insights"

// Use routes
app.use("/api/deploy", deployRoute)
app.use("/api/logs", logsRoute)
app.use("/api/metrics", metricsRoute)
app.use("/api/insights", insightsRoute)

// Real-time endpoint to broadcast new logs
app.post("/api/logs/new", (req, res) => {
  const log = req.body

  // Add timestamp if not provided
  if (!log.timestamp) {
    log.timestamp = new Date().toISOString()
  }

  // Broadcast to all connected clients
  io.to("dashboard").emit("log:new", log)

  res.status(200).json({
    success: true,
    message: "Log broadcasted to all clients",
  })
})

// Real-time endpoint to broadcast metrics
app.post("/api/metrics/new", (req, res) => {
  const metrics = req.body

  // Add timestamp if not provided
  if (!metrics.timestamp) {
    metrics.timestamp = new Date().toISOString()
  }

  // Broadcast to all connected clients
  io.to("dashboard").emit("metrics:update", metrics)

  res.status(200).json({
    success: true,
    message: "Metrics broadcasted to all clients",
  })
})

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Sarge Backend API",
    websocket: "active",
  })
})

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    message: "🚀 Sarge DevOps Backend API with WebSockets",
    version: "1.0.0",
    websocket: "Socket.IO enabled",
    endpoints: {
      "POST /api/deploy": "Create new deployment",
      "GET /api/logs?type=error": "Get filtered logs",
      "POST /api/logs/new": "Broadcast new log via WebSocket",
      "GET /api/metrics": "Get latest metrics",
      "POST /api/metrics/new": "Broadcast new metrics via WebSocket",
      "GET /api/insights": "Get today's system health + tips",
    },
  })
})

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err)
  res.status(500).json({
    success: false,
    error: "Internal server error",
  })
})

// Start server with HTTP and WebSocket support
server.listen(PORT, () => {
  console.log(`🚀 Sarge Backend API running on http://localhost:${PORT}`)
  console.log(`🔌 WebSocket server active on ws://localhost:${PORT}`)
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/*`)
  console.log(`🏥 Health check: http://localhost:${PORT}/health`)
})

export default app
