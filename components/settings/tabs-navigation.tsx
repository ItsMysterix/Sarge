"use client"

import { SettingsIcon, Bell, Palette, Keyboard, Zap, Shield } from "lucide-react"

export type SettingsTab = "general" | "notifications" | "appearance" | "shortcuts" | "integrations" | "security"

interface TabsNavigationProps {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

const tabs = [
  { id: "general" as SettingsTab, label: "General", icon: SettingsIcon },
  { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
  { id: "appearance" as SettingsTab, label: "Appearance", icon: Palette },
  { id: "shortcuts" as SettingsTab, label: "Shortcuts", icon: Keyboard },
  { id: "integrations" as SettingsTab, label: "Integrations", icon: Zap },
  { id: "security" as SettingsTab, label: "Security", icon: Shield },
]

export function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  return (
    <div className="flex gap-2 border-b border-white/10 mb-6 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap
              ${isActive 
                ? 'text-accent border-accent' 
                : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
