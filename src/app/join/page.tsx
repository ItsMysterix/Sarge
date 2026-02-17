"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { Loader2, CheckCircle2, XCircle, ShieldCheck } from "lucide-react"
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
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md glass-card p-8 border border-white/10 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Project Invitation</h1>
          <p className="text-muted-foreground text-sm">
            {status === 'accepting' && "Verifying your invitation..."}
            {status === 'success' && "Invitation accepted! Redirecting..."}
            {status === 'error' && (error || "Invalid or expired invitation")}
          </p>
        </div>

        {status === 'accepting' && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {status === 'success' && (
          <div className="flex justify-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex justify-center py-4">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <button 
              onClick={() => router.push('/')}
              className="w-full py-2 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
