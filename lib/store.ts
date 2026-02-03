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

export interface SidebarState {
  collapsed: boolean
  pinnedRoutes: string[]
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

  // Sidebar Actions
  sidebarByProject: Record<string, SidebarState>
  getSidebarStateFor: (projectId?: string | null) => SidebarState
  toggleSidebarCollapsed: (projectId?: string | null) => void
  togglePinnedRoute: (projectId: string | null | undefined, route: string) => void
}

const SIDEBAR_STORAGE_KEY = (projectId: string) => `sarge_sidebar_state_${projectId}`
const DEFAULT_SIDEBAR_STATE: SidebarState = { collapsed: false, pinnedRoutes: [] }

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
      },

      // Sidebar implementation
      sidebarByProject: {},
      getSidebarStateFor: (projectId) => {
        const pid = projectId ?? "_none_"
        const map = get().sidebarByProject
        if (!map[pid]) {
          // Attempt web container sync or return default
          return DEFAULT_SIDEBAR_STATE
        }
        return map[pid]
      },
      toggleSidebarCollapsed: (projectId) => {
        const pid = projectId ?? "_none_"
        const current = get().getSidebarStateFor(pid)
        const next = { ...current, collapsed: !current.collapsed }
        set((s) => ({ sidebarByProject: { ...s.sidebarByProject, [pid]: next } }))
        try { localStorage.setItem(SIDEBAR_STORAGE_KEY(pid), JSON.stringify(next)) } catch { }
      },
      togglePinnedRoute: (projectId, route) => {
        const pid = projectId ?? "_none_"
        const current = get().getSidebarStateFor(pid)
        const pinned = new Set(current.pinnedRoutes)
        if (pinned.has(route)) pinned.delete(route); else pinned.add(route)
        const next = { ...current, pinnedRoutes: Array.from(pinned) }
        set((s) => ({ sidebarByProject: { ...s.sidebarByProject, [pid]: next } }))
        try { localStorage.setItem(SIDEBAR_STORAGE_KEY(pid), JSON.stringify(next)) } catch { }
      },
    }),
    {
      name: 'sarge-app-storage',
      partialize: (state) => ({
        lastDeployment: state.lastDeployment,
        sidebarByProject: state.sidebarByProject
      }),
    }
  )
)
