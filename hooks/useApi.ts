"use client"

import { useEffect, useState } from "react"
import type { Insight, Metric, Deployment, Log, Service, ServiceUptime, UserSettings } from "@/lib/types"

// Generic fetch hook with error handling
function useFetch<T>(url: string, options?: { interval?: number; dependencies?: any[] }) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    async function fetchData() {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up polling if interval is specified
    if (options?.interval) {
      intervalId = setInterval(fetchData, options.interval)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, options?.dependencies || [])

  return { data, loading, error }
}

export function useInsights() {
  return useFetch<Insight>("/api/insights")
}

export function useMetrics() {
  return useFetch<Metric>("/api/metrics", { interval: 10000 }) // Poll every 10 seconds
}

export function useDeployments() {
  const { data, loading, error } = useFetch<Deployment[]>("/api/deployments", { interval: 5000 }) // Auto-refresh every 5s

  const triggerDeployment = async (branch = "main") => {
    const response = await fetch("/api/deploy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ branch }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  return { data: data || [], loading, error, triggerDeployment }
}

export function useLogs(type?: string) {
  const url = type && type !== "ALL" ? `/api/logs?type=${type.toLowerCase()}` : "/api/logs"
  return useFetch<Log[]>(url, { interval: 5000 }) // Poll every 5 seconds
}

export function useServices() {
  return useFetch<Service[]>("/api/services")
}

export function useServiceUptime(serviceId: string) {
  const url = serviceId ? `/api/services/${serviceId}/uptime` : null
  const [data, setData] = useState<ServiceUptime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return

    async function fetchUptime() {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch uptime")
      } finally {
        setLoading(false)
      }
    }

    fetchUptime()
  }, [url])

  return { data, loading, error }
}

export function useUserSettings() {
  const { data, loading, error } = useFetch<UserSettings>("/api/settings")

  const updateSettings = async (updates: Partial<Omit<UserSettings, "id" | "user_id">>) => {
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  return { data, loading, error, updateSettings }
}
