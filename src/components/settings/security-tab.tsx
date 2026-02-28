"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Lock, Key, AlertTriangle, Loader2, Copy, Plus, Trash2, RefreshCcw, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      {/* Security Overview */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
            <Lock className="w-5 h-5 text-white/40" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Security Settings</h3>
            <p className="text-xs text-white/20 mt-0.5">Manage authentication, MFA and session security.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 bg-white/[0.01] border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-8">
               <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center transition-all group-hover:bg-white/[0.05]">
                  <Shield className="w-5 h-5 text-white/20" />
               </div>
               <Button variant="outline" size="sm" className="h-9 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all">
                 Configure
               </Button>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-white/80 uppercase tracking-widest">Two-Factor Auth</div>
              <p className="text-[10px] text-white/10 font-medium">Protect your account with an extra layer of security.</p>
            </div>
          </div>

          <div className="p-8 bg-white/[0.01] border border-white/5 rounded-2xl opacity-40 cursor-not-allowed">
            <div className="flex items-center justify-between mb-8">
               <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                  <RefreshCcw className="w-5 h-5 text-white/10" />
               </div>
               <Badge variant="outline" className="border-white/5 text-[8px] tracking-widest uppercase py-0.5 px-2">Coming Soon</Badge>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-white/20 uppercase tracking-widest">SAML / SSO</div>
              <p className="text-[10px] text-white/5 font-medium italic">Available for enterprise workspaces.</p>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
              <Key className="w-5 h-5 text-white/40" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">API Tokens</h3>
              <p className="text-xs text-white/20 mt-0.5">Manage access keys for programmatic interaction.</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsGenerating(true)}
            className="bg-white text-black hover:bg-zinc-200 h-10 px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> New Token
          </Button>
        </div>
        
        <div className="space-y-6">
          <AnimatePresence>
            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl space-y-6 shadow-2xl"
              >
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Token Name</label>
                  <div className="flex gap-4">
                    <input 
                      type="text"
                      placeholder="e.g. Production CLI"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      className="flex-1 h-11 px-4 bg-black border border-white/5 rounded-xl text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-white/5"
                    />
                    <Button 
                      onClick={handleGenerate}
                      disabled={!keyName || createTokenMutation?.isLoading}
                      className="h-11 px-6 bg-white text-black rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      {createTokenMutation?.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
                    </Button>
                    <Button 
                      onClick={() => setIsGenerating(false)}
                      variant="ghost"
                      className="h-11 px-4 text-xs font-bold uppercase tracking-widest text-white/20 hover:text-white transition-colors"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {newTokenRaw && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 bg-emerald-500/[0.02] border border-emerald-500/20 rounded-2xl relative group"
              >
                <div className="flex items-center gap-3 text-emerald-400 mb-6">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Token Generated Successfully</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-black rounded-xl border border-white/5">
                  <code className="flex-1 text-sm text-emerald-400/80 font-mono break-all font-medium">{newTokenRaw}</code>
                  <Button 
                    onClick={() => copyToClipboard(newTokenRaw)}
                    variant="ghost"
                    className="h-10 w-10 p-0 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-[10px] text-emerald-400/40 font-medium leading-relaxed max-w-xl">
                    For security reasons, this token will only be shown once. Please store it in a secure location immediately.
                  </p>
                  <Button 
                    onClick={() => setNewTokenRaw(null)}
                    variant="ghost"
                    className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest"
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tokensQuery?.isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-white/[0.01] border border-white/5 rounded-2xl animate-pulse" />
              ))
            ) : (tokensQuery?.data || []).length === 0 ? (
              <div className="col-span-full py-20 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                <p className="text-xs font-bold uppercase tracking-widest text-white/10">No active tokens found</p>
              </div>
            ) : (tokensQuery?.data || []).map((token: any) => (
              <div key={token.id} className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between group hover:border-white/10 transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:bg-white/[0.05] transition-all">
                    <Key className="w-5 h-5 text-white/10 group-hover:text-white/30 transition-colors" />
                  </div>
                  <Button 
                     onClick={() => revokeTokenMutation?.mutate({ tokenId: token.id })}
                     variant="ghost"
                     size="sm"
                     className="h-9 w-9 p-0 text-white/10 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <div className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">
                    {token.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
                    <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">
                      Last used {token.last_used_at ? formatDistanceToNow(new Date(token.last_used_at)) + " ago" : "never"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Logs */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-500/40" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Security Audit</h3>
              <p className="text-xs text-white/20 mt-0.5">Recent authentication events and security actions.</p>
            </div>
          </div>
          <Button 
            onClick={() => auditQuery?.refetch()}
            variant="outline"
            size="sm"
            className="h-9 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] rounded-lg"
          >
            <RefreshCcw className={cn("w-3.5 h-3.5", auditQuery?.isFetching && "animate-spin")} />
          </Button>
        </div>
        
        <div className="space-y-3">
          {auditQuery?.isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-white/[0.01] border border-white/5 rounded-xl animate-pulse" />
            ))
          ) : (auditQuery?.data?.items || []).length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
               <p className="text-xs font-bold uppercase tracking-widest text-white/5">No security events recorded</p>
            </div>
          ) : (auditQuery?.data?.items || []).map((log: any) => (
            <div key={log.id} className="p-5 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 bg-white/[0.02] border-white/5 text-white/40">
                  {log.action.replace(/_/g, " ")}
                </Badge>
                <div className="text-[10px] font-medium text-white/30 truncate max-w-[200px] sm:max-w-none">
                  {log.resourceType || 'System'} Action
                </div>
              </div>
              <div className="text-[10px] font-bold text-white/10 uppercase tracking-widest">
                {formatDistanceToNow(new Date(log.createdAt))} ago
              </div>
            </div>
          ))}
        </div>

        <Button variant="ghost" className="w-full h-11 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-xs font-bold uppercase tracking-widest text-white/20 hover:text-white rounded-xl transition-all flex items-center justify-center gap-3">
          View Detailed Audit Log <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}
