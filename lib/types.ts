// Database types for Neon backend
export interface Insight {
  id: string
  date: string
  grade: "A" | "B" | "C" | "D" | "F"
  tips: string[]
  created_at: string
}

export interface Metric {
  id: string
  cpu: number
  memory: number
  latency: number
  cost: number
  timestamp: string
}

export interface Deployment {
  id: string
  branch: string
  commit: string
  status: "pending" | "success" | "failed"
  summary: string
  created_at: string
}

export interface Log {
  id: string
  type: "info" | "error" | "alert" | "warn"
  message: string
  service: string
  timestamp: string
}

export interface Service {
  id: string
  name: string
  status: "up" | "down" | "degraded"
  cost_hr: number
  uptime_percent: number
}

export interface ServiceUptime {
  id: string
  service_id: string
  timestamp: string
  value: number
}

export interface UserSettings {
  id: string
  user_id: string
  slack_alerts: boolean
  auto_rebuild: boolean
}
