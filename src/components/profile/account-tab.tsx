"use client"

import { Terminal, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface AccountTabProps {
  isCredentialsUser: boolean
  handleChangePassword: (current: string, newP: string, confirm: string) => Promise<void>
  isChangingPassword: boolean
}

export function AccountTab({ isCredentialsUser, handleChangePassword, isChangingPassword }: AccountTabProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  return (
    <div className="space-y-6 pt-2">
      {isCredentialsUser && (
        <div className="glass-card p-6 border border-white/10 rounded-xl space-y-6">
          <div>
            <h3 className="text-lg font-medium">Password</h3>
            <p className="text-sm text-muted-foreground">Change your account password.</p>
          </div>
          <div className="grid gap-4 max-w-md">
            <div className="grid gap-2">
              <Label htmlFor="current">Current Password</Label>
              <Input type="password" id="current" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new">New Password</Label>
              <Input type="password" id="new" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input type="password" id="confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            <Button 
              onClick={async () => {
                await handleChangePassword(currentPassword, newPassword, confirmPassword);
                setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
              }} 
              disabled={isChangingPassword || !currentPassword || !newPassword} 
              className="w-fit"
            >
              {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Update Password
            </Button>
          </div>
        </div>
      )}

      <div className="glass-card p-6 border border-white/10 rounded-xl space-y-6">
        <div>
          <h3 className="text-lg font-medium">Active Sessions</h3>
          <p className="text-sm text-muted-foreground">Manage devices logged into your account.</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Terminal className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Current Session</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Active</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Started just now
                  </span>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-mono">192.168.1.1</div>
          </div>
        </div>
      </div>
    </div>
  )
}
