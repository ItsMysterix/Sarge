import { SettingsIcon, Bell, Palette, Keyboard, Zap, Shield, Key, Cloud, Globe, Users, Webhook, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

export type SettingsTab = "general" | "variables" | "targets" | "notifications" | "appearance" | "integrations" | "billing" | "security" | "shortcuts" | "domains" | "members" | "webhooks"

interface TabsNavigationProps {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

const tabs = [
  { id: "general" as SettingsTab, label: "Kernel", desc: "Core Protocol", icon: SettingsIcon },
  { id: "variables" as SettingsTab, label: "Vault", desc: "Secret Matrix", icon: Key },
  { id: "targets" as SettingsTab, label: "Nodes", desc: "Target Grid", icon: Cloud },
  { id: "integrations" as SettingsTab, label: "Bridge", desc: "External Links", icon: Zap },
  { id: "billing" as SettingsTab, label: "FinOps", desc: "Spend Ledger", icon: CreditCard },
  { id: "notifications" as SettingsTab, label: "Alerts", desc: "Comms Relay", icon: Bell },
  { id: "domains" as SettingsTab, label: "Network", desc: "Domain Map", icon: Globe },
  { id: "members" as SettingsTab, label: "Identity", desc: "Access Control", icon: Users },
  { id: "webhooks" as SettingsTab, label: "Hooks", desc: "Event Streams", icon: Webhook },
  { id: "appearance" as SettingsTab, label: "UI/UX", desc: "Visual Layer", icon: Palette },
  { id: "security" as SettingsTab, label: "Shield", desc: "Hardening", icon: Shield },
  { id: "shortcuts" as SettingsTab, label: "Macros", desc: "Fast Path", icon: Keyboard },
]

export function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-16">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-start p-6 rounded-[1.5rem] border transition-all duration-700 text-left group relative overflow-hidden ring-1 ring-inset ring-white/[0.01]",
              isActive 
                ? "bg-white/[0.03] border-indigo-500/30 shadow-2xl shadow-indigo-500/[0.02]" 
                : "bg-transparent border-white/5 hover:border-white/10 hover:bg-white/[0.01]"
            )}
          >
            <div className="flex items-center justify-between w-full mb-4">
              <Icon className={cn(
                "w-5 h-5 transition-all duration-700",
                isActive ? "text-indigo-400 scale-110" : "text-muted-foreground/10 group-hover:text-muted-foreground/30"
              )} />
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              )}
            </div>
            <div className="space-y-1">
              <span className={cn(
                "block text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-700",
                isActive ? "text-foreground" : "text-muted-foreground/40 group-hover:text-muted-foreground/60"
              )}>
                {tab.label}
              </span>
              <span className={cn(
                "block text-[7px] font-black uppercase tracking-widest transition-colors duration-700",
                isActive ? "text-muted-foreground/60" : "text-muted-foreground/10 group-hover:text-muted-foreground/20"
              )}>
                {tab.desc}
              </span>
            </div>
            
            {isActive && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            )}
            
            {!isActive && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            )}
          </button>
        )
      })}
    </div>
  )
}
