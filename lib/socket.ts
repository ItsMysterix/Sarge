"use client"

import { io, type Socket } from "socket.io-client"

class SocketManager {
  private socket: Socket | null = null
  private url: string

  constructor() {
    this.url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000"
  }

  connect() {
    if (!this.socket) {
      this.socket = io(this.url, {
        transports: ["websocket", "polling"],
      })

      this.socket.on("connect", () => {
        console.log("🔌 Connected to Sarge Backend")
      })

      this.socket.on("disconnect", () => {
        console.log("🔌 Disconnected from Sarge Backend")
      })

      this.socket.on("connect_error", (error) => {
        console.error("🔌 Connection error:", error)
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

  // Convenience methods
  onMetricsUpdate(callback: (metrics: any) => void) {
    this.getSocket().on("metrics-update", callback)
  }

  onNewLog(callback: (log: any) => void) {
    this.getSocket().on("new-log", callback)
  }

  onDeploymentStarted(callback: (deployment: any) => void) {
    this.getSocket().on("deployment-started", callback)
  }

  onDeploymentProgress(callback: (progress: any) => void) {
    this.getSocket().on("deployment-progress", callback)
  }

  onDeploymentComplete(callback: (result: any) => void) {
    this.getSocket().on("deployment-complete", callback)
  }

  triggerDeployment(branch = "main") {
    this.getSocket().emit("trigger-deployment", { branch })
  }

  refreshMetrics() {
    this.getSocket().emit("refresh-metrics")
  }
}

export const socketManager = new SocketManager()
