'use client'
import { trpc } from "@/lib/trpc"
import { useEffect, useState } from "react"

const t = trpc as any

export const useMetrics = () => {
  const { data: metrics, isLoading: loading } = t.metrics.latest.useQuery()
  return { metrics, loading }
}

export const useLiveMetrics = () => {
  const { data } = t.metrics.live.useSubscription(undefined, {
    enabled: true,
  })
  return { data }
}

export const useLiveLogs = () => {
  const { data } = t.logs.stream.useSubscription(undefined, {
    enabled: true,
  })
  return { data }
}

export const useDeploymentStatus = () => {
  const { data } = t.deploy.subscribe.useSubscription(undefined, {
    enabled: true,
  })
  return { data }
}

export const useTriggerDeployment = () => {
  return t.deploy.create.useMutation()
}

// Settings API hook (uses Next.js route handlers under /api/settings)
export type UserSettings = {
  id: string
  user_id: string
  slack_alerts: boolean
  auto_rebuild: boolean
  enable_animations?: boolean
  theme_mode?: 'dark' | 'light' | 'auto'
  notifications?: {
    deploySuccess: boolean
    deployFailure: boolean
    serviceDown: boolean
    highCpu: boolean
    highMemory: boolean
    securityAlerts: boolean
    emailNotifications: boolean
    slackNotifications: boolean
  }
}

export const useUserSettings = () => {
  const [data, setData] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await fetch('/api/settings', { cache: 'no-store' })
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch {
        // swallow; UI will show defaults
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function updateSettings(patch: Partial<Omit<UserSettings, 'id' | 'user_id'>>) {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const json = await res.json()
    setData(json)
    return json as UserSettings
  }

  return { data, loading, updateSettings }
}
