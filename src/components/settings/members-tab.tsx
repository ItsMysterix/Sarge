"use client"

import { useState } from "react"
import { Users, Plus, Mail, Shield, Trash2, MoreVertical, Loader2, UserPlus } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useProject } from "@/lib/project-context"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            Project Members
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage who has access to this project and their permissions.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Invite Form */}
      {isAdding && (
        <div className="glass-card p-4 space-y-4 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm focus:outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm focus:outline-none focus:border-white/20 appearance-none bg-transparent"
              >
                <option value="admin" className="bg-[#1a1a1a]">Admin (Full Control)</option>
                <option value="developer" className="bg-[#1a1a1a]">Developer (Manage Infrastructure)</option>
                <option value="viewer" className="bg-[#1a1a1a]">Viewer (Read Only)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={!inviteEmail || inviteMutation?.isLoading}
              className="flex items-center gap-2 px-4 py-1.5 bg-white text-black rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {inviteMutation?.isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              Send Invitation
            </button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="glass-card divide-y divide-white/[0.06] border border-white/10">
        {membersQuery?.isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          members.map((member: any) => (
            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      {(member.name || member.email || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name || member.email}</span>
                    <span className={cn(
                      "text-[10px] uppercase px-1.5 py-0.5 rounded border font-bold tracking-wider",
                      member.role === 'admin' || member.role === 'owner' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      member.role === 'developer' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      "bg-gray-500/10 text-gray-400 border-gray-500/20"
                    )}>
                      {member.role}
                    </span>
                    {member.status === 'pending' && (
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-500 font-bold tracking-wider animate-pulse">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{member.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {member.role !== 'owner' && (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => updateRoleMutation?.mutate({
                        projectId: currentProject?.id,
                        userId: member.id,
                        role: e.target.value as any
                      })}
                      className="px-2 py-1 bg-transparent border border-white/10 rounded text-xs text-muted-foreground focus:outline-none focus:border-white/20"
                    >
                      <option value="admin" className="bg-[#1a1a1a]">Admin</option>
                      <option value="developer" className="bg-[#1a1a1a]">Developer</option>
                      <option value="viewer" className="bg-[#1a1a1a]">Viewer</option>
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
                      className="p-2 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-white/5"
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
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm font-medium mb-3">
          <Shield className="w-4 h-4 text-accent" />
          <span>Role Permissions</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div>
            <div className="text-foreground font-medium mb-1">Admin</div>
            Manage all settings, domains, members, and billing.
          </div>
          <div>
            <div className="text-foreground font-medium mb-1">Developer</div>
            Manage deployments, secrets, and infrastructure.
          </div>
          <div>
            <div className="text-foreground font-medium mb-1">Viewer</div>
            Read-only access to logs, metrics, and code.
          </div>
        </div>
      </div>
    </div>
  )
}
