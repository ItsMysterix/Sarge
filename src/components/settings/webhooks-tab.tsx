"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Webhook, Plus, Trash2, Shield, Key, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { trpc } from "@/lib/trpc"
import { useProject } from "@/lib/project-context"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export function WebhooksTab() {
  const { currentProject } = useProject()
  const { addToast } = useToast()
  const t = trpc as any
  
  const [isAdding, setIsAdding] = useState(false)
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    secret: "",
    events: ["DEPLOYMENT_SUCCESS", "DEPLOYMENT_FAILURE"]
  })
  
  const channelsQuery = t.alerts?.listChannels?.useQuery(
    { projectId: currentProject?.id },
    { enabled: !!currentProject?.id }
  )
  
  const createChannelMutation = t.alerts?.createChannel?.useMutation({
    onSuccess: () => {
      channelsQuery?.refetch()
      setIsAdding(false)
      setNewWebhook({ name: "", url: "", secret: "", events: ["DEPLOYMENT_SUCCESS", "DEPLOYMENT_FAILURE"] })
      addToast({ type: "success", title: "Webhook created" })
    },
    onError: (err: any) => {
      addToast({ type: "error", title: "Error", description: err.message })
    }
  })
  
  const testChannelMutation = t.alerts?.testChannel?.useMutation({
    onSuccess: () => {
      addToast({ type: "success", title: "Test Sent", description: "A ping was sent to your endpoint" })
    }
  })

  const handleCreate = () => {
    if (!newWebhook.name || !newWebhook.url || !currentProject?.id) return
    createChannelMutation?.mutate({
      projectId: currentProject.id,
      name: newWebhook.name,
      type: "webhook",
      config: {
        webhookUrl: newWebhook.url,
        webhookSecret: newWebhook.secret,
        events: newWebhook.events
      }
    })
  }

  const webhooks = channelsQuery?.data?.filter((c: any) => c.type === 'webhook') || []

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
      {/* Mesh Header */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.1)]">
              <Webhook className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-[0.4em] text-foreground/90">Dispatch & Event Mesh</h3>
              <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] max-w-2xl leading-relaxed">
                Configure kinetic event relays for external endpoint synchronization. Orchestrate real-time status dispatch protocols.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-4 h-12 px-8 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:opacity-90 transition-all duration-500 shadow-xl"
          >
            <Plus className="w-4 h-4" /> MANIFEST_DISPATCH
          </Button>
        </div>
      </div>

      {/* Manifest Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl space-y-10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-10">
               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.4em] block pl-1">Relay_Identifier</label>
                <input
                  type="text"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  placeholder="E.G: PROD_RECON_SERVICE"
                  className="w-full h-14 px-8 bg-[#050505] border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] focus:outline-none focus:border-indigo-500/30 transition-all placeholder:text-muted-foreground/10"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.4em] block pl-1">Destination_Mesh_URL</label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="HTTPS://ORCHESTRATOR.LOCAL/GATEWAY"
                  className="w-full h-14 px-8 bg-[#050505] border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] focus:outline-none focus:border-indigo-500/30 transition-all placeholder:text-muted-foreground/10"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.4em] block pl-1">HMAC_Signature_Protocol (Optional)</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Key className="absolute left-6 top-5 w-4 h-4 text-muted-foreground/20" />
                  <input
                    type="password"
                    value={newWebhook.secret}
                    onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                    placeholder="Sovereign protocol key"
                    className="w-full h-14 pl-14 pr-8 bg-[#050505] border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] focus:outline-none focus:border-indigo-500/30 transition-all placeholder:text-muted-foreground/10"
                  />
                </div>
                <Button
                  onClick={() => setNewWebhook({ ...newWebhook, secret: Math.random().toString(36).substring(2, 15) })}
                  className="h-14 px-8 border border-white/5 bg-[#0a0a0a] hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >
                  GENERATE
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.4em] block pl-1">Event_Matrix_Hardening</label>
              <div className="flex flex-wrap gap-3">
                {["DEPLOYMENT_STARTED", "DEPLOYMENT_SUCCESS", "DEPLOYMENT_FAILURE", "NODE_CRASH", "HEALTH_CHECK_FAILED"].map(event => (
                  <button
                    key={event}
                    onClick={() => {
                      const exists = newWebhook.events.includes(event)
                      setNewWebhook({
                        ...newWebhook,
                        events: exists 
                          ? newWebhook.events.filter(e => e !== event)
                          : [...newWebhook.events, event]
                      })
                    }}
                    className={cn(
                      "h-10 px-6 rounded-xl text-[9px] font-black tracking-[0.2em] border transition-all duration-500",
                      newWebhook.events.includes(event)
                        ? "bg-foreground text-background border-transparent shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                        : "bg-[#050505] text-muted-foreground/20 border-white/5 hover:border-white/10 hover:text-muted-foreground/40"
                    )}
                  >
                    {event}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-6 pt-10 border-t border-white/5">
              <Button onClick={() => setIsAdding(false)} variant="ghost" className="h-12 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20 hover:text-foreground">ABORT_MANIFEST</Button>
              <Button
                onClick={handleCreate}
                disabled={!newWebhook.name || !newWebhook.url || createChannelMutation?.isLoading}
                className="h-12 px-10 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] disabled:opacity-20 transition-all duration-700 shadow-xl shadow-indigo-500/10"
              >
                {createChannelMutation?.isLoading && <Loader2 className="w-4 h-4 animate-spin mr-3" />}
                MANIFEST_RELAY
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dispatch Registry */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-12 ring-1 ring-inset ring-white/[0.01]">
        <div className="flex items-center gap-6 border-b border-white/5 pb-10">
           <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.1)]">
              <Clock className="w-6 h-6 text-indigo-400" />
           </div>
           <div className="flex flex-col">
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Active Dispatch Registry</h3>
              <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest mt-1">Live event listeners & destination gateway identifiers</p>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {channelsQuery?.isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-[#050505] border border-white/5 rounded-[2rem] animate-pulse" />
            ))
          ) : webhooks.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-white/5 rounded-3xl bg-[#050505]">
              <Webhook className="w-12 h-12 text-muted-foreground/5 mx-auto mb-6 opacity-20" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/10 mb-2">Zero Dispatch Channels Manifested</h3>
              <p className="text-[9px] font-bold text-muted-foreground/5 uppercase tracking-[0.2em] max-w-sm mx-auto">
                Connect external cloud orchestrators or monitoring nexus endpoints.
              </p>
            </div>
          ) : (
            webhooks.map((webhook: any) => {
              const config = typeof webhook.config === 'string' ? JSON.parse(webhook.config) : webhook.config
              return (
                <div key={webhook.id} className="p-10 bg-[#050505] border border-white/5 rounded-[2.5rem] flex flex-col gap-10 hover:border-white/10 transition-all duration-700 group ring-1 ring-inset ring-white/[0.01]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                       <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center group-hover:border-indigo-500/20 transition-all duration-700 shadow-inner">
                          <Webhook className="w-6 h-6 text-indigo-400/20 group-hover:text-indigo-400/60 transition-colors" />
                       </div>
                       <div className="space-y-2">
                          <div className="text-[14px] font-black uppercase tracking-[0.2em] text-foreground/80 group-hover:text-foreground transition-colors flex items-center gap-4">
                            {webhook.name}
                            {config.webhookSecret && (
                              <Badge className="h-6 px-3 bg-emerald-500/5 text-emerald-400/60 border-emerald-500/10 text-[7px] font-black uppercase tracking-widest rounded-lg">HMAC_VERIFIED</Badge>
                            )}
                          </div>
                          <div className="text-[10px] font-black font-mono text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors">{config.webhookUrl}</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => testChannelMutation?.mutate({ channelId: webhook.id })}
                        disabled={testChannelMutation?.isLoading}
                        className="h-10 px-6 text-[9px] font-black uppercase tracking-[0.3em] border border-white/5 bg-[#0a0a0a] hover:bg-white/[0.05] rounded-xl text-muted-foreground/40 hover:text-foreground/80 transition-all duration-500"
                      >
                        {testChannelMutation?.isLoading ? "SENDING_PING" : "EXECUTE_PING"}
                      </Button>
                      <Button className="w-10 h-10 p-0 text-muted-foreground/10 hover:text-red-400 hover:bg-red-400/5 rounded-xl border border-white/5 transition-all duration-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5 pt-4 border-t border-white/[0.02]">
                    {(config.events || []).map((e: string) => (
                      <span key={e} className="text-[8px] px-3 py-1 rounded-lg bg-[#0a0a0a] border border-white/5 text-muted-foreground/20 uppercase font-black tracking-widest group-hover:text-muted-foreground/40 group-hover:border-white/10 transition-colors">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Verification Protocol Manifest */}
      <div className="p-10 bg-emerald-500/[0.02] border border-emerald-500/5 rounded-[2rem] flex gap-8 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-1000 ring-1 ring-inset ring-emerald-500/[0.01]">
        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:opacity-10 transition-opacity duration-1000">
           <Shield className="w-24 h-24 text-emerald-400" />
        </div>
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl h-fit">
           <Shield className="w-6 h-6 text-emerald-400/60" />
        </div>
        <div className="space-y-4 relative z-10">
          <div className="text-[12px] font-black text-emerald-400/60 uppercase tracking-[0.3em]">Payload Verification Protocol (HMAC-SHA256)</div>
          <p className="text-[10px] font-bold text-emerald-400/30 uppercase tracking-[0.2em] leading-relaxed max-w-3xl">
            When a manifest secret is provided, Sarge includes a <code className="bg-emerald-400/10 px-2 py-0.5 rounded-lg text-emerald-300/80 font-mono text-[11px] tracking-normal">Sarge-Signature</code> header.
            Implement hex-digest verification at your destination gateway to ensure payload integrity.
          </p>
        </div>
      </div>
    </div>
  )
}
