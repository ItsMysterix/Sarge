"use client"

import { motion } from "framer-motion"
import { Bell, Mail, MessageSquare, AlertTriangle } from "lucide-react"
import { Toggle } from "./toggle"
import { cn } from "@/lib/utils"

interface NotificationsTabProps {
  notifications: {
    deploySuccess: boolean
    deployFailure: boolean
    serviceDown: boolean
    highCpu: boolean
    highMemory: boolean
    securityAlerts: boolean
    emailNotifications: boolean
    slackNotifications: boolean
  }
  onToggle: (key: string, value: boolean) => void
}

export function NotificationsTab({ notifications, onToggle }: NotificationsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-20"
    >
      {/* Alert Event Matrix */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-12">
        <div className="flex items-center gap-6 border-b border-white/5 pb-10">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
             <Bell className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Lifecycle Event Matrix</h3>
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Configure automated dispatch protocols for deployment & runtime state changes</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'deploySuccess', title: 'DEPLOY_STABLE', sub: 'Successful artifact orchestration', val: notifications.deploySuccess },
            { id: 'deployFailure', title: 'DEPLOY_CRITICAL', sub: 'Orchestration failure & rollback', val: notifications.deployFailure },
            { id: 'serviceDown', title: 'NODE_OFFLINE', sub: 'L7 health threshold violation', val: notifications.serviceDown }
          ].map((event) => (
             <div key={event.id} className="p-8 bg-[#050505] border border-white/5 rounded-3xl group hover:border-white/10 transition-all duration-500 ring-1 ring-inset ring-white/[0.01]">
                <div className="flex items-center justify-between mb-6">
                   <div className="text-[10px] font-black text-foreground/70 uppercase tracking-widest group-hover:text-foreground transition-colors">{event.title}</div>
                   <Toggle enabled={event.val} onChange={() => onToggle(event.id, !event.val)} />
                </div>
                <p className="text-[9px] font-bold text-muted-foreground/10 uppercase tracking-widest group-hover:text-muted-foreground/30 transition-colors">{event.sub}</p>
             </div>
          ))}
        </div>
      </div>

      {/* Performance Threshold Dispatches */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-12">
        <div className="flex items-center gap-6 border-b border-white/5 pb-10">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
             <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Kinetic Thresholds</h3>
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Resource saturation triggers & security anomaly dispatch logic</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'highCpu', title: 'CPU_SATURATION_80', sub: 'Compute cycle exhaustion alert', val: notifications.highCpu },
            { id: 'highMemory', title: 'RAM_EXHAUSTION_80', sub: 'Heap allocation limit violation', val: notifications.highMemory },
            { id: 'securityAlerts', title: 'SECURITY_BREACH_DETECT', sub: 'Vulnerability scan & anomaly events', val: notifications.securityAlerts }
          ].map((event) => (
             <div key={event.id} className="p-8 bg-[#050505] border border-white/5 rounded-3xl group hover:border-white/10 transition-all duration-500 ring-1 ring-inset ring-white/[0.01]">
                <div className="flex items-center justify-between mb-6">
                   <div className="text-[10px] font-black text-foreground/70 uppercase tracking-widest group-hover:text-foreground transition-colors">{event.title}</div>
                   <Toggle enabled={event.val} onChange={() => onToggle(event.id, !event.val)} />
                </div>
                <p className="text-[9px] font-bold text-muted-foreground/10 uppercase tracking-widest group-hover:text-muted-foreground/30 transition-colors">{event.sub}</p>
             </div>
          ))}
        </div>
      </div>

      {/* Dispatch Channels */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-12 border-indigo-500/5">
        <div className="flex items-center gap-6 border-b border-white/5 pb-10">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
             <Mail className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Telemetry Relay Ingress</h3>
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Configure downstream dispatch endpoints & communication protocols</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { id: 'emailNotifications', title: 'SMTP_RELAY_GATEWAY', sub: 'Broadcast telemetry to verified email nodes', icon: Mail, color: 'text-indigo-400/40', val: notifications.emailNotifications },
            { id: 'slackNotifications', title: 'SLACK_WEBHOOK_Nexus', sub: 'Streaming events to real-time chat grid', icon: MessageSquare, color: 'text-emerald-400/40', val: notifications.slackNotifications }
          ].map((relay) => (
             <div key={relay.id} className="p-10 bg-[#050505] border border-white/5 rounded-[2.5rem] group hover:border-white/10 transition-all duration-700 ring-1 ring-inset ring-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-8">
                   <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center transition-all duration-700 group-hover:border-indigo-500/20">
                      <relay.icon className={cn("w-6 h-6 transition-all", relay.color)} />
                   </div>
                   <div className="space-y-2">
                     <div className="text-[12px] font-black text-foreground/80 uppercase tracking-[0.3em] group-hover:text-foreground transition-colors">{relay.title}</div>
                     <p className="text-[10px] font-bold text-muted-foreground/10 uppercase tracking-widest group-hover:text-muted-foreground/30 transition-colors">{relay.sub}</p>
                   </div>
                </div>
                <Toggle enabled={relay.val} onChange={() => onToggle(relay.id, !relay.val)} />
             </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
