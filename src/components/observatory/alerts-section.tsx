"use client"

import { useState } from "react"
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
  const resolveAlert = t.alerts.resolve?.useMutation?.({ onSuccess: () => activeQ.refetch() })

  const rules = rulesQ.data || []
  const active = activeQ.data || []
  const channels = channelsQ.data || []
  const loading = rulesQ.isLoading

  if (loading) return <div className="flex justify-center py-20"><GridLoader /></div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Active Alerts */}
      {active.length > 0 && (
        <div>
          <SectionHeader title={`Active Alerts (${active.length})`} icon={Bell} />
          <div className="space-y-2">
            {active.map((alert: any) => (
              <Card key={alert.id} className={cn("flex items-center gap-4 py-3",
                alert.severity === 'critical' && "border-l-2 border-l-red-500 bg-red-500/[0.02]",
                alert.severity === 'warning' && "border-l-2 border-l-amber-500",
              )}>
                <div className={cn("w-2 h-2 rounded-full animate-pulse",
                  alert.severity === 'critical' ? "bg-red-500" : alert.severity === 'warning' ? "bg-amber-500" : "bg-blue-500"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{alert.message || alert.rule_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {alert.triggered_at && formatDistanceToNow(new Date(alert.triggered_at))} ago · Value: {alert.value}
                  </p>
                </div>
                <Badge variant="secondary" className={cn("text-[9px] uppercase font-bold tracking-widest",
                  alert.severity === 'critical' ? "text-red-400" : alert.severity === 'warning' ? "text-amber-400" : "text-blue-400"
                )}>{alert.severity}</Badge>
                {resolveAlert && (
                  <Button variant="ghost" size="sm" onClick={() => resolveAlert.mutate({ alertId: alert.id })} className="h-7 text-[10px]">
                    Resolve
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Alert Rules */}
      <div>
        <SectionHeader title="Alert Rules" icon={Bell} action={
          <Button variant="outline" size="sm" onClick={() => setShowCreate(!showCreate)} className="h-8 text-[10px] font-bold uppercase tracking-widest">
            <Plus className="w-3 h-3 mr-1.5" /> New Rule
          </Button>
        } />

        {showCreate && (
          <Card className="mb-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-foreground/30" placeholder="High CPU Alert" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Metric</label>
                <select value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs outline-none">
                  <option value="cpu_usage">CPU Usage</option>
                  <option value="memory_usage">Memory Usage</option>
                  <option value="error_rate">Error Rate</option>
                  <option value="latency">Latency</option>
                  <option value="request_count">Request Count</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Threshold</label>
                <input type="number" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: Number(e.target.value) }))}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-foreground/30" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Severity</label>
                <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs outline-none">
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="h-8 text-[10px]">Cancel</Button>
              <Button size="sm" onClick={() => createRule.mutate({
                projectId, name: form.name, ruleType: form.ruleType,
                condition: { metric: form.metric, operator: form.operator, threshold: form.threshold },
                severity: form.severity, notificationChannelIds: channels.map((c: any) => c.id), enabled: true,
              })} className="h-8 text-[10px] font-bold uppercase tracking-widest">
                Create Rule
              </Button>
            </div>
          </Card>
        )}

        {rules.length === 0 ? (
          <EmptyState icon={Bell} title="No alert rules configured." subtitle="Create rules to get notified about CPU spikes, errors, or deployment failures." />
        ) : (
          <div className="space-y-2">
            {rules.map((rule: any) => (
              <Card key={rule.id} className="flex items-center gap-4 py-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                  rule.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
                )}>
                  {rule.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{rule.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {rule.rule_type} · {JSON.stringify(rule.condition)} · {rule.severity}
                  </p>
                </div>
                <Badge variant="secondary" className={cn("text-[9px] uppercase font-bold tracking-widest",
                  rule.severity === 'critical' ? "text-red-400" : rule.severity === 'warning' ? "text-amber-400" : "text-blue-400"
                )}>{rule.severity}</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Notification Channels */}
      <div>
        <SectionHeader title="Notification Channels" icon={MessageSquare} />
        {channels.length === 0 ? (
          <EmptyState icon={Mail} title="No notification channels." subtitle="Add Slack, Discord, or email integrations in Settings → Integrations." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {channels.map((ch: any) => (
              <Card key={ch.id} className="flex items-center gap-3 py-3">
                <div className="p-2 rounded-lg bg-muted border border-border">
                  {ch.type === 'slack' ? <Hash className="w-4 h-4" /> : ch.type === 'email' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold">{ch.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{ch.type}</p>
                </div>
                <div className={cn("ml-auto w-1.5 h-1.5 rounded-full", ch.enabled ? "bg-emerald-500" : "bg-muted-foreground/30")} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
