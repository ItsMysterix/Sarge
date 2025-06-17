"use client"

import { io, type Socket } from "socket.io-client"

class SocketManager {
  private socket: Socket | null = null
  private url: string

  constructor() {
    this.url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  }

  connect() {
    if (!this.socket) {
      this.socket = io(this.url, {
        transports: ["websocket", "polling"],
        autoConnect: true,
      })

      this.socket.on("connect", () => {
        console.log("🔌 Connected to Sarge Backend WebSocket")
      })

      this.socket.on("disconnect", () => {
        console.log("🔌 Disconnected from Sarge Backend")
      })

      this.socket.on("connect_error", (error) => {
        console.error("🔌 WebSocket connection error:", error)
      })
    }

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket() {
    return this.socket || this.connect()
  }

  // Event listeners
  onMetricsUpdate(callback: (metrics: any) => void) {
    this.getSocket().on("metrics:update", callback)
    return () => this.getSocket().off("metrics:update", callback)
  }

  onNewLog(callback: (log: any) => void) {
    this.getSocket().on("log:new", callback)
    return () => this.getSocket().off("log:new", callback)
  }

  onLogsUpdate(callback: (logs: any[]) => void) {
    this.getSocket().on("logs:update", callback)
    return () => this.getSocket().off("logs:update", callback)
  }

  onDeploymentStarted(callback: (deployment: any) => void) {
    this.getSocket().on("deployment:started", callback)
    return () => this.getSocket().off("deployment:started", callback)
  }

  onDeploymentProgress(callback: (progress: any) => void) {
    this.getSocket().on("deployment:progress", callback)
    return () => this.getSocket().off("deployment:progress", callback)
  }

  onDeploymentComplete(callback: (result: any) => void) {
    this.getSocket().on("deployment:complete", callback)
    return () => this.getSocket().off("deployment:complete", callback)
  }

  // Event emitters
  requestMetrics() {
    this.getSocket().emit("request:metrics")
  }

  requestLogs(type = "all", limit = 50) {
    this.getSocket().emit("request:logs", { type, limit })
  }

  triggerDeployment(branch = "main") {
    this.getSocket().emit("trigger:deployment", { branch })
  }
}

export const socketManager = new SocketManager()
export default socketManager
