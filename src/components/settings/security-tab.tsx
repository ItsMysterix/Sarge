"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Lock, Key, AlertTriangle, Loader2, Copy, Plus, Trash2, RefreshCcw } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export function SecurityTab() {
  const { addToast } = useToast()
  const t = trpc as any
  
  const [newTokenRaw, setNewTokenRaw] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [keyName, setKeyName] = useState("")

  const tokensQuery = t.tokens?.list?.useQuery()
  const auditQuery = t.audit?.list?.useQuery({ limit: 5 })

  const createTokenMutation = t.tokens?.create?.useMutation({
    onSuccess: (data: any) => {
      setNewTokenRaw(data.token)
      tokensQuery?.refetch()
      setKeyName("")
      setIsGenerating(false)
      addToast({ type: "success", title: "API Key Generated", description: "Be sure to copy it now, you won't see it again." })
    },
    onError: (err: any) => {
      addToast({ type: "error", title: "Failed to generate key", description: err.message })
      setIsGenerating(false)
    }
  })

  const revokeTokenMutation = t.tokens?.revoke?.useMutation({
    onSuccess: () => {
      tokensQuery?.refetch()
      addToast({ type: "success", title: "Key Revoked" })
    }
  })

  const handleGenerate = () => {
    if (!keyName) return
    createTokenMutation?.mutate({ name: keyName, expiresInDays: 30 })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addToast({ type: "info", title: "Copied to clipboard" })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Authentication */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Authentication</h3>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 glass-card rounded border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium">Password</div>
                <div className="text-sm text-gray-400">Manage your account password</div>
              </div>
              <button className="px-4 py-2 glass-card border border-white/10 hover:bg-white/5 rounded transition-colors text-sm">
                Change Password
              </button>
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded border border-white/5 opacity-80">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Two-Factor Authentication</div>
                <div className="text-sm text-gray-400">Add an extra layer of security using TOTP</div>
              </div>
              <button 
                disabled
                className="px-4 py-2 bg-muted/50 border border-white/10 rounded text-sm cursor-not-allowed text-muted-foreground"
              >
                Enable 2FA
              </button>
            </div>
            <div className="text-[10px] text-accent mt-2 uppercase tracking-widest font-bold">Planned Feature</div>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold">Personal Access Tokens</h3>
          </div>
          <button 
            onClick={() => setIsGenerating(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white text-black rounded-lg text-xs font-bold hover:bg-white/90 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Generate New Key
          </button>
        </div>
        
        <div className="space-y-4">
          <AnimatePresence>
            {isGenerating && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="p-4 border border-accent/20 bg-accent/5 rounded-xl space-y-3">
                  <div className="text-sm font-medium">New Token Name</div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="e.g. CLI-Access-Macbook"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-accent"
                    />
                    <button 
                      onClick={handleGenerate}
                      disabled={!keyName || createTokenMutation?.isLoading}
                      className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-50"
                    >
                      {createTokenMutation?.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
                    </button>
                    <button 
                      onClick={() => setIsGenerating(false)}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {newTokenRaw && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4"
              >
                <div className="text-xs font-bold text-emerald-400 uppercase mb-2">Secret Token Generated</div>
                <div className="flex items-center gap-3 p-3 bg-black/40 rounded border border-white/5">
                  <code className="flex-1 text-sm text-emerald-300 font-mono break-all">{newTokenRaw}</code>
                  <button 
                    onClick={() => copyToClipboard(newTokenRaw)}
                    className="p-2 hover:bg-white/5 rounded text-emerald-400"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-emerald-400/70 mt-3">
                  For your security, this key is only displayed once. Please store it in a password manager.
                </p>
                <button 
                  onClick={() => setNewTokenRaw(null)}
                  className="mt-3 text-xs font-bold text-emerald-400 hover:underline"
                >
                  I've saved it
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {tokensQuery?.isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (tokensQuery?.data || []).length === 0 ? (
              <div className="text-center p-8 text-sm text-muted-foreground border border-dashed border-white/10 rounded-xl">
                No active personal access tokens.
              </div>
            ) : (tokensQuery?.data || []).map((token: any) => (
              <div key={token.id} className="p-4 glass-card rounded-xl border border-white/10 flex items-center justify-between group hover:border-white/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Key className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {token.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Last used {token.last_used_at ? formatDistanceToNow(new Date(token.last_used_at)) + " ago" : "never"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                     onClick={() => revokeTokenMutation?.mutate({ tokenId: token.id })}
                     className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Access Control Placeholder / Info */}
      <div className="glass-card p-6 border border-white/10 opacity-80">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Infrastructure Access Policy</h3>
        </div>
        
        <div className="p-4 bg-muted/30 rounded border border-white/5 space-y-4">
          <div className="flex items-start gap-3">
             <AlertTriangle className="w-4 h-4 text-accent translate-y-0.5" />
             <p className="text-xs text-muted-foreground leading-relaxed">
               Access to production environments is strictly limited to project owners. 
               IP Whitelisting and Role-Based Access Control (RBAC) granular settings are currently being migrated to the new unified governance engine.
             </p>
          </div>
          <button disabled className="w-full py-2 bg-muted/50 border border-white/10 rounded text-xs font-bold text-muted-foreground">
            Configure Access Rules (Coming Soon)
          </button>
        </div>
      </div>

      {/* Audit Log */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold">Security Audit Log</h3>
          </div>
          <button 
            onClick={() => auditQuery?.refetch()}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-accent"
          >
            <RefreshCcw className={cn("w-4 h-4", auditQuery?.isFetching && "animate-spin")} />
          </button>
        </div>
        
        <div className="space-y-2">
          {auditQuery?.isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (auditQuery?.data?.items || []).length === 0 ? (
            <div className="text-center p-8 text-sm text-muted-foreground italic">No recent security events recorded.</div>
          ) : (auditQuery?.data?.items || []).map((log: any) => (
            <div key={log.id} className="p-3 glass-card rounded-xl border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-accent">
                  {log.action.replace(/_/g, " ")}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(log.createdAt))} ago
                </div>
              </div>
              <div className="text-xs text-foreground/80">
                Resource: <span className="text-accent/80">{log.resourceType}</span>
                {log.metadata?.location && <span className="text-muted-foreground ml-2">({log.metadata.location})</span>}
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-6 py-2.5 glass-card border border-white/10 hover:bg-white/5 rounded-xl transition-colors text-xs font-bold">
          View Detailed Audit Stream
        </button>
      </div>
    </motion.div>
  )
}
