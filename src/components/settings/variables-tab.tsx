"use client"

import { useState } from "react"
import { Key, Plus, Trash2, Eye, EyeOff, Copy, RotateCcw, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useProject } from "@/lib/project-context"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/observatory/empty-state"

export function VariablesTab() {
  const { currentProject } = useProject()
  const { addToast } = useToast()
  const t = trpc as any
  
  const [activeEnv, setActiveEnv] = useState("production")
  const [showValues, setShowValues] = useState<Record<string, boolean>>({})
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkText, setBulkText] = useState("")
  
  const secretsQuery = t.secrets?.list?.useQuery(
    { projectId: currentProject?.id, environmentId: activeEnv },
    { enabled: !!currentProject?.id }
  )
  
  const setMutation = t.secrets?.set?.useMutation({
    onSuccess: () => {
      secretsQuery?.refetch()
      setNewKey("")
      setNewValue("")
      addToast({ type: "success", title: "Variable added", description: `Secret saved for ${activeEnv}` })
    },
    onError: (err: any) => {
      addToast({ type: "error", title: "Error", description: err.message })
    }
  })
  
  const deleteMutation = t.secrets?.delete?.useMutation({
    onSuccess: () => {
      secretsQuery?.refetch()
      addToast({ type: "success", title: "Variable deleted" })
    }
  })

  const handleAdd = () => {
    if (!newKey || !newValue) return
    setMutation?.mutate({
      projectId: currentProject?.id,
      environmentId: activeEnv,
      key: newKey,
      value: newValue
    })
    setIsAdding(false)
  }

  const handleBulkAdd = () => {
    if (!bulkText) return;
    const lines = bulkText.split('\n');
    lines.forEach((line) => {
      if (!line.trim() || line.startsWith('#')) return;
      const [key, ...rest] = line.split('=');
      if (key && key.trim() !== '') {
        const val = rest.join('=').trim().replace(/^["'](.*)["']$/, '$1');
        setMutation?.mutate({
          projectId: currentProject?.id,
          environmentId: activeEnv,
          key: key.trim(),
          value: val
        });
      }
    });
    setBulkText("");
    setIsAdding(false);
  }

  const handleDelete = (key: string) => {
    if (!confirm(`Delete ${key} from ${activeEnv}?`)) return
    deleteMutation?.mutate({
      projectId: currentProject?.id,
      environmentId: activeEnv,
      key
    })
  }

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    addToast({ type: "info", title: "Copied", description: `${key} copied to clipboard` })
  }

  const secrets = secretsQuery?.data || []

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
             <Key className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Entropy & Secret Matrix</h2>
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Runtime environment overrides & AES-256 encrypted payloads</p>
          </div>
        </div>
        <div className="flex gap-4">
           {/* Environment Selector */}
           <div className="flex gap-1 p-1 bg-white/[0.02] border border-white/5 rounded-xl">
            {["production", "preview", "development"].map(env => (
              <button
                key={env}
                onClick={() => setActiveEnv(env)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-500",
                  activeEnv === env 
                    ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                    : "text-muted-foreground/20 hover:text-muted-foreground/40 hover:bg-white/[0.02]"
                )}
              >
                {env === 'production' ? 'PROD_STABLE' : env === 'preview' ? 'STAGING_PRE' : 'DEV_SAND'}
              </button>
            ))}
          </div>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            className="h-10 px-6 bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> Inject Variable
          </Button>
        </div>
      </div>

      {/* Add New Variable Form */}
      {isAdding && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center gap-8 mb-10 border-b border-white/5 pb-8">
              <button 
                onClick={() => setIsBulkMode(false)} 
                className={cn(
                  "text-[9px] font-black uppercase tracking-[0.3em] transition-all", 
                   !isBulkMode ? "text-indigo-400" : "text-muted-foreground/20 hover:text-muted-foreground/40"
                )}
              >
                SINGLE_KV_LINK
              </button>
              <button 
                onClick={() => setIsBulkMode(true)} 
                className={cn(
                  "text-[9px] font-black uppercase tracking-[0.3em] transition-all", 
                   isBulkMode ? "text-indigo-400" : "text-muted-foreground/20 hover:text-muted-foreground/40"
                )}
              >
                BULK_DOTENV_STREAM
              </button>
          </div>
          
          {!isBulkMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] flex items-center gap-2">VARIABLE_IDENTIFIER</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
                  placeholder="X_API_KEY_SYSTEM"
                  className="w-full bg-[#050505] border border-white/5 rounded-xl px-5 py-3.5 text-[11px] font-mono outline-none focus:border-indigo-500/30 transition-all font-black text-foreground/80 uppercase tracking-widest placeholder:text-white/5"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] flex items-center gap-2">SENSITIVE_PAYLOAD</label>
                <input
                  type="password"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="w-full bg-[#050505] border border-white/5 rounded-xl px-5 py-3.5 text-[11px] font-mono outline-none focus:border-indigo-500/30 transition-all font-black text-foreground/80 uppercase tracking-widest placeholder:text-white/5"
                />
              </div>
            </div>
          ) : (
            <div className="mb-10 space-y-3">
              <label className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">DOTENV_BUFFER_INGRESS</label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"# PASTE_VARIABLES_HERE\nVARIABLE_KEY=VALUE_PAYLOAD\nDATABASE_URL=postgres://..."}
                rows={5}
                className="w-full bg-[#050505] border border-white/5 rounded-xl px-5 py-4 text-[11px] font-mono outline-none focus:border-indigo-500/30 transition-all font-black text-foreground/80 uppercase tracking-widest placeholder:text-white/5 resize-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-4 border-t border-white/5 pt-10">
            <Button
              onClick={() => setIsAdding(false)}
              variant="ghost"
              className="h-11 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground/60 transition-colors"
            >
              Abort_Injection
            </Button>
            <Button
              onClick={isBulkMode ? handleBulkAdd : handleAdd}
              disabled={(isBulkMode ? !bulkText : (!newKey || !newValue)) || setMutation?.isLoading}
              className="h-11 px-10 bg-white text-black hover:bg-white/90 text-[10px] font-black uppercase tracking-[0.25em] rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              {setMutation?.isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Commit_Encrypted_Change
            </Button>
          </div>
        </div>
      )}

      {/* Variables List */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] divide-y divide-white/5 shadow-xl overflow-hidden">
        {secretsQuery?.isLoading ? (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500/20" />
          </div>
        ) : secrets.length === 0 ? (
          <EmptyState 
            icon={Key} 
            title="Zero Entropy State" 
            subtitle="No environment overrides found for the current execution cluster" 
          />
        ) : (
          secrets.map((secret: any) => (
            <div key={secret.key} className="p-8 flex items-center gap-8 hover:bg-white/[0.02] transition-all duration-500 group">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="text-[11px] font-black text-foreground/80 uppercase tracking-widest flex items-center gap-3">
                   <div className="w-1 h-1 rounded-full bg-amber-500/40" />
                   {secret.key}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground/10 uppercase tracking-widest group-hover:text-muted-foreground/30 transition-colors bg-white/[0.01] px-4 py-2 border border-white/5 rounded-lg w-fit">
                  {showValues[secret.key] ? secret.value || "VOID_NULL" : "••••••••••••••••••••"}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {[
                   { icon: showValues[secret.key] ? EyeOff : Eye, action: () => setShowValues(v => ({ ...v, [secret.key]: !v[secret.key] })), label: 'Toggle' },
                   { icon: Copy, action: () => handleCopy(secret.key), label: 'Copy' },
                   { icon: Trash2, action: () => handleDelete(secret.key), label: 'Decouple', danger: true }
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={btn.action}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/5 transition-all duration-500",
                      btn.danger ? "hover:text-red-400/60 hover:bg-red-500/5 hover:border-red-500/10" : "hover:text-foreground/60 hover:bg-white/5 hover:border-white/10",
                      "text-muted-foreground/20"
                    )}
                  >
                    <btn.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="flex items-center gap-3 px-10 py-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl w-fit mx-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[9px] font-black text-emerald-500/40 uppercase tracking-[0.3em]">
            AES-256 GCM Encryption Enforced • Runtime Injection Active
          </p>
      </div>
    </div>
  )
}
