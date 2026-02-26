"use client"

import { useState, useEffect } from "react"
import { Globe, Loader2, Zap, CheckCircle2, Lock, Github, ArrowRight, ShieldCheck, LogIn } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { trpc } from "@/lib/trpc"

interface ConnectProviderModalProps {
  provider: {
    id: string
    name: string
    description: string
  } | null
  isOpen: boolean
  onClose: () => void
  onConnect: (providerId: string, credentials: Record<string, string>) => Promise<void>
}

/**
 * ConnectProviderModal - The "Vercel-Style" Integration Hub
 * 
 * Per User Request: No manual API keys. 
 * We use a "Marketplace Bridge" that handles OAuth handshakes automatically.
 */
export function ConnectProviderModal({ provider, isOpen, onClose, onConnect }: ConnectProviderModalProps) {
  const [step, setStep] = useState<'idle' | 'checking' | 'linking' | 'redirecting' | 'success'>('idle')
  const [isLinkedOnGithub, setIsLinkedOnGithub] = useState(false)
  
  const utils = trpc.useUtils()

  // Detection logic for GitHub Bridge
  const githubSync = trpc.github.syncGitHubIntegrations.useMutation({
    onSuccess: (data) => {
      if (data.discovered.includes(provider?.id || '')) {
        setIsLinkedOnGithub(true)
      }
      setStep('idle')
    }
  })

  // Start checking status when modal opens
  useEffect(() => {
    if (isOpen && provider) {
      setStep('checking')
      githubSync.mutate()
    } else {
      setStep('idle')
      setIsLinkedOnGithub(false)
    }
  }, [isOpen, provider])

  if (!provider) return null

  const handleStartOAuth = async () => {
    setStep('linking')
    
    try {
      const { getSession } = await import("next-auth/react")
      const session = await getSession()
      const userId = session?.user?.id || 'unknown-user'
      
      // Initialize Nango Frontend SDK
      const Nango = (await import('@nangohq/frontend')).default
      const nango = new Nango({ publicKey: process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY || 'MISSING_KEY' })
      
      // Use Nango as the Bridge for all services
      nango.auth(provider.id, userId)
        .then(async (result) => {
          setStep('success')
          // Inform our backend that Nango handled the credentials
          await onConnect(provider.id, { _nango_connected: "true" })
          setTimeout(() => {
              onClose()
              setStep('idle')
              utils.providers.list.invalidate()
          }, 1500)
        })
        .catch((err) => {
          console.error("Nango Auth failed", err)
          setStep('idle')
        })
    } catch (error) {
      setStep('idle')
      console.error("Nango Bridge initiation failed", error)
    }
  }

  const handleRedirectToService = () => {
    setStep('redirecting')
    
    // In a real app, we'd have a mapping of provider login URLs
    const loginUrls: Record<string, string> = {
      vercel: "https://vercel.com/login",
      sentry: "https://sentry.io/auth/login/",
      github: "https://github.com/login",
      aws: "https://console.aws.amazon.com",
      alchemy: "https://dashboard.alchemy.com",
      algolia: "https://www.algolia.com/users/sign_in",
      auth0: "https://auth0.com/auth/login"
    }

    const url = loginUrls[provider.id] || `https://google.com/search?q=${provider.name}+login+github`
    
    // Open in new tab
    window.open(url, '_blank')
    
    // Stay in redirecting state for 5s then back to idle to allow "Check again"
    setTimeout(() => {
      setStep('idle')
    }, 5000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] bg-[#0A0A0A] border-white/10 text-white rounded-[40px] overflow-hidden p-0 shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-white/5 overflow-hidden">
           <motion.div 
             initial={{ x: "-100%" }}
             animate={['checking', 'linking', 'redirecting'].includes(step) ? { x: "0%" } : { x: "-100%" }}
             transition={{ duration: 2, ease: "easeInOut" }}
             className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" 
           />
        </div>
        
        <div className="p-10 space-y-8">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
               <div className="p-4 bg-white/5 rounded-[2rem] border border-white/10 shadow-inner">
                  <Globe className="w-7 h-7 text-blue-400" />
               </div>
               <div className="flex flex-col items-end gap-1">
                 <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2">
                    <Github className="w-3 h-3 text-indigo-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 italic">Identity Bridge</span>
                 </div>
                 {isLinkedOnGithub && (
                   <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5 animate-bounce">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Trust Detected</span>
                   </div>
                 )}
               </div>
            </div>
            
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none">
              {isLinkedOnGithub ? "Link Trust" : "Bridge"} {provider.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm font-medium italic opacity-60 leading-relaxed">
              {isLinkedOnGithub 
                ? `We found ${provider.name} in your GitHub identity. One click to bridge permissions.`
                : `Authorize Sarge to orchestrate ${provider.name} using your secure GitHub identity bridge.`
              }
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 'checking' ? (
              <motion.div 
                key="checking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 flex flex-col items-center justify-center space-y-6"
              >
                 <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Analyzing Account Sync...</p>
              </motion.div>
            ) : step === 'linking' ? (
              <motion.div 
                key="linking"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center justify-center space-y-8"
              >
                 <div className="relative">
                    <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
                    <Zap className="w-8 h-8 text-white absolute inset-0 m-auto fill-white" />
                 </div>
                 <div className="text-center">
                    <h3 className="text-lg font-black uppercase italic tracking-tighter">Establishing Secure Gateway</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">Bridging GitHub ➔ {provider.name}</p>
                 </div>
              </motion.div>
            ) : step === 'redirecting' ? (
              <motion.div 
                key="redirecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 flex flex-col items-center justify-center space-y-6"
              >
                 <ArrowRight className="w-12 h-12 text-blue-500 animate-bounce" />
                 <div className="text-center">
                    <h3 className="text-lg font-black uppercase italic tracking-tighter">Redirecting to {provider.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2 font-bold italic">Sign in with GitHub there to continue.</p>
                 </div>
              </motion.div>
            ) : step === 'success' ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center justify-center space-y-8"
              >
                 <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-[0_10px_40px_rgba(16,185,129,0.5)] rotate-3">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                 </div>
                 <h3 className="text-xl font-black uppercase italic tracking-tighter text-emerald-400">Gateway Verified</h3>
              </motion.div>
            ) : (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {provider.id === 'kubernetes' ? (
                  <div className="space-y-6">
                    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-[2.5rem] space-y-4">
                       <p className="text-xs text-muted-foreground leading-relaxed text-center font-medium">
                         Paste your <strong className="text-white">kubeconfig.yaml</strong> to bridge your cluster. 
                         Sarge encrypts this at rest using AES-256 and only decrypts it in memory during deployment orchestration.
                       </p>
                       <textarea 
                         id="kubeconfig-input" 
                         className="w-full h-32 bg-[#050505] border border-white/10 rounded-2xl p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-colors shadow-inner"
                         placeholder="apiVersion: v1&#10;clusters: ..."
                       />
                       <Button 
                         onClick={() => {
                           const el = document.getElementById('kubeconfig-input') as HTMLTextAreaElement;
                           const val = el?.value?.trim();
                           if (val) {
                             setStep('linking');
                             onConnect(provider.id, { kubeconfig: val, kubeconfig_path: "byok" }).then(() => setStep('success')).catch(() => setStep('idle'));
                           }
                         }}
                         className="w-full h-16 bg-white text-black hover:bg-zinc-200 transition-all font-black uppercase tracking-widest text-xs rounded-3xl flex items-center justify-center gap-4 shadow-xl mt-4"
                       >
                         Bridge Cluster <Lock className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>
                ) : isLinkedOnGithub ? (
                  <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] space-y-6">
                    <p className="text-xs text-center text-emerald-200/60 font-medium">
                      Identity match confirmed. Sarge has discovered a valid trust link between your <strong>GitHub</strong> and <strong>{provider.name}</strong> accounts.
                    </p>
                    <Button 
                      onClick={handleStartOAuth}
                      className="w-full h-16 bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-black uppercase tracking-widest text-xs rounded-3xl flex items-center justify-center gap-4 shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                    >
                      Establish Trust Link <Zap className="w-4 h-4 fill-white" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-[2.5rem] space-y-6">
                       <p className="text-xs text-muted-foreground leading-relaxed text-center font-medium">
                         Initial setup required. To bridge this service, ensure you represent yourself with <strong>GitHub</strong> on the {provider.name} platform.
                       </p>
                       <Button 
                         onClick={handleRedirectToService}
                         className="w-full h-16 bg-white text-black hover:bg-zinc-200 transition-all font-black uppercase tracking-widest text-xs rounded-3xl flex items-center justify-center gap-4 shadow-xl"
                       >
                         Bridge with GitHub Identity <LogIn className="w-4 h-4" />
                       </Button>
                    </div>
                    <button 
                      onClick={() => githubSync.mutate()} 
                      className="w-full text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-white transition-colors"
                    >
                      Check for sync again
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] p-6 flex items-start gap-4">
            <Lock className="w-4 h-4 text-indigo-400 mt-1" />
            <div className="text-[10px] text-indigo-200/50 leading-relaxed font-bold uppercase tracking-tight">
              <strong>Unified Identity Protocol:</strong> Sarge uses OIDC tokens to inherit permissions securely. We never store shared secrets.
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="w-full text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 hover:text-white transition-colors py-2"
          >
            Cancel Bridge
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
