"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Lock, Key, AlertTriangle, Loader2, Copy, Plus, Trash2, RefreshCcw, ArrowRight } from "lucide-react"
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-20"
    >
      {/* Identity Hardening Matrix */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="flex items-center gap-6 border-b border-white/5 pb-10">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.1)]">
            <Lock className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Identity Hardening Matrix</h3>
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Configure zero-trust authentication protocols & MFA orchestration</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="p-10 bg-[#050505] border border-white/5 rounded-[2rem] group/item hover:border-white/10 transition-all duration-700 ring-1 ring-inset ring-white/[0.01]">
            <div className="flex items-center justify-between mb-12">
               <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center transition-all duration-700 group-hover/item:border-indigo-500/20">
                  <Shield className="w-6 h-6 text-indigo-400/40" />
               </div>
               <Button variant="outline" className="h-10 px-6 border-white/5 bg-[#0a0a0a] hover:bg-white/5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-500">
                 RE_CONFIGURE
               </Button>
            </div>
            <div className="space-y-2">
              <div className="text-[12px] font-black text-foreground/80 uppercase tracking-[0.2em]">Master Credentials</div>
              <p className="text-[10px] font-bold text-muted-foreground/10 uppercase tracking-widest leading-relaxed group-hover/item:text-muted-foreground/30 transition-colors">Physical protocol-based identity storage</p>
            </div>
          </div>

          <div className="p-10 bg-[#050505] border border-white/5 rounded-[2rem] opacity-30 group/item hover:border-white/10 transition-all duration-1000 ring-1 ring-inset ring-white/[0.01] cursor-not-allowed">
            <div className="flex items-center justify-between mb-12">
               <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center">
                  <RefreshCcw className="w-6 h-6 text-muted-foreground/20" />
               </div>
               <Badge className="h-8 px-5 border-white/5 bg-white/[0.02] text-muted-foreground/20 font-black tracking-[0.2em] text-[8px] rounded-xl">
                 OFFLINE
               </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-[12px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">Secondary Verification (MFA)</div>
              <p className="text-[10px] font-bold text-muted-foreground/5 uppercase tracking-widest leading-relaxed">Schedule: Roadmap_Q4_Orchestration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Access Token Registry */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-12 ring-1 ring-inset ring-white/[0.01]">
        <div className="flex items-center justify-between border-b border-white/5 pb-10">
          <div className="flex items-center gap-6">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
              <Key className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Token Manifest Registry</h3>
              <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest mt-1">L7 Infrastructure gateway identifiers & CLI protocols</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsGenerating(true)}
            className="bg-foreground text-background hover:opacity-90 h-10 px-8 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
          >
            <Plus className="w-4 h-4 mr-3" /> GEN_MANIFEST
          </Button>
        </div>
        
        <div className="space-y-8">
          <AnimatePresence>
            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-10 bg-[#050505] border border-white/5 rounded-[2rem] space-y-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20">Auth_Protocol_Descriptor</div>
                <div className="flex gap-6">
                  <input 
                    type="text"
                    placeholder="E.G: PROD_GATEWAY_ADMIN"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="flex-1 h-16 px-8 bg-[#0a0a0a] border border-white/5 rounded-[1.25rem] text-[12px] font-black uppercase tracking-[0.3em] focus:outline-none focus:border-indigo-500/30 transition-all placeholder:text-muted-foreground/10"
                  />
                  <Button 
                    onClick={handleGenerate}
                    disabled={!keyName || createTokenMutation?.isLoading}
                    className="h-16 px-10 bg-indigo-500 text-white rounded-[1.25rem] text-[11px] font-black uppercase tracking-[0.3em] disabled:opacity-20 transition-all duration-500"
                  >
                    {createTokenMutation?.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "AUTHENTICATE"}
                  </Button>
                  <Button 
                    onClick={() => setIsGenerating(false)}
                    variant="ghost"
                    className="h-16 px-10 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/20 hover:text-foreground transition-colors"
                  >
                    ABORT
                  </Button>
                </div>
              </motion.div>
            )}

            {newTokenRaw && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-10 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] relative overflow-hidden group shadow-2xl shadow-emerald-500/5"
              >
                <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:opacity-40 transition-opacity">
                   <Shield className="w-12 h-12 text-emerald-400" />
                </div>
                <div className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-8">SECURE_PROTOCOL_ORIGIN (SINGLE_VIEW)</div>
                <div className="flex items-center gap-6 p-6 bg-[#050505] rounded-2xl border border-emerald-500/20 shadow-inner">
                  <code className="flex-1 text-[13px] text-emerald-400/80 font-mono break-all font-black tracking-normal uppercase">{newTokenRaw}</code>
                  <Button 
                    onClick={() => copyToClipboard(newTokenRaw)}
                    variant="ghost"
                    className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all duration-500"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
                <div className="mt-10 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-emerald-400/20 uppercase tracking-[0.25em] leading-relaxed max-w-2xl">
                    THIS IDENTIFIER IS EPHEMERAL. REPLICATION WILL NOT BE POSSIBLE POST-MANIFEST. TRANSFER TO PROTECTED VAULT IMMEDIATELY.
                  </p>
                  <Button 
                    onClick={() => setNewTokenRaw(null)}
                    variant="ghost"
                    className="text-[11px] font-black text-emerald-400/60 uppercase tracking-[0.3em] hover:text-emerald-400 transition-colors"
                  >
                    VAULTED_&_SECURED
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokensQuery?.isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-[#050505] border border-white/5 rounded-[1.5rem] animate-pulse" />
              ))
            ) : (tokensQuery?.data || []).length === 0 ? (
              <div className="col-span-full py-24 text-center border border-dashed border-white/5 rounded-3xl bg-[#050505]">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/10">Null Protocol Matrix / Awaiting Manifest</p>
              </div>
            ) : (tokensQuery?.data || []).map((token: any) => (
              <div key={token.id} className="p-8 bg-[#050505] border border-white/5 rounded-[2rem] flex flex-col justify-between group hover:border-white/10 transition-all duration-500 shadow-xl ring-1 ring-inset ring-white/[0.01]">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center group-hover:border-indigo-500/20 transition-all duration-700">
                    <Key className="w-5 h-5 text-muted-foreground/20 group-hover:text-indigo-400/60 transition-colors" />
                  </div>
                  <Button 
                     onClick={() => revokeTokenMutation?.mutate({ tokenId: token.id })}
                     variant="ghost"
                     size="sm"
                     className="p-3 text-muted-foreground/10 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all duration-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="text-[12px] font-black uppercase tracking-[0.25em] text-foreground/70 mb-1 group-hover:text-foreground transition-colors">
                    {token.name}
                  </div>
                  <div className="text-[9px] font-black text-muted-foreground/10 uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" /> LAST_RELAY: {token.last_used_at ? formatDistanceToNow(new Date(token.last_used_at)).toUpperCase() + " AGO" : "NEVER"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Audit Telemetry */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden ring-1 ring-inset ring-white/[0.01]">
        <div className="absolute top-0 right-0 p-10 flex gap-4">
          <Button 
            onClick={() => auditQuery?.refetch()}
            variant="ghost"
            size="sm"
            className="w-12 h-12 bg-[#050505] border border-white/5 text-muted-foreground/20 hover:text-indigo-400 hover:bg-indigo-400/5 rounded-2xl"
          >
            <RefreshCcw className={cn("w-5 h-5", auditQuery?.isFetching && "animate-spin")} />
          </Button>
        </div>

        <div className="flex items-center gap-6 mb-12 border-b border-white/5 pb-10">
           <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.1)]">
              <AlertTriangle className="w-6 h-6 text-red-500" />
           </div>
           <div className="flex flex-col">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Hardening Audit Stream</h3>
              <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Real-time authentication telemetry & protocol violations</p>
           </div>
        </div>
        
        <div className="space-y-6">
          {auditQuery?.isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-[#050505] border border-white/5 rounded-[1.5rem] animate-pulse" />
            ))
          ) : (auditQuery?.data?.items || []).length === 0 ? (
            <div className="py-24 text-center border border-dashed border-white/5 rounded-3xl bg-[#050505]">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/10">Zero Security Events Captured</p>
            </div>
          ) : (auditQuery?.data?.items || []).map((log: any) => (
            <div key={log.id} className="p-8 bg-[#050505] border border-white/5 rounded-[2rem] group hover:border-white/10 transition-all duration-700 ring-1 ring-inset ring-white/[0.01]">
              <div className="flex items-center justify-between mb-8">
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.3em] px-5 h-8 border-white/5 bg-[#0a0a0a] text-indigo-400/60 rounded-xl">
                  {log.action.replace(/_/g, " ").toUpperCase()}
                </Badge>
                <div className="text-[10px] font-black text-muted-foreground/10 uppercase tracking-[0.2em] flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" /> {formatDistanceToNow(new Date(log.createdAt)).toUpperCase()} AGO
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                   <div className="text-[8px] font-black text-muted-foreground/10 uppercase tracking-[0.3em]">Resource_Nexus</div>
                   <div className="text-[11px] font-black text-foreground/60 uppercase tracking-widest">{log.resourceType?.toUpperCase() || 'NULL'}</div>
                </div>
                <div className="space-y-2">
                   <div className="text-[8px] font-black text-muted-foreground/10 uppercase tracking-[0.3em]">Origin_Point</div>
                   <div className="text-[11px] font-black text-foreground/40 uppercase tracking-widest">{log.metadata?.location?.toUpperCase() || 'EXTERNAL_MESH'}</div>
                </div>
                <div className="space-y-2 hidden md:block">
                   <div className="text-[8px] font-black text-muted-foreground/10 uppercase tracking-[0.3em]">Protocol_ID</div>
                   <div className="text-[11px] font-black text-indigo-400/40 uppercase tracking-tighter font-mono">HASH_REDACTED</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full mt-12 h-14 bg-[#050505] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40 hover:text-foreground/80 rounded-[1.5rem] transition-all duration-500 ring-1 ring-inset ring-white/[0.01] flex items-center justify-center gap-4">
          MANIFEST FULL AUDIT LEDGER <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  )
}
