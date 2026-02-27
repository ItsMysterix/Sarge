"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react"
import { GridLoader } from "@/components/ui/grid-loader"
import { AppShell } from "@/components/layout/app-shell"

export default function JoinPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  
  const [status, setStatus] = useState<'idle' | 'accepting' | 'success' | 'error'>('idle')
  const [error, setError] = useState("")

  const acceptMutation = trpc.members.acceptInvitation.useMutation({
    onSuccess: (data: any) => {
      setStatus('success')
      setTimeout(() => {
        router.push(`/projects/${data.projectId}`)
      }, 2000)
    },
    onError: (err: any) => {
      setStatus('error')
      setError(err.message)
    }
  })

  useEffect(() => {
    if (token && status === 'idle') {
      setStatus('accepting')
      acceptMutation.mutate({ token })
    }
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(99,102,241,0.03),transparent_50%)] pointer-events-none" />
      
      <div className="w-full max-w-[500px] bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-12 shadow-3xl text-center space-y-12 relative overflow-hidden group ring-1 ring-inset ring-white/[0.01]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-[2rem] bg-[#050505] border border-white/5 flex items-center justify-center shadow-2xl relative">
             <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full animate-pulse" />
             <ShieldCheck className="w-12 h-12 text-indigo-400/60 relative z-10" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-[16px] font-black uppercase tracking-[0.5em] text-foreground/90">Identity_Handshake_Protocol</h1>
          <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.3em] leading-relaxed max-w-[280px] mx-auto">
            {status === 'accepting' && "Negotiating identity tokens with the global manifest authority..."}
            {status === 'success' && "Identity verified. Redirecting to sovereign node registry..."}
            {status === 'error' && (error || "Kernel exception: Invalid or expired invitation manifest.")}
          </p>
        </div>

        {status === 'accepting' && (
          <div className="flex flex-col items-center gap-6 py-4">
             <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
             </div>
             <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-500/40 animate-pulse">Syncing_Records...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-6 py-4 animate-in zoom-in duration-700">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
               <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500/40">Handshake_Complete</span>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700">
            <div className="flex flex-col items-center gap-6">
               <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                 <XCircle className="w-8 h-8 text-red-500/60" />
               </div>
               <span className="text-[9px] font-black uppercase tracking-[0.4em] text-red-500/40">Access_Denied</span>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="w-full h-14 bg-white text-black font-black uppercase tracking-[0.4em] text-[10px] rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-xl"
            >
              Uplink_Discovery_Hub
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
