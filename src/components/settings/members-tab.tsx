"use client"

import { useState } from "react"
import { Users, Plus, Mail, Shield, Trash2, MoreVertical, Loader2, UserPlus } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useProject } from "@/lib/project-context"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function MembersTab() {
  const { currentProject } = useProject()
  const { addToast } = useToast()
  const t = trpc as any
  
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "developer" | "viewer">("developer")
  const [isAdding, setIsAdding] = useState(false)
  
  const membersQuery = t.members?.list?.useQuery(
    { projectId: currentProject?.id },
    { enabled: !!currentProject?.id }
  )
  
  const inviteMutation = t.members?.invite?.useMutation({
    onSuccess: () => {
      membersQuery?.refetch()
      setInviteEmail("")
      setIsAdding(false)
      addToast({ type: "success", title: "Invitation sent", description: `${inviteEmail} has been added` })
    },
    onError: (err: any) => {
      addToast({ type: "error", title: "Invite failed", description: err.message })
    }
  })
  
  const removeMutation = t.members?.remove?.useMutation({
    onSuccess: () => {
      membersQuery?.refetch()
      addToast({ type: "success", title: "Member removed" })
    }
  })

  const updateRoleMutation = t.members?.updateRole?.useMutation({
    onSuccess: () => {
      membersQuery?.refetch()
      addToast({ type: "success", title: "Role updated" })
    }
  })

  const handleInvite = () => {
    if (!inviteEmail || !currentProject?.id) return
    inviteMutation?.mutate({
      projectId: currentProject.id,
      email: inviteEmail,
      role: inviteRole
    })
  }

  const members = membersQuery?.data || []

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
             <Users className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Access Control Matrix</h2>
            <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Manage infrastructure clearance & personnel hierarchy</p>
          </div>
        </div>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="h-10 px-6 bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Manifest Personnel
        </Button>
      </div>

      {/* Invite Form */}
      {isAdding && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
                Signal Target Email
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="OPERATIVE@NETWORK.COM"
                className="w-full bg-[#050505] border border-white/5 rounded-xl px-5 py-3.5 text-[11px] font-mono outline-none focus:border-indigo-500/30 transition-all font-black text-foreground/80 uppercase tracking-widest placeholder:text-white/5"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
                Clearance Category
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full bg-[#050505] border border-white/5 rounded-xl px-5 py-3.5 text-[11px] outline-none focus:border-indigo-500/30 transition-all font-black text-foreground/80 uppercase tracking-widest cursor-pointer"
              >
                <option value="admin" className="bg-[#0a0a0a]">ADMIN_CORE (Full_Clearance)</option>
                <option value="developer" className="bg-[#0a0a0a]">DEV_OPERATIVE (Infra_Read_Write)</option>
                <option value="viewer" className="bg-[#0a0a0a]">OBS_VIEWER (Read_Only_Stream)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-4 border-t border-white/5 pt-10">
            <Button
              onClick={() => setIsAdding(false)}
              variant="ghost"
              className="h-11 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground/60 transition-colors"
            >
              Abort_Manifest
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail || inviteMutation?.isLoading}
              className="h-11 px-10 bg-indigo-500 text-white hover:bg-indigo-400 text-[10px] font-black uppercase tracking-[0.25em] rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.2)]"
            >
              {inviteMutation?.isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Dispatch_Bridge_Signal
            </Button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] divide-y divide-white/5 shadow-xl overflow-hidden">
        {membersQuery?.isLoading ? (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500/20" />
          </div>
        ) : (
          members.map((member: any) => (
            <div key={member.id} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors duration-500 group">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-indigo-500/20 group-hover:bg-white/[0.05]">
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" />
                  ) : (
                    <span className="text-[14px] font-black text-white/10 uppercase tracking-widest">
                      {(member.name || member.email || "?").charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] font-black text-foreground/80 uppercase tracking-widest">{member.name || member.email}</span>
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-black uppercase tracking-[0.2em] h-6 px-3 border-white/5 transition-colors duration-500",
                      member.role === 'admin' || member.role === 'owner' ? "bg-purple-500/5 text-purple-400/60" :
                      member.role === 'developer' ? "bg-blue-500/5 text-blue-400/60" :
                      "bg-white/5 text-muted-foreground/30"
                    )}>
                      {member.role?.toUpperCase()}
                    </Badge>
                    {member.status === 'pending' && (
                      <span className="text-[8px] uppercase px-3 py-1 rounded-lg border border-amber-500/10 bg-amber-500/5 text-amber-500/60 font-black tracking-widest animate-pulse">
                        PENDING_SIGNAL
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground/20 uppercase tracking-widest mt-2">{member.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {member.role !== 'owner' && (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => updateRoleMutation?.mutate({
                        projectId: currentProject?.id,
                        userId: member.id,
                        role: e.target.value as any
                      })}
                      className="bg-white/[0.03] border border-white/5 rounded-xl px-4 h-10 text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] focus:outline-none focus:border-white/10 transition-all cursor-pointer"
                    >
                      <option value="admin" className="bg-[#0a0a0a]">CORE_ADMIN</option>
                      <option value="developer" className="bg-[#0a0a0a]">OPERATIVE</option>
                      <option value="viewer" className="bg-[#0a0a0a]">VIEW_ONLY</option>
                    </select>
                    <button
                      onClick={() => {
                        if (member.status === 'pending') {
                          t.members.revokeInvitation.mutate({ invitationId: member.id, projectId: currentProject?.id })
                        } else {
                          removeMutation?.mutate({
                            projectId: currentProject?.id,
                            userId: member.id
                          })
                        }
                      }}
                      className="w-10 h-10 flex items-center justify-center text-muted-foreground/20 hover:text-red-400/60 rounded-xl bg-white/[0.02] border border-white/5 hover:border-red-500/10 transition-all duration-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* RBAC Info */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-10">
        <div className="flex items-center gap-4 border-b border-white/5 pb-10">
          <Shield className="w-5 h-5 text-indigo-400/40" />
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/40">Clearance Protocol Reference</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { role: 'Core_Admin', desc: 'Full-spectrum administrative access to kernels, telemetry, personnel, and billing streams.' },
            { role: 'Dev_Operative', desc: 'Standard write clearance to infrastructure allocation, deployment logs, and secret management.' },
            { role: 'Obs_Viewer', desc: 'Restricted read-only tunnel to infrastructure telemetry, logs, and state history.' }
          ].map((item) => (
            <div key={item.role} className="space-y-4 group">
               <div className="flex items-center gap-3">
                  <div className="w-1 h-1 rounded-full bg-indigo-500/40 opacity-40 group-hover:opacity-100 transition-opacity" />
                  <div className="text-[11px] font-black text-foreground/60 uppercase tracking-[0.2em] group-hover:text-foreground transition-colors">{item.role}</div>
               </div>
               <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest leading-relaxed group-hover:text-muted-foreground/40 transition-colors">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
