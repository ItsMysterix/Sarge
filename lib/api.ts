const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Generic fetch wrapper with error handling
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error)
    throw error
  }
}

// API Functions
export async function getLogs(type?: string, limit = 100) {
  const params = new URLSearchParams()
  if (type && type !== "ALL") params.append("type", type.toLowerCase())
  if (limit) params.append("limit", limit.toString())

  const query = params.toString() ? `?${params.toString()}` : ""
  return apiRequest(`/logs${query}`)
}

export async function addLogs(logs: any[]) {
  return apiRequest("/logs", {
    method: "POST",
    body: JSON.stringify(logs),
  })
}

export async function getMetrics() {
  return apiRequest("/metrics")
}

export async function addMetrics(metrics: any) {
  return apiRequest("/metrics", {
    method: "POST",
    body: JSON.stringify(metrics),
  })
}

export async function getInsights() {
  return apiRequest("/insights")
}

export async function addInsights(insights: any) {
  return apiRequest("/insights", {
    method: "POST",
    body: JSON.stringify(insights),
  })
}

export async function deploy(payload: { branch?: string; commit?: string; summary?: string }) {
  return apiRequest("/deploy", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getDeployments() {
  // Note: You'll need to add this endpoint to your backend
  return apiRequest("/deployments")
}

// Real-time broadcasting endpoints
export async function broadcastNewLog(log: any) {
  return apiRequest("/logs/new", {
    method: "POST",
    body: JSON.stringify(log),
  })
}

export async function broadcastNewMetrics(metrics: any) {
  return apiRequest("/metrics/new", {
    method: "POST",
    body: JSON.stringify(metrics),
  })
}

// Health check
export async function getHealth() {
  return apiRequest("/../health") // Goes to /health instead of /api/health
}
