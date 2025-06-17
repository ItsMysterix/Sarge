import { create } from "zustand"

interface AppState {
  // Loading states
  isDeploying: boolean
  isRebuilding: boolean
  isTestingWebhook: boolean

  // Data
  deployments: any[]
  metrics: any
  insights: any[]
  logs: any[]

  // Actions
  setDeploying: (loading: boolean) => void
  setRebuilding: (loading: boolean) => void
  setTestingWebhook: (loading: boolean) => void
  setDeployments: (deployments: any[]) => void
  setMetrics: (metrics: any) => void
  setInsights: (insights: any[]) => void
  setLogs: (logs: any[]) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  isDeploying: false,
  isRebuilding: false,
  isTestingWebhook: false,
  deployments: [],
  metrics: {},
  insights: [],
  logs: [],

  // Actions
  setDeploying: (loading) => set({ isDeploying: loading }),
  setRebuilding: (loading) => set({ isRebuilding: loading }),
  setTestingWebhook: (loading) => set({ isTestingWebhook: loading }),
  setDeployments: (deployments) => set({ deployments }),
  setMetrics: (metrics) => set({ metrics }),
  setInsights: (insights) => set({ insights }),
  setLogs: (logs) => set({ logs }),
}))
