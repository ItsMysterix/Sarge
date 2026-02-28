import { SettingsIcon, Bell, Palette, Keyboard, Zap, Shield, Key, Cloud, Globe, Users, Webhook, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

export type SettingsTab = "general" | "variables" | "targets" | "notifications" | "appearance" | "integrations" | "billing" | "security" | "shortcuts" | "domains" | "members" | "webhooks"

interface TabsNavigationProps {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

const tabs = [
  { id: "general" as SettingsTab, label: "General", desc: "Project Basics", icon: SettingsIcon },
  { id: "variables" as SettingsTab, label: "Variables", desc: "Secrets & Config", icon: Key },
  { id: "targets" as SettingsTab, label: "Targets", desc: "Cloud Providers", icon: Cloud },
  { id: "integrations" as SettingsTab, label: "Apps", desc: "Third-party", icon: Zap },
  { id: "billing" as SettingsTab, label: "Billing", desc: "Usage & Cost", icon: CreditCard },
  { id: "notifications" as SettingsTab, label: "Alerts", desc: "Comms & Logs", icon: Bell },
  { id: "domains" as SettingsTab, label: "Domains", desc: "Hostnames", icon: Globe },
  { id: "members" as SettingsTab, label: "Members", desc: "Access Control", icon: Users },
  { id: "webhooks" as SettingsTab, label: "Webhooks", desc: "Event Data", icon: Webhook },
  { id: "appearance" as SettingsTab, label: "Appearance", desc: "UI Preferences", icon: Palette },
  { id: "security" as SettingsTab, label: "Security", desc: "Audit & Shield", icon: Shield },
  { id: "shortcuts" as SettingsTab, label: "Keyboard", desc: "Accessibility", icon: Keyboard },
]

export function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-16">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-start p-6 rounded-3xl border transition-all text-left group relative overflow-hidden",
              isActive 
                ? "bg-white/[0.04] border-white/20 shadow-xl" 
                : "bg-transparent border-white/5 hover:border-white/10 hover:bg-white/[0.01]"
            )}
          >
            <div className="flex items-center justify-between w-full mb-4">
              <Icon className={cn(
                "w-4 h-4 transition-all",
                isActive ? "text-white" : "text-white/10 group-hover:text-white/20"
              )} />
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
              )}
            </div>
            <div className="space-y-1">
              <span className={cn(
                "block text-[11px] font-bold uppercase tracking-widest transition-colors",
                isActive ? "text-white" : "text-white/20 group-hover:text-white/40"
              )}>
                {tab.label}
              </span>
              <span className={cn(
                "block text-[8px] font-bold uppercase tracking-[0.15em] transition-colors",
                isActive ? "text-white/40" : "text-white/5 group-hover:text-white/10"
              )}>
                {tab.desc}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
