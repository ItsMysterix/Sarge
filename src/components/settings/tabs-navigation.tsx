"use client"

import { SettingsIcon, Bell, Palette, Keyboard, Zap, Shield, Key, Cloud, Globe, Users, Webhook } from "lucide-react"

export type SettingsTab = "general" | "variables" | "targets" | "notifications" | "appearance" | "integrations" | "security" | "shortcuts" | "domains" | "members" | "webhooks"

interface TabsNavigationProps {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

const tabs = [
  { id: "general" as SettingsTab, label: "General", icon: SettingsIcon },
  { id: "variables" as SettingsTab, label: "Variables", icon: Key },
  { id: "targets" as SettingsTab, label: "Targets", icon: Cloud },
  { id: "integrations" as SettingsTab, label: "Integrations", icon: Zap },
  { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
  { id: "domains" as SettingsTab, label: "Domains", icon: Globe },
  { id: "members" as SettingsTab, label: "Members", icon: Users },
  { id: "webhooks" as SettingsTab, label: "Webhooks", icon: Webhook },
  { id: "appearance" as SettingsTab, label: "Appearance", icon: Palette },
  { id: "security" as SettingsTab, label: "Security", icon: Shield },
  { id: "shortcuts" as SettingsTab, label: "Shortcuts", icon: Keyboard },
]

export function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  return (
    <div className="flex gap-1 border-b border-white/[0.06] mb-6 overflow-x-auto pb-px">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-all border-b-2 whitespace-nowrap -mb-px
              ${isActive 
                ? 'text-foreground border-white' 
                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-white/20'
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
