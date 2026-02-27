"use client"

import { motion } from "framer-motion"
import { Github, MessageSquare, Brain, Database, CheckCircle, AlertTriangle, Zap, Globe, Cloud, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Toggle } from "./toggle"

interface IntegrationsTabProps {
  githubConnected: boolean
  isGoogleConnected: boolean
  isAmazonConnected: boolean
  isMicrosoftConnected: boolean
  slackAlerts: boolean
  autoRebuild: boolean
  webhookConfigured: boolean
  isTestingWebhook: boolean
  providers: any[]
  isSyncingGitHub: boolean
  isSyncingGoogle: boolean
  isSyncingAmazon: boolean
  isSyncingMicrosoft: boolean
  onToggle: (key: "slackAlerts" | "autoRebuild", value: boolean) => Promise<void>
  onTestWebhook: () => Promise<void>
  onConnectGitHub: () => void
  onToggleProvider: (id: string, currentStatus: string) => void
  onSyncGitHub: () => void
  onSyncGoogle: () => void
  onSyncAmazon: () => void
  onSyncMicrosoft: () => void
}

export function IntegrationsTab({
  githubConnected,
  isGoogleConnected,
  isAmazonConnected,
  isMicrosoftConnected,
  slackAlerts,
  autoRebuild,
  webhookConfigured,
  isTestingWebhook,
  providers,
  isSyncingGitHub,
  isSyncingGoogle,
  isSyncingAmazon,
  isSyncingMicrosoft,
  onToggle,
  onTestWebhook,
  onConnectGitHub,
  onToggleProvider,
  // @ts-ignore
  onSyncGitHub,
  // @ts-ignore
  onSyncGoogle,
  // @ts-ignore
  onSyncAmazon,
  // @ts-ignore
  onSyncMicrosoft
}: IntegrationsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-20"
    >
      {/* Identity Nexus Header */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative z-10 space-y-12">
           <div className="flex items-center gap-6 border-b border-white/5 pb-10">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                 <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Global Identity Nexus</h3>
                <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Master cloud trust relationships & cross-region orchestration protocols</p>
              </div>
           </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'GitHub_Sync', icon: Github, active: githubConnected, syncing: isSyncingGitHub, action: onSyncGitHub },
              { label: 'Google_Mesh', icon: Globe, active: isGoogleConnected, syncing: isSyncingGoogle, action: onSyncGoogle },
              { label: 'AWS_Elastic', icon: Database, active: isAmazonConnected, syncing: isSyncingAmazon, action: onSyncAmazon },
              { label: 'Azure_Cloud', icon: Cloud, active: isMicrosoftConnected, syncing: isSyncingMicrosoft, action: onSyncMicrosoft }
            ].map((bridge) => (
              <div key={bridge.label} className="space-y-4">
                <Button 
                  onClick={bridge.action}
                  disabled={bridge.syncing || !bridge.active}
                  className={cn(
                    "w-full h-14 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] flex items-center justify-center gap-4 transition-all duration-500",
                    bridge.active 
                      ? "bg-white text-black hover:opacity-90 shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                      : "bg-[#050505] border border-white/5 text-muted-foreground/20 hover:border-white/10"
                  )}
                >
                  {bridge.syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <bridge.icon className="w-4 h-4" />}
                  {bridge.syncing ? "SYNCING..." : bridge.label.toUpperCase()}
                </Button>
                {!bridge.active && <p className="text-[8px] font-black text-center text-amber-500/20 uppercase tracking-[0.2em]">IDENTITY_LINK_REQUIRED</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cloud Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between hover:border-white/10 transition-all duration-700 group relative overflow-hidden shadow-xl ring-1 ring-inset ring-white/[0.01]">
            {(provider.method === 'github_linked_discovery' || provider.method === 'github_discovery_bridge') && (
              <div className="absolute top-0 right-0">
                <div className="bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-[0.3em] px-8 py-2 rotate-45 translate-x-8 -translate-y-2 border-b border-white/5">
                   BRIDGE
                </div>
              </div>
            )}
            
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-[#050505] border border-white/5 flex items-center justify-center transition-all duration-700 group-hover:border-indigo-500/20 group-hover:bg-white/[0.02]">
                   <Cloud className="w-6 h-6 text-muted-foreground/20 group-hover:text-indigo-400/40 transition-all" />
                </div>
                <Badge variant="outline" className={cn(
                  "text-[8px] font-black uppercase px-3 py-1 rounded-lg border tracking-[0.2em] transition-all duration-700",
                  provider.status === 'connected' ? "bg-emerald-500/5 text-emerald-400/60 border-emerald-500/10" : 
                  provider.status === 'discovered' ? "bg-indigo-500/5 text-indigo-400/60 border-indigo-500/10" :
                  "bg-white/5 text-muted-foreground/10 border-white/5"
                )}>
                  {provider.status?.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-3">
                <h4 className="text-[14px] font-black text-foreground/80 uppercase tracking-[0.2em] flex items-center gap-3">
                  {provider.name}
                  {provider.status === 'connected' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                </h4>
                <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest leading-relaxed line-clamp-2 h-10 group-hover:text-muted-foreground/40 transition-colors">
                  {provider.description}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-[8px] text-muted-foreground/20 px-3 py-1 rounded-lg bg-[#050505] border border-white/5 uppercase tracking-[0.2em] font-black">
                  {provider.badge || 'SOVEREIGN_CORE'}
                </span>
                <span className="text-[8px] text-indigo-400/40 font-black uppercase tracking-widest">
                  {provider.costHint}
                </span>
              </div>
            </div>
            
            <Button 
              onClick={() => onToggleProvider(provider.id, provider.status)}
              className={cn(
                "mt-10 w-full h-12 rounded-xl text-[10px] font-black transition-all duration-500 uppercase tracking-[0.25em]",
                provider.status === 'connected' ? "bg-red-500/5 text-red-400/60 border border-red-500/10 hover:bg-red-500/10 hover:text-red-400" : 
                provider.status === 'discovered' ? "bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]" :
                "bg-white/[0.03] border border-white/5 text-foreground/40 hover:bg-white/[0.07] hover:text-foreground/60"
              )}
            >
              {provider.status === 'connected' ? 'TERMINATE_NEXUS' : 
               provider.status === 'discovered' ? 'FINALIZE_BRIDGE' : 'INITIALIZE_PROTO'}
            </Button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        {/* Repository Management */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-10">
          <div className="flex items-center gap-4 border-b border-white/5 pb-8">
            <Github className="w-5 h-5 text-muted-foreground/20" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/40">VCS Access Matrix</h3>
          </div>
          <div className="p-8 bg-[#050505] border border-white/5 rounded-3xl space-y-8 ring-1 ring-inset ring-white/[0.01]">
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">GITHUB_PROTOCOL_STATUS</div>
                <div className="flex items-center gap-3">
                   <div className={cn("w-2 h-2 rounded-full transition-all duration-1000", githubConnected ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]")} />
                   <span className={cn("text-[10px] font-black uppercase tracking-widest", githubConnected ? "text-emerald-500/60" : "text-red-500/60")}>
                     {githubConnected ? "CONNECTED_ACTIVE" : "DISCONNECTED_NULL"}
                   </span>
                </div>
              </div>
             <Button 
              onClick={onConnectGitHub} 
              variant="outline"
              className="w-full bg-[#0a0a0a] border-white/5 hover:bg-white/[0.03] hover:border-white/10 text-foreground/40 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
             >
               Configure Access Deck
             </Button>
          </div>
        </div>

        {/* AI Orchestration */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-10">
          <div className="flex items-center gap-4 border-b border-white/5 pb-8">
            <Brain className="w-5 h-5 text-indigo-400/40" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/40">AI Orchestration Layer</h3>
          </div>
          <div className="space-y-6">
             {[
               { title: 'AI_SLACK_BRIEFING', sub: 'Real-time state stream distillation', key: 'slackAlerts', val: slackAlerts },
               { title: 'KINETIC_AUTO_HEALING', sub: 'Automated failure mitigation protocols', key: 'autoRebuild', val: autoRebuild }
             ].map((relay) => (
               <div key={relay.title} className="flex items-center justify-between p-6 bg-[#050505] border border-white/5 rounded-3xl group hover:border-white/10 transition-all duration-500 ring-1 ring-inset ring-white/[0.01]">
                  <div className="space-y-2">
                    <div className="text-[11px] font-black text-foreground/70 uppercase tracking-widest group-hover:text-foreground transition-colors">{relay.title}</div>
                    <p className="text-[9px] font-bold text-muted-foreground/10 uppercase tracking-widest group-hover:text-muted-foreground/30 transition-colors">{relay.sub}</p>
                  </div>
                  <Toggle 
                    enabled={relay.val} 
                    // @ts-ignore
                    onChange={() => onToggle(relay.key, !relay.val)} 
                  />
               </div>
             ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
