"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react"

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
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 selection:bg-white/10 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(255,255,255,0.02),transparent_50%)] pointer-events-none" />
      
      <div className="w-full max-w-[440px] bg-[#0a0a0a] border border-white/5 rounded-3xl p-10 shadow-2xl text-center space-y-10 relative overflow-hidden group">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-xl relative">
             <ShieldCheck className="w-10 h-10 text-white/10" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-white tracking-tight">Accept Invitation</h1>
          <p className="text-sm text-white/20 leading-relaxed max-w-[280px] mx-auto">
            {status === 'accepting' && "Verifying your invitation and setting up your account..."}
            {status === 'success' && "Invitation accepted. Redirecting to your project dashboard..."}
            {status === 'error' && (error || "This invitation link is invalid or has expired.")}
          </p>
        </div>

        {status === 'accepting' && (
          <div className="flex flex-col items-center gap-6 py-2">
             <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-white/10 animate-pulse">Syncing...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-6 py-2 animate-in zoom-in duration-500">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center">
               <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
            <div className="flex flex-col items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center">
                 <XCircle className="w-6 h-6 text-red-500/40" />
               </div>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="w-full h-11 bg-white text-black font-bold text-sm rounded-xl hover:bg-zinc-200 transition-all shadow-xl"
            >
              Back to Safety
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
