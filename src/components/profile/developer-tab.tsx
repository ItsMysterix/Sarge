"use client"

import { Github, Key, Plus, Trash2, CheckCircle, Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface DeveloperTabProps {
  isGitHubConnected: boolean
  setShowGithubModal: (show: boolean) => void
  tokens: any[]
  createToken: (name: string) => Promise<void>
  revokeToken: (id: string) => Promise<void>
  isCreatingToken: boolean
  setIsCreatingToken: (is: boolean) => void
  newToken: string | null
}

export function DeveloperTab({ 
  isGitHubConnected, 
  setShowGithubModal, 
  tokens, 
  createToken, 
  revokeToken,
  isCreatingToken,
  setIsCreatingToken,
  newToken
}: DeveloperTabProps) {
  const [tokenName, setTokenName] = useState("")
  const [localIsCreatingToken, setLocalIsCreatingToken] = useState(false)

  return (
    <div className="space-y-6 pt-2">
      <div className="glass-card p-6 border border-white/10 rounded-xl space-y-6">
         <div className="flex items-center justify-between">
           <div>
              <h3 className="text-lg font-medium">GitHub Connection</h3>
              <p className="text-sm text-muted-foreground">Link your account to import repositories.</p>
           </div>
           {isGitHubConnected ? (
              <Button variant="outline" disabled className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                 <CheckCircle className="w-4 h-4 mr-2" /> Connected
              </Button>
           ) : (
              <Button onClick={() => setShowGithubModal(true)} variant="outline">
                 <Github className="w-4 h-4 mr-2" /> Connect
              </Button>
           )}
         </div>
      </div>

      <div className="glass-card p-6 border border-white/10 rounded-xl space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h3 className="text-lg font-medium">Personal Access Tokens</h3>
               <p className="text-sm text-muted-foreground">Manage API keys for CLI access.</p>
            </div>
            <Button onClick={() => setLocalIsCreatingToken(true)} size="sm">Generate New</Button>
         </div>
         
         {localIsCreatingToken && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg animate-in slide-in-from-top-2">
               <Label className="text-xs mb-2 block">Token Name</Label>
               <div className="flex gap-2">
                  <Input 
                     value={tokenName} 
                     onChange={(e) => setTokenName(e.target.value)} 
                     placeholder="e.g. MacBook Pro" 
                     className="bg-black/20"
                  />
                  <Button 
                     onClick={async () => {
                       await createToken(tokenName);
                       setTokenName("");
                       setLocalIsCreatingToken(false);
                     }} 
                     disabled={!tokenName || isCreatingToken}
                  >
                     {isCreatingToken && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                     Create
                  </Button>
                  <Button variant="ghost" onClick={() => setLocalIsCreatingToken(false)}>Cancel</Button>
               </div>
            </div>
         )}

         {newToken && (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-center gap-3">
               <CheckCircle className="w-5 h-5 text-emerald-500" />
               <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-emerald-500 font-medium mb-1">Token Created Successfully</p>
                  <code className="block w-full bg-black/20 p-2 rounded text-xs font-mono truncate">{newToken}</code>
               </div>
               <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(newToken)}>
                  <Copy className="w-4 h-4" />
               </Button>
            </div>
         )}

         <div className="divide-y divide-white/5">
            {tokens?.length === 0 && !localIsCreatingToken && (
               <div className="py-8 text-center text-muted-foreground text-sm">No tokens found.</div>
            )}
            {tokens?.map((token: any) => (
              <div key={token.id} className="py-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                       <Key className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                       <p className="font-medium text-sm">{token.name}</p>
                       <p className="text-xs text-muted-foreground">Created {new Date(token.created_at).toLocaleDateString()}</p>
                    </div>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => revokeToken(token.id)} className="text-muted-foreground hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                 </Button>
              </div>
            ))}
         </div>
      </div>
    </div>
  )
}
