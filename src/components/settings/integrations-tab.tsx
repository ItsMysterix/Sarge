"use client"

import { motion } from "framer-motion"
import { Github, MessageSquare, Brain, Database, CheckCircle, AlertTriangle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface IntegrationsTabProps {
  slackAlerts: boolean
  autoRebuild: boolean
  webhookConfigured: boolean
  isTestingWebhook: boolean
  providers: any[]
  onToggle: (key: "slack_alerts" | "auto_rebuild", value: boolean) => Promise<void>
  onTestWebhook: () => Promise<void>
  onConnectGitHub: () => void
  onToggleProvider: (id: string, currentStatus: string) => void
}

export function IntegrationsTab({
  slackAlerts,
  autoRebuild,
  webhookConfigured,
  isTestingWebhook,
  providers,
  onToggle,
  onTestWebhook,
  onConnectGitHub,
  onToggleProvider
}: IntegrationsTabProps) {
  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`
        relative w-12 h-6 rounded-full transition-colors
        ${enabled ? 'bg-accent' : 'bg-white/10'}
      `}
    >
      <div
        className={`
          absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
          ${enabled ? 'translate-x-7' : 'translate-x-1'}
        `}
      />
    </button>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Sarge Bridge Header */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5" /> Managed Infrastructure Bridge
          </h3>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Sarge orchestrates your deployments across multiple platforms. We don't host your code; 
            we manage the complexity of your own cloud accounts.
          </p>
        </div>
      </div>

      {/* Cloud Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <div key={provider.id} className="glass-card border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-white/20 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs group-hover:bg-white/10 transition-colors">
                   {provider.name.charAt(0)}
                </div>
                <div className={cn(
                  "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border tracking-widest",
                  provider.status === 'connected' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-white/5 text-muted-foreground border-white/10"
                )}>
                  {provider.status}
                </div>
              </div>
              <h4 className="text-sm font-semibold mb-1">{provider.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8">{provider.description}</p>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                  {provider.badge}
                </span>
                <span className="text-[10px] text-indigo-400 font-medium">
                  {provider.costHint}
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => onToggleProvider(provider.id, provider.status)}
              className={cn(
                "w-full py-2 rounded-lg text-xs font-medium transition-all uppercase tracking-tighter",
                provider.status === 'connected' 
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" 
                  : "bg-white/10 text-foreground hover:bg-white/20"
              )}
            >
              {provider.status === 'connected' ? 'Disconnect' : 'Connect Account'}
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Repository Management */}
        <div className="glass-card p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Github className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Repository Management</h3>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
             <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium">GitHub Status</div>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   <span className="text-[10px] text-emerald-500 font-bold uppercase">Connected</span>
                </div>
             </div>
             <Button onClick={onConnectGitHub} className="w-full text-xs h-9">Manage GitHub Access</Button>
          </div>
        </div>

        {/* AI Orchestration */}
        <div className="glass-card p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold">AI Orchestration</h3>
          </div>
          <div className="space-y-3">
             <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs">AI Slack Summaries</div>
                <Toggle enabled={slackAlerts} onChange={() => onToggle('slack_alerts', !slackAlerts)} />
             </div>
             <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs">Auto Infrastructure Healing</div>
                <Toggle enabled={autoRebuild} onChange={() => onToggle('auto_rebuild', !autoRebuild)} />
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
