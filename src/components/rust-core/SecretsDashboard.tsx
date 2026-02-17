"use client"

import { useState } from "react"
import { Shield, Key, Plus, RefreshCw, Trash2, Lock } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { trpc } from "@/lib/trpc"

export function SecretsDashboard() {
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const secretsQuery = trpc.rustBridge.getSecret.useQuery({ key: "all" }, {
    enabled: false // Mocked behavior for now
  })
  
  const setSecretMutation = trpc.rustBridge.setSecret.useMutation()

  const handleAddSecret = async () => {
    if (!newKey || !newValue) return
    await setSecretMutation.mutateAsync({ key: newKey, value: newValue })
    setNewKey("")
    setNewValue("")
    setIsAdding(false)
  }

  // Mock data for initial UI demonstration
  const mockSecrets = [
    { key: "DB_PASSWORD", provider: "local-aes", version: "v1", updatedAt: "2 mins ago" },
    { key: "STRIPE_API_KEY", provider: "aws-kms", version: "v4", updatedAt: "1 hour ago" },
    { key: "SENDGRID_TOKEN", provider: "gcp-secrets", version: "v2", updatedAt: "5 hours ago" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Secret Management
          </h2>
          <p className="text-muted-foreground">
            High-performance, memory-safe secrets powered by the Sarge Rust Core.
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Secret
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-white/[0.03] border-white/[0.08] backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium">New Secret</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Key</label>
                <Input 
                  placeholder="e.g. DATABASE_URL" 
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="bg-black/20 border-white/10 focus:border-violet-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Value</label>
                <Input 
                  type="password"
                  placeholder="Secret value" 
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="bg-black/20 border-white/10 focus:border-violet-500/50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleAddSecret} disabled={setSecretMutation.isLoading}>
                {setSecretMutation.isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Secret"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {mockSecrets.map((secret) => (
          <Card key={secret.key} className="group bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Lock className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <div className="font-mono text-sm font-medium text-white/90">{secret.key}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-white/40 border-white/10">
                      {secret.provider}
                    </Badge>
                    <span className="text-[10px] text-white/30 italic">Version {secret.version} • Updated {secret.updatedAt}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/50 hover:text-red-400 hover:bg-red-400/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-start gap-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
        <Shield className="w-5 h-5 text-violet-400 mt-0.5" />
        <div className="text-xs text-violet-300/60 leading-relaxed">
          SARGE uses isolated memory regions and AES-GCM-256 (Rust-native) to process your secrets. 
          Keys never touch persistent storage unencrypted.
        </div>
      </div>
    </div>
  )
}
