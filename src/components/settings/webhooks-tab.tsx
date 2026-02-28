"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Webhook, Plus, Trash2, Shield, Key, Loader2, CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react"
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
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Overview Header */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
              <Webhook className="w-6 h-6 text-white/40" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Webhook Channels</h3>
              <p className="text-xs text-white/20 mt-0.5">Automated event delivery to your external services.</p>
            </div>
          </div>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            className="h-10 px-6 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Webhook
          </Button>
        </div>
      </div>

      {/* Creation Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block pl-1">Webhook Name</label>
                <input
                  type="text"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  placeholder="e.g. Production Alerts"
                  className="w-full h-11 px-4 bg-black border border-white/5 rounded-xl text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-white/5"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block pl-1">Target URL</label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://your-api.com/webhooks"
                  className="w-full h-11 px-4 bg-black border border-white/5 rounded-xl text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-white/5"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block pl-1">Webhook Secret (Optional)</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
                  <input
                    type="password"
                    value={newWebhook.secret}
                    onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                    placeholder="Enter or generate a secret"
                    className="w-full h-11 pl-11 pr-4 bg-black border border-white/5 rounded-xl text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-white/5"
                  />
                </div>
                <Button
                  onClick={() => setNewWebhook({ ...newWebhook, secret: Math.random().toString(36).substring(2, 15) })}
                  variant="outline"
                  className="h-11 px-6 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  Generate
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block pl-1">Event Selection</label>
              <div className="flex flex-wrap gap-2">
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
                      "px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all",
                      newWebhook.events.includes(event)
                        ? "bg-white text-black border-white shadow-lg"
                        : "bg-white/[0.01] text-white/20 border-white/5 hover:border-white/10 hover:text-white/40"
                    )}
                  >
                    {event.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
              <Button onClick={() => setIsAdding(false)} variant="ghost" className="h-10 px-6 text-xs font-bold uppercase tracking-widest text-white/20 hover:text-white">Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={!newWebhook.name || !newWebhook.url || createChannelMutation?.isLoading}
                className="h-10 px-8 bg-white text-black rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-all shadow-xl"
              >
                {createChannelMutation?.isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save Webhook
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Webhooks List */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
           <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
              <Clock className="w-5 h-5 text-white/40" />
           </div>
           <div>
              <h3 className="text-sm font-bold text-white">Active Webhooks</h3>
              <p className="text-xs text-white/20 mt-0.5">Manage your existing integration endpoints.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {channelsQuery?.isLoading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="h-24 bg-white/[0.01] border border-white/5 rounded-2xl animate-pulse" />
            ))
          ) : webhooks.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
              <Webhook className="w-10 h-10 text-white/5 mx-auto mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/10 mb-2">No webhooks configured</p>
              <p className="text-[10px] text-white/5 px-8 max-w-sm mx-auto">
                Connect external systems to receive real-time updates from your projects.
              </p>
            </div>
          ) : (
            webhooks.map((webhook: any) => {
              const config = typeof webhook.config === 'string' ? JSON.parse(webhook.config) : webhook.config
              return (
                <div key={webhook.id} className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col gap-6 hover:border-white/10 transition-all group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:bg-white/[0.05] transition-all">
                          <Webhook className="w-5 h-5 text-white/10 group-hover:text-white/30 transition-colors" />
                       </div>
                       <div>
                          <div className="text-sm font-bold text-white/80 group-hover:text-white transition-colors flex items-center gap-3">
                            {webhook.name}
                            {config.webhookSecret && (
                              <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest px-2 py-0 bg-emerald-500/5 text-emerald-400/40 border-emerald-500/10">HMAC</Badge>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-white/10 group-hover:text-white/20 transition-colors mt-1 truncate max-w-[200px] sm:max-w-[400px]">{config.webhookUrl}</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => testChannelMutation?.mutate({ channelId: webhook.id })}
                        disabled={testChannelMutation?.isLoading}
                        size="sm"
                        variant="ghost"
                        className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest bg-white/[0.02] hover:bg-white/[0.05] text-white/40 hover:text-white rounded-lg transition-all"
                      >
                        {testChannelMutation?.isLoading ? "Testing..." : "Test Result"}
                      </Button>
                      <Button variant="ghost" className="h-9 w-9 p-0 text-white/10 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/5 font-mono">
                    {(config.events || []).map((e: string) => (
                      <span key={e} className="text-[8px] px-2 py-0.5 rounded-md bg-white/[0.01] border border-white/5 text-white/20 uppercase font-bold tracking-widest">
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

      {/* Verification Instructions */}
      <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl flex items-start gap-4">
        <Shield className="w-5 h-5 text-white/20 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <div className="text-xs font-bold text-white/40 uppercase tracking-widest">Webhook Security</div>
          <p className="text-[10px] text-white/20 leading-relaxed">
            Requests are sent with a <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-white/40">Sarge-Signature</code> header when a secret is configured. 
            Use this to verify payload integrity at your endpoint.
          </p>
        </div>
      </div>
    </div>
  )
}
