"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight, Hash, Mail, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GridLoader } from "@/components/ui/grid-loader"
import { Card, EmptyState, SectionHeader } from "./shared"
import { formatDistanceToNow } from "date-fns"

export const AlertsSection = ({ projectId }: { projectId: string }) => {
  const t = trpc as any
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', ruleType: 'metric' as string, metric: 'cpu_usage', operator: '>' as string, threshold: 80, severity: 'warning' as string })

  const rulesQ = t.alerts.listRules.useQuery({ projectId }, { enabled: !!projectId })
  const activeQ = t.alerts.listActive.useQuery({ projectId }, { enabled: !!projectId })
  const channelsQ = t.alerts.listChannels.useQuery({ projectId }, { enabled: !!projectId })
  const createRule = t.alerts.createRule.useMutation({ onSuccess: () => { rulesQ.refetch(); setShowCreate(false) } })
  const resolveAlert = t.alerts.resolve.useMutation({ onSuccess: () => activeQ.refetch() })

  const rules = rulesQ.data || []
  const active = activeQ.data || []
  const channels = channelsQ.data || []
  const isLoading = rulesQ.isLoading

  if (isLoading) {
    return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-1000">
      {/* Active Alerts Feed */}
      {active.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center relative shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <Bell className="w-5 h-5 text-red-400" />
              <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col">
               <h2 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Critical Pulsations</h2>
               <p className="text-[9px] font-bold text-red-500/40 uppercase tracking-widest mt-1">Real-time infrastructure violation stream</p>
            </div>
          </div>
          <div className="space-y-4">
            {active.map((alert: any) => (
              <div key={alert.id} className={cn(
                "bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 flex items-center gap-8 group transition-all duration-500 hover:bg-white/[0.03] shadow-2xl relative overflow-hidden",
                alert.severity === 'critical' && "border-red-500/10"
              )}>
                {alert.severity === 'critical' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                )}
                
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  alert.severity === 'critical' ? "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]" : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                )} />
                
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-foreground/90 tracking-tight truncate uppercase">{alert.message || alert.rule_name}</p>
                  <div className="flex items-center gap-3 mt-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
                    <span className="text-red-500/60">{alert.triggered_at && formatDistanceToNow(new Date(alert.triggered_at)).toUpperCase()} AGO</span>
                    <span className="w-1 h-1 rounded-full bg-white/5" />
                    <span>TELEMETRY_VAL: <span className="text-foreground/60">{alert.value}</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <Badge variant="outline" className={cn(
                    "text-[8px] font-black uppercase tracking-[0.25em] px-4 h-7 border-white/5",
                    alert.severity === 'critical' ? "text-red-400 bg-red-500/5" : "text-amber-400 bg-amber-500/5"
                  )}>{alert.severity}</Badge>
                  
                  <Button 
                    onClick={() => resolveAlert.mutate({ alertId: alert.id })} 
                    className="bg-white text-black hover:opacity-90 h-9 px-6 rounded-xl text-[9px] font-black uppercase tracking-[0.2em]"
                  >
                    RESOLVE_NULL
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert Rule Management */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-12">
        <div className="flex items-center justify-between border-b border-white/5 pb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <ToggleRight className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex flex-col">
               <h2 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Rule Configurations</h2>
               <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Static guardian logic & triggers</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreate(!showCreate)} 
            className="h-10 px-6 bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5 mr-2" /> Manifest Guardian
          </Button>
        </div>

        <AnimatePresence>
          {showCreate && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#050505] border border-white/5 rounded-3xl p-10 space-y-10 shadow-2xl ring-1 ring-inset ring-white/[0.02]">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { label: 'Guardian Identifier', field: 'name', type: 'input', placeholder: 'LATENCY_SPIKE_RED' },
                    { label: 'Telemetry Metric', field: 'metric', type: 'select', options: ['cpu_usage', 'memory_usage', 'error_rate', 'latency'] },
                    { label: 'Entropy Threshold', field: 'threshold', type: 'number' },
                    { label: 'Severity Class', field: 'severity', type: 'select', options: ['critical', 'warning', 'info'] }
                  ].map((item) => (
                    <div key={item.label} className="space-y-3">
                      <label className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
                        {item.label}
                      </label>
                      {item.type === 'select' ? (
                        <select 
                          value={(form as any)[item.field]} 
                          onChange={e => setForm(f => ({ ...f, [item.field]: e.target.value }))}
                          className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-5 py-3.5 text-[11px] outline-none focus:border-indigo-500/30 transition-all font-black text-foreground/80 uppercase tracking-widest cursor-pointer"
                        >
                          {item.options?.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                        </select>
                      ) : (
                        <input 
                          type={item.type === 'number' ? 'number' : 'text'}
                          value={(form as any)[item.field]} 
                          onChange={e => setForm(f => ({ ...f, [item.field]: item.type === 'number' ? Number(e.target.value) : e.target.value }))}
                          placeholder={item.placeholder}
                          className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-5 py-3.5 text-[11px] font-mono outline-none focus:border-indigo-500/30 transition-all font-black text-foreground/80 uppercase tracking-widest placeholder:text-white/5"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-4 pt-10 border-t border-white/5">
                  <Button variant="ghost" onClick={() => setShowCreate(false)} className="h-11 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground/60 transition-colors">Abort_Manifest</Button>
                  <Button 
                    onClick={() => createRule.mutate({
                      projectId, name: form.name, ruleType: form.ruleType,
                      condition: { metric: form.metric, operator: form.operator, threshold: form.threshold },
                      severity: form.severity, notificationChannelIds: channels.map((c: any) => c.id), enabled: true,
                    })} 
                    className="h-11 px-10 bg-indigo-500 text-white hover:bg-indigo-400 text-[10px] font-black uppercase tracking-[0.25em] rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                  >
                    Deploy_Guardian
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.length === 0 ? (
             <div className="col-span-full py-32 border border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center bg-white/[0.01] space-y-6">
                <Bell className="w-12 h-12 text-muted-foreground/10" />
                <div className="text-center space-y-2">
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40">Static Guardians Locked</h3>
                   <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest max-w-[280px]">Configure automated triggers to initialize active monitoring protocols.</p>
                </div>
             </div>
          ) : rules.map((rule: any) => (
            <div key={rule.id} className="bg-[#050505] border border-white/5 rounded-3xl p-8 flex items-center gap-8 hover:border-indigo-500/20 transition-all duration-500 shadow-xl group relative overflow-hidden">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500",
                rule.enabled 
                  ? "bg-indigo-500/5 border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/10" 
                  : "bg-white/[0.02] border-white/5 text-muted-foreground/10"
              )}>
                {rule.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-black text-foreground/80 tracking-[0.1em] truncate uppercase">{rule.name}</p>
                <div className="flex items-center gap-3 text-[8px] font-black text-muted-foreground/20 uppercase tracking-widest mt-2 font-mono">
                  <span className="text-indigo-400/40">{rule.rule_type?.toUpperCase()}</span>
                  <span className="w-1 h-1 rounded-full bg-white/5" />
                  <span className="truncate border-b border-white/5">{JSON.stringify(rule.condition).replace(/[{}"]/g, '')}</span>
                </div>
              </div>
              <Badge variant="outline" className={cn(
                "text-[8px] font-black uppercase tracking-[0.25em] h-6 px-3 border-white/5",
                rule.severity === 'critical' ? "text-red-400/60 bg-red-500/5" : "text-blue-400/60 bg-blue-500/5"
              )}>{rule.severity}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Connectivity Channels */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-10">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
             <MessageSquare className="w-5 h-5 text-indigo-400/60" />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/40">Signal Relay Matrix</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.length === 0 ? (
            <div className="col-span-full py-12 bg-[#050505] border border-white/5 rounded-3xl text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] text-center border-dashed">
              Zero relay tunnels established. Tunnel Slack or Discord payloads.
            </div>
          ) : channels.map((ch: any) => (
            <div key={ch.id} className="bg-[#050505] border border-white/5 rounded-[2rem] p-6 flex items-center gap-6 hover:border-white/10 transition-all duration-500 shadow-2xl relative group overflow-hidden">
               {ch.enabled && <div className="absolute top-0 right-0 p-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               </div>}
               
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:border-indigo-500/20 transition-colors">
                {ch.type === 'slack' ? <Hash className="w-5 h-5 text-indigo-400/40" /> : ch.type === 'email' ? <Mail className="w-5 h-5 text-indigo-400/40" /> : <MessageSquare className="w-5 h-5 text-indigo-400/40" />}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-foreground/70 truncate uppercase tracking-widest">{ch.name}</p>
                <p className="text-[8px] font-black text-muted-foreground/10 uppercase tracking-[0.25em] mt-1.5">{ch.type?.toUpperCase()}_BRIDGE</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
