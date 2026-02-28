"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight, Hash, Mail, MessageSquare, AlertTriangle, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GridLoader } from "@/components/ui/grid-loader"
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
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-white/[0.01] border border-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Active Alerts */}
      {active.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-red-500/60" />
            </div>
            <div>
               <h2 className="text-sm font-bold text-white">Active Alerts</h2>
               <p className="text-xs text-white/20 mt-0.5">Real-time infrastructure and performance issues.</p>
            </div>
          </div>
          <div className="space-y-3">
            {active.map((alert: any) => (
              <div key={alert.id} className={cn(
                "bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex items-center justify-between group transition-all hover:border-white/10 shadow-lg relative overflow-hidden",
                alert.severity === 'critical' ? "border-red-500/10" : "border-amber-500/10"
              )}>
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    alert.severity === 'critical' ? "bg-red-500 animate-pulse" : "bg-amber-500 shadow-lg"
                  )} />
                  
                  <div>
                    <p className="text-sm font-bold text-white/80 transition-colors uppercase tracking-tight">{alert.message || alert.rule_name}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold uppercase tracking-widest text-white/10">
                      <span>{alert.triggered_at && formatDistanceToNow(new Date(alert.triggered_at))} ago</span>
                      <span className="w-1 h-1 rounded-full bg-white/5" />
                      <span>Value: {alert.value}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant="outline" className={cn(
                    "text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5",
                    alert.severity === 'critical' ? "text-red-400 border-red-500/10 bg-red-500/5" : "text-amber-400 border-amber-500/10 bg-amber-500/5"
                  )}>{alert.severity}</Badge>
                  
                  <Button 
                    size="sm"
                    onClick={() => resolveAlert.mutate({ alertId: alert.id })} 
                    className="bg-white text-black hover:bg-zinc-200 h-8 px-4 rounded-lg text-[9px] font-bold uppercase tracking-widest"
                  >
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert Rules */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <ToggleRight className="w-5 h-5 text-white/40" />
            </div>
            <div>
               <h2 className="text-sm font-bold text-white">Monitoring Rules</h2>
               <p className="text-xs text-white/20 mt-0.5">Configure thresholds for automated alerts.</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreate(!showCreate)} 
            className="h-9 px-4 bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5 mr-2" /> Add Rule
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
              <div className="bg-black border border-white/10 rounded-2xl p-8 space-y-8 mb-8 shadow-2xl">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Rule Name', field: 'name', type: 'input', placeholder: 'High Latency' },
                    { label: 'Metric', field: 'metric', type: 'select', options: ['cpu_usage', 'memory_usage', 'error_rate', 'latency'] },
                    { label: 'Threshold', field: 'threshold', type: 'number' },
                    { label: 'Severity', field: 'severity', type: 'select', options: ['critical', 'warning', 'info'] }
                  ].map((item) => (
                    <div key={item.label} className="space-y-2.5">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{item.label}</label>
                      {item.type === 'select' ? (
                        <select 
                          value={(form as any)[item.field]} 
                          onChange={e => setForm(f => ({ ...f, [item.field]: e.target.value }))}
                          className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white/60 outline-none focus:border-white/20 transition-all cursor-pointer"
                        >
                          {item.options?.map(opt => <option key={opt} value={opt} className="bg-black">{opt.replace(/_/g, ' ')}</option>)}
                        </select>
                      ) : (
                        <input 
                          type={item.type === 'number' ? 'number' : 'text'}
                          value={(form as any)[item.field]} 
                          onChange={e => setForm(f => ({ ...f, [item.field]: item.type === 'number' ? Number(e.target.value) : e.target.value }))}
                          placeholder={item.placeholder}
                          className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-xs font-mono text-white/80 placeholder:text-white/5 outline-none focus:border-white/20 transition-all font-bold"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                  <Button variant="ghost" onClick={() => setShowCreate(false)} className="h-10 px-6 text-xs font-bold uppercase tracking-widest text-white/20 hover:text-white">Cancel</Button>
                  <Button 
                    onClick={() => createRule.mutate({
                      projectId, name: form.name, ruleType: form.ruleType,
                      condition: { metric: form.metric, operator: form.operator, threshold: form.threshold },
                      severity: form.severity, notificationChannelIds: channels.map((c: any) => c.id), enabled: true,
                    })} 
                    className="h-10 px-8 bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xl"
                  >
                    Save Rule
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.length === 0 ? (
             <div className="col-span-full py-20 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center bg-white/[0.01] space-y-4">
                <Bell className="w-10 h-10 text-white/5" />
                <div className="text-center">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-white/20">No alert rules found</h3>
                   <p className="text-[10px] text-white/10 mt-1 max-w-[280px]">Automate your monitoring by adding custom rules.</p>
                </div>
             </div>
          ) : rules.map((rule: any) => (
            <div key={rule.id} className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex items-center gap-6 hover:border-white/10 transition-all group">
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center border transition-all",
                rule.enabled 
                  ? "bg-white/[0.02] border-white/10 text-white group-hover:bg-white/[0.05]" 
                  : "bg-white/[0.01] border-white/5 text-white/10"
              )}>
                {rule.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white/80 uppercase tracking-widest truncate">{rule.name}</p>
                <div className="flex items-center gap-2.5 text-[9px] font-bold text-white/10 mt-2 font-mono uppercase tracking-[0.2em] max-w-[200px] overflow-hidden">
                  <span className="text-white/20">{rule.rule_type}</span>
                  <span className="w-1 h-1 rounded-full bg-white/5" />
                  <span className="truncate">{JSON.stringify(rule.condition).replace(/[{}"]/g, '')}</span>
                </div>
              </div>
              <Badge variant="outline" className={cn(
                "text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5",
                rule.severity === 'critical' ? "text-red-400 border-red-500/10 bg-red-500/5" : "text-white/20 border-white/5 bg-white/5"
              )}>{rule.severity}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Channels Overview */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
             <MessageSquare className="w-5 h-5 text-white/40" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Notification Channels</h3>
            <p className="text-xs text-white/20 mt-0.5">External destinations for alert payloads.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.length === 0 ? (
            <div className="col-span-full py-12 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl text-[10px] font-bold text-white/10 uppercase tracking-widest text-center">
              No relay channels configured. Configure webhooks in settings.
            </div>
          ) : channels.map((ch: any) => (
            <div key={ch.id} className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition-all group">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 group-hover:bg-white/[0.05] transition-all">
                {ch.type === 'slack' ? <Hash className="w-4 h-4 text-white/20" /> : ch.type === 'email' ? <Mail className="w-4 h-4 text-white/20" /> : <MessageSquare className="w-4 h-4 text-white/20" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white/80 truncate uppercase tracking-widest">{ch.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full", ch.enabled ? "bg-emerald-500/40" : "bg-white/5")} />
                  <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">{ch.type} System</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
