import express from "express"
import cors from "cors"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

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

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Sarge Backend API",
  })
})

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    message: "🚀 Sarge DevOps Backend API",
    version: "1.0.0",
    endpoints: {
      "POST /api/deploy": "Create new deployment",
      "GET /api/logs?type=error": "Get filtered logs",
      "GET /api/metrics": "Get latest metrics",
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sarge Backend API running on http://localhost:${PORT}`)
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/*`)
  console.log(`🏥 Health check: http://localhost:${PORT}/health`)
})

export default app
