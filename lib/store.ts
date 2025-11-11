import { create } from "zustand"
import { persist } from "zustand/middleware"

type DeploymentStatus = 'success' | 'failed' | 'stale'

interface LastDeployment {
  id: string
  branch: string
  commit: string
  status: DeploymentStatus
  image?: string
  ports?: number[]
  timestamp: string
}

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
  lastDeployment: LastDeployment | null

  // Actions
  setDeploying: (loading: boolean) => void
  setRebuilding: (loading: boolean) => void
  setTestingWebhook: (loading: boolean) => void
  setDeployments: (deployments: any[]) => void
  setMetrics: (metrics: any) => void
  setInsights: (insights: any[]) => void
  setLogs: (logs: any[]) => void
  setLastDeployment: (deployment: LastDeployment | null) => void
  getSystemStatus: () => 'online' | 'error' | 'stale'
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isDeploying: false,
      isRebuilding: false,
      isTestingWebhook: false,
      deployments: [],
      metrics: {},
      insights: [],
      logs: [],
      lastDeployment: null,

      // Actions
      setDeploying: (loading) => set({ isDeploying: loading }),
      setRebuilding: (loading) => set({ isRebuilding: loading }),
      setTestingWebhook: (loading) => set({ isTestingWebhook: loading }),
      setDeployments: (deployments) => set({ deployments }),
      setMetrics: (metrics) => set({ metrics }),
      setInsights: (insights) => set({ insights }),
      setLogs: (logs) => set({ logs }),
      setLastDeployment: (deployment) => set({ lastDeployment: deployment }),
      
      getSystemStatus: () => {
        const { lastDeployment } = get()
        if (!lastDeployment) return 'stale'
        
        // Check if deployment is stale (older than 24 hours)
        const deploymentTime = new Date(lastDeployment.timestamp).getTime()
        const now = Date.now()
        const hoursSinceDeployment = (now - deploymentTime) / (1000 * 60 * 60)
        
        if (hoursSinceDeployment > 24) return 'stale'
        if (lastDeployment.status === 'failed') return 'error'
        return 'online'
      }
    }),
    {
      name: 'sarge-app-storage',
      partialize: (state) => ({ lastDeployment: state.lastDeployment }),
    }
  )
)
