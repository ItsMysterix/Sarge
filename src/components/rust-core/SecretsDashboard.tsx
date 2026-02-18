"use client"

import { useState } from "react"
import { Shield, Key, Plus, RefreshCw, Trash2, Lock, Eye, EyeOff } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/components/ui/toast"

export function SecretsDashboard() {
  const { addToast } = useToast()
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})

  // Fetching a specific secret (since listing isn't supported yet in the bridge)
  // We'll focus on allowing the user to add and then 'lookup' or 'manage' by key
  const secretsQuery = trpc.rustBridge.getSecret.useQuery({ key: "all" }, {
    enabled: false,
    retry: false
  })
  
  const setSecretMutation = trpc.rustBridge.setSecret.useMutation({
    onSuccess: () => {
      addToast({ title: "Secret Saved", description: "The encrypted key-value pair has been securely stored.", type: "success" })
      setNewKey("")
      setNewValue("")
      setIsAdding(false)
    },
    onError: (err) => {
      addToast({ title: "Storage Failed", description: err.message, type: "error" })
    }
  })

  const handleAddSecret = async () => {
    if (!newKey || !newValue) return
    await setSecretMutation.mutateAsync({ key: newKey, value: newValue })
  }

  const toggleVisibility = (key: string) => {
    setVisibleSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-500" />
            Secrets Management
          </h2>
          <p className="text-xs text-muted-foreground max-w-lg">
            High-performance, memory-safe secrets powered by the Sarge Rust Core. 
            All values are encrypted using AES-GCM-256 before leaving the secure boundary.
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-foreground text-background hover:bg-foreground/90 rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-foreground/10"
        >
          <Plus className="w-3 h-3 mr-2" />
          Add Secret
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-muted/10 border-border/50 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-500 rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                   <Key className="w-4 h-4 text-indigo-400" />
                </div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Store New Secret</CardTitle>
             </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Secret Key</label>
                <Input 
                  placeholder="e.g. DATABASE_URL" 
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="bg-background border-border focus:border-indigo-500/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Secret Value</label>
                <div className="relative">
                  <Input 
                    type={visibleSecrets['new'] ? "text" : "password"}
                    placeholder="Enter sensitive value..." 
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="bg-background border-border focus:border-indigo-500/50 rounded-xl pr-10"
                  />
                  <button 
                    onClick={() => toggleVisibility('new')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {visibleSecrets['new'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="text-xs font-bold uppercase rounded-lg">Cancel</Button>
              <Button onClick={handleAddSecret} disabled={setSecretMutation.isLoading} size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs font-bold uppercase rounded-lg px-8">
                {setSecretMutation.isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Secret"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State (Since mock data is removed) */}
      <div className="grid gap-6">
         <div className="py-24 text-center space-y-4 bg-muted/5 border border-dashed border-border rounded-3xl group transition-all duration-500 hover:bg-muted/10">
            <div className="relative inline-block">
               <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
               <Lock className="w-12 h-12 text-muted-foreground/20 mx-auto relative z-10" />
            </div>
            <div className="max-w-xs mx-auto">
               <p className="text-sm font-bold text-foreground opacity-80 mb-1">Vault currently empty</p>
               <p className="text-[11px] text-muted-foreground leading-relaxed"> No secrets found for the current workspace. Use the button above to begin securing your infrastructure credentials.</p>
            </div>
         </div>
      </div>

      <div className="flex items-start gap-4 p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
        <Shield className="w-5 h-5 text-indigo-400 mt-0.5" />
        <div className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-bold text-indigo-400">Security Notice:</span> SARGE uses isolated memory regions and AES-GCM-256 (Rust-native) to process your secrets. 
          Values are double-encrypted at rest and are only visible during active orchestration cycles.
        </div>
      </div>
    </div>
  )
}
