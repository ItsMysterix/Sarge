"use client"

import { useState } from "react"
import { Webhook, Plus, Trash2, Shield, Key, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react"
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Webhook className="w-5 h-5 text-muted-foreground" />
            Outbound Webhooks
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Receive real-time notifications on your external endpoints.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      {/* Add Webhook Form */}
      {isAdding && (
        <div className="glass-card p-4 space-y-4 border border-white/10 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Friendly Name</label>
              <input
                type="text"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                placeholder="Production Deployments"
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm focus:outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Payload URL</label>
              <input
                type="url"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                placeholder="https://api.yourdomain.com/webhooks/sarge"
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm focus:outline-none focus:border-white/20"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Secret Key (Optional HMAC Signature)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={newWebhook.secret}
                  onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                  placeholder="Keep it secret, keep it safe"
                  className="w-full pl-10 pr-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm focus:outline-none focus:border-white/20"
                />
              </div>
              <button
                onClick={() => setNewWebhook({ ...newWebhook, secret: Math.random().toString(36).substring(2, 15) })}
                className="px-3 py-2 text-xs border border-white/10 rounded-lg hover:bg-white/5"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Events to track</label>
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
                    "px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border transition-all",
                    newWebhook.events.includes(event)
                      ? "bg-white text-black border-transparent"
                      : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/20"
                  )}
                >
                  {event.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!newWebhook.name || !newWebhook.url || createChannelMutation?.isLoading}
              className="flex items-center gap-2 px-4 py-1.5 bg-white text-black rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {createChannelMutation?.isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              Save Webhook
            </button>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      <div className="glass-card divide-y divide-white/[0.06] border border-white/10">
        {channelsQuery?.isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="p-12 text-center">
            <Webhook className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">No webhooks configured</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Connect external services like GitHub Actions, Jenkins, or your own API.
            </p>
          </div>
        ) : (
          webhooks.map((webhook: any) => {
            const config = typeof webhook.config === 'string' ? JSON.parse(webhook.config) : webhook.config
            return (
              <div key={webhook.id} className="p-4 space-y-3 hover:bg-white/[0.01]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {webhook.name}
                      {config.webhookSecret && (
                        <Shield className="w-3 h-3 text-emerald-400" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-md">{config.webhookUrl}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testChannelMutation?.mutate({ channelId: webhook.id })}
                      disabled={testChannelMutation?.isLoading}
                      className="px-2 py-1 text-[10px] font-bold uppercase border border-white/10 rounded hover:bg-white/5"
                    >
                      {testChannelMutation?.isLoading ? "Sending..." : "Test Ping"}
                    </button>
                    <button className="p-2 text-muted-foreground hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  {(config.events || []).map((e: string) => (
                    <span key={e} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground uppercase">
                      {e.split('_').pop()}
                    </span>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Security Best Practices */}
      <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex gap-3">
        <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
        <div className="text-xs space-y-1">
          <div className="font-medium text-emerald-300">Secure Deliveries</div>
          <p className="text-emerald-300/70">
            When a secret is provided, Sarge includes a <code className="bg-emerald-500/10 px-1 rounded text-emerald-200">Sarge-Signature</code> header.
            Use this HMAC-SHA256 hex digest to verify payloads at your endpoint.
          </p>
        </div>
      </div>
    </div>
  )
}
