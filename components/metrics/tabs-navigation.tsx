"use client"

import { Activity, TrendingUp, Server, Database } from "lucide-react"

type TabType = 'overview' | 'performance' | 'infrastructure' | 'services'

interface TabsNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs = [
  { id: 'overview' as TabType, label: 'Overview', icon: Activity },
  { id: 'performance' as TabType, label: 'Performance', icon: TrendingUp },
  { id: 'infrastructure' as TabType, label: 'Infrastructure', icon: Server },
  { id: 'services' as TabType, label: 'Services', icon: Database },
]

export function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all
              ${isActive 
                ? 'bg-accent/20 text-accent border border-accent/30' 
                : 'glass-card text-gray-400 hover:text-white hover:bg-white/5 border border-white/10'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
