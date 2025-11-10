import { create } from "zustand"

export interface SidebarState {
  collapsed: boolean
  pinnedRoutes: string[]
}

interface SidebarStore {
  // Map projectId -> state
  byProject: Record<string, SidebarState>
  getStateFor: (projectId?: string | null) => SidebarState
  toggleCollapsed: (projectId?: string | null) => void
  togglePinnedRoute: (projectId: string | null | undefined, route: string) => void
  hydrate: (projectId?: string | null) => void
}

const STORAGE_KEY = (projectId: string) => `sarge_sidebar_state_${projectId}`

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  byProject: {},

  getStateFor: (projectId) => {
    const pid = projectId ?? "_none_"
    const map = get().byProject
    if (!map[pid]) {
      // default state
      return { collapsed: false, pinnedRoutes: [] }
    }
    return map[pid]
  },

  toggleCollapsed: (projectId) => {
    const pid = projectId ?? "_none_"
    const current = get().getStateFor(pid)
    const next = { ...current, collapsed: !current.collapsed }
    set((s) => ({ byProject: { ...s.byProject, [pid]: next } }))
    try { localStorage.setItem(STORAGE_KEY(pid), JSON.stringify(next)) } catch {}
  },

  togglePinnedRoute: (projectId, route) => {
    const pid = projectId ?? "_none_"
    const current = get().getStateFor(pid)
    const pinned = new Set(current.pinnedRoutes)
    if (pinned.has(route)) pinned.delete(route); else pinned.add(route)
    const next = { ...current, pinnedRoutes: Array.from(pinned) }
    set((s) => ({ byProject: { ...s.byProject, [pid]: next } }))
    try { localStorage.setItem(STORAGE_KEY(pid), JSON.stringify(next)) } catch {}
  },

  hydrate: (projectId) => {
    const pid = projectId ?? "_none_"
    try {
      const raw = localStorage.getItem(STORAGE_KEY(pid))
      if (raw) {
        const parsed = JSON.parse(raw) as SidebarState
        set((s) => ({ byProject: { ...s.byProject, [pid]: parsed } }))
      }
    } catch {}
  },
}))
