"use client"

import { useEffect, useState } from "react"
import { getLogs, getMetrics, getInsights, deploy as deployAPI } from "@/lib/api"
import { socketManager } from "@/lib/socket"
import type { Insight, Metric, Deployment, Log, Service, ServiceUptime, UserSettings } from "@/lib/types"

// Generic hook for API calls with WebSocket integration
function useApiWithSocket<T>(apiCall: () => Promise<T>, socketEvent?: string, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cleanup: (() => void) | undefined

    async function fetchData() {
      try {
        setLoading(true)
        const result = await apiCall()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
        console.error("API call failed:", err)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchData()

    // Set up WebSocket listener if provided
    if (socketEvent) {
      switch (socketEvent) {
        case "metrics":
          cleanup = socketManager.onMetricsUpdate((newData: T) => {
            setData(newData)
          })
          break
        case "logs":
          cleanup = socketManager.onLogsUpdate((newData: T) => {
            setData(newData)
          })
          break
      }
    }

    return cleanup
  }, dependencies)

  return { data, loading, error, refetch: apiCall }
}

export function useInsights() {
  const { data, loading, error } = useApiWithSocket<Insight>(getInsights)
  return { data, loading, error }
}

export function useMetrics() {
  const [data, setData] = useState<Metric | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initial fetch
    async function fetchMetrics() {
      try {
        const result = await getMetrics()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch metrics")
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()

    // Set up real-time updates
    const cleanup = socketManager.onMetricsUpdate((newMetrics: Metric) => {
      setData(newMetrics)
    })

    return cleanup
  }, [])

  return { data, loading, error }
}

export function useDeployments() {
  const [data, setData] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // For now, we'll use mock data since getDeployments isn't implemented yet
    setData([
      {
        id: "1",
        branch: "main",
        commit: "a7f3c2d",
        status: "success",
        summary: "Deployment completed successfully",
        created_at: new Date().toISOString(),
      },
    ])
    setLoading(false)

    // Set up real-time deployment updates
    const cleanupStarted = socketManager.onDeploymentStarted((deployment: Deployment) => {
      setData((prev) => [deployment, ...prev])
    })

    const cleanupComplete = socketManager.onDeploymentComplete((result: any) => {
      setData((prev) =>
        prev.map((d) => (d.id === result.id ? { ...d, status: result.status, summary: result.message } : d)),
      )
    })

    return () => {
      cleanupStarted()
      cleanupComplete()
    }
  }, [])

  const triggerDeployment = async (branch = "main") => {
    try {
      const result = await deployAPI({ branch })
      return result
    } catch (error) {
      throw error
    }
  }

  return { data, loading, error, triggerDeployment }
}

export function useLogs(type?: string) {
  const [data, setData] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLogs() {
      try {
        const result = await getLogs(type)
        setData(Array.isArray(result) ? result : [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch logs")
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()

    // Set up real-time log updates
    const cleanup = socketManager.onNewLog((newLog: Log) => {
      setData((prev) => [newLog, ...prev.slice(0, 99)]) // Keep last 100 logs
    })

    return cleanup
  }, [type])

  return { data, loading, error }
}

// Keep existing hooks for services and settings (these still use mock data)
export function useServices() {
  const [data, setData] = useState<Service[]>([
    {
      id: "1",
      name: "API Gateway",
      status: "up",
      cost_hr: 1.02,
      uptime_percent: 99.9,
    },
    {
      id: "2",
      name: "PostgreSQL DB",
      status: "up",
      cost_hr: 1.88,
      uptime_percent: 99.8,
    },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return { data, loading, error }
}

export function useServiceUptime(serviceId: string) {
  const [data, setData] = useState<ServiceUptime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Generate mock uptime data
    const mockUptime = Array.from({ length: 24 }, (_, i) => ({
      id: `${i}`,
      service_id: serviceId,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      value: 95 + Math.random() * 5,
    }))

    setData(mockUptime)
    setLoading(false)
  }, [serviceId])

  return { data, loading, error }
}

export function useUserSettings() {
  const [data, setData] = useState<UserSettings>({
    id: "1",
    user_id: "dev-mode",
    slack_alerts: true,
    auto_rebuild: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateSettings = async (updates: Partial<Omit<UserSettings, "id" | "user_id">>) => {
    setData((prev) => ({ ...prev, ...updates }))
    return data
  }

  return { data, loading, error, updateSettings }
}
