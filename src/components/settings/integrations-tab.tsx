"use client"

import { motion } from "framer-motion"
import { Github, MessageSquare, Brain, Database, CheckCircle, AlertTriangle, Zap, Globe, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  onSyncGitHub,
  onSyncGoogle,
  onSyncAmazon,
  onSyncMicrosoft
}: IntegrationsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Sarge Bridge Header */}
      <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 space-y-8">
           <div className="space-y-3">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Zap className="w-5 h-5 text-indigo-400" />
                 </div>
                 <h3 className="text-2xl font-black uppercase italic tracking-tighter">Identity Nexus</h3>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed font-medium">
                Bridge your master cloud identities to Sarge. We inherit your existing trust relationships to 
                orchestrate your entire stack with zero-config automation.
              </p>
           </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* GitHub Bridge */}
            <div className="space-y-3">
               <Button 
                onClick={onSyncGitHub}
                disabled={isSyncingGitHub || !githubConnected}
                className="w-full bg-white text-black hover:bg-zinc-200 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-30"
              >
                {isSyncingGitHub ? <Zap className="w-4 h-4 animate-pulse" /> : <Github className="w-4 h-4" />}
                {isSyncingGitHub ? "Scanning..." : "Discover GitHub Stack"}
              </Button>
              {!githubConnected && <p className="text-[9px] text-center text-amber-500/60 font-black uppercase tracking-widest">Connect GitHub first</p>}
            </div>

            {/* Google Discovery Bridge */}
            <div className="space-y-3">
               <Button 
                 onClick={onSyncGoogle}
                 disabled={isSyncingGoogle || !isGoogleConnected}
                 className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-500 hover:bg-blue-500/20 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-30"
               >
                 {isSyncingGoogle ? <Zap className="w-4 h-4 animate-pulse" /> : <Globe className="w-4 h-4" />}
                 {isSyncingGoogle ? "Scanning..." : "Discover Google Stack"}
               </Button>
               {!isGoogleConnected && <p className="text-[9px] text-center text-blue-500/40 font-black uppercase tracking-widest italic leading-none">GCP / Firebase / Supabase</p>}
             </div>

            {/* Amazon Discovery Bridge */}
            <div className="space-y-3">
               <Button 
                 onClick={onSyncAmazon}
                 disabled={isSyncingAmazon || !isAmazonConnected}
                 className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-30"
               >
                 {isSyncingAmazon ? <Zap className="w-4 h-4 animate-pulse" /> : <Database className="w-4 h-4" />}
                 {isSyncingAmazon ? "Scanning..." : "Discover AWS Stack"}
               </Button>
               {!isAmazonConnected && <p className="text-[9px] text-center text-amber-500/40 font-black uppercase tracking-widest italic leading-none">AWS / S3 / Lambda</p>}
             </div>

            {/* Microsoft Discovery Bridge */}
            <div className="space-y-3">
               <Button 
                 onClick={onSyncMicrosoft}
                 disabled={isSyncingMicrosoft || !isMicrosoftConnected}
                 className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-30"
               >
                 {isSyncingMicrosoft ? <Zap className="w-4 h-4 animate-pulse" /> : <Cloud className="w-4 h-4" />}
                 {isSyncingMicrosoft ? "Scanning..." : "Discover Azure Stack"}
               </Button>
               {!isMicrosoftConnected && <p className="text-[9px] text-center text-emerald-500/40 font-black uppercase tracking-widest italic leading-none">Azure / Static Apps</p>}
             </div>
          </div>
        </div>
      </div>

      {/* Cloud Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <div key={provider.id} className="glass-card border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-white/20 transition-all group relative overflow-hidden">
            {(provider.method === 'github_linked_discovery' || provider.method === 'github_discovery_bridge') && (
              <div className="absolute top-0 right-0">
                <div className="bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1 rotate-45 translate-x-3 -translate-y-1 border-b border-indigo-500/20 shadow-xl">
                   {provider.status === 'discovered' ? 'Trust Detected' : 'Identity Link'}
                </div>
              </div>
            )}
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs group-hover:bg-white/10 transition-colors uppercase italic tracking-tighter">
                   {provider.id === 'aws' ? 'AMZ' : provider.name.charAt(0)}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={cn(
                    "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border tracking-[0.15em]",
                    provider.status === 'connected' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                    provider.status === 'discovered' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                    "bg-white/5 text-muted-foreground border-white/10"
                  )}>
                    {provider.status}
                  </div>
                  {(provider.method === 'github_linked_discovery' || provider.method === 'github_discovery_bridge') && (
                    <div className="flex items-center gap-1 opacity-60">
                       <Github className="w-2.5 h-2.5 text-indigo-400" />
                       <span className="text-[7px] font-black uppercase tracking-widest text-indigo-400">
                         {provider.status === 'discovered' ? 'Found via Bridge' : 'Verified identity'}
                       </span>
                    </div>
                  )}
                </div>
              </div>
              <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                {provider.name}
                {provider.status === 'connected' && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                {provider.status === 'discovered' && <Zap className="w-3 h-3 text-indigo-400 animate-pulse" />}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8">{provider.description}</p>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-widest font-black text-[7px]">
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
                "w-full py-2 rounded-lg text-xs font-black transition-all uppercase tracking-widest text-[9px]",
                provider.status === 'connected' ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : 
                provider.status === 'discovered' ? "bg-indigo-500/60 text-white hover:bg-indigo-500/80 shadow-lg shadow-indigo-500/20" :
                "bg-white/10 text-foreground hover:bg-white/20"
              )}
            >
              {provider.status === 'connected' ? 'Disconnect Bridge' : 
               provider.status === 'discovered' ? 'Finalize Nexus Link' : 'Connect Account'}
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
                   <div className={cn("w-1.5 h-1.5 rounded-full", githubConnected ? "bg-emerald-500" : "bg-red-500")} />
                   <span className={cn("text-[10px] font-bold uppercase", githubConnected ? "text-emerald-500" : "text-red-500")}>
                     {githubConnected ? "Connected" : "Disconnected"}
                   </span>
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
                <Toggle enabled={slackAlerts} onChange={() => onToggle('slackAlerts', !slackAlerts)} />
             </div>
             <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs">Auto Infrastructure Healing</div>
                <Toggle enabled={autoRebuild} onChange={() => onToggle('autoRebuild', !autoRebuild)} />
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
