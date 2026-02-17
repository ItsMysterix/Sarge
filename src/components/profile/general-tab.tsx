"use client"

import { User, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface GeneralTabProps {
  user: any
  name: string
  setName: (name: string) => void
  handleSaveProfile: () => Promise<void>
  isSaving: boolean
}

export function GeneralTab({ user, name, setName, handleSaveProfile, isSaving }: GeneralTabProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="space-y-6 pt-2">
      <div className="glass-card p-6 border border-white/10 rounded-xl space-y-6">
        <div>
          <h3 className="text-lg font-medium">Profile Information</h3>
          <p className="text-sm text-muted-foreground">Update your public profile details.</p>
        </div>
        
        <div className="flex items-center gap-6 pb-6 border-b border-white/5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
              <User className="w-8 h-8 text-accent" />
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0A0A0A]" />
          </div>
          <div className="space-y-1">
            <h4 className="font-medium">{user?.fullName || 'User'}</h4>
            <p className="text-sm text-muted-foreground">{user?.emailAddresses?.[0]?.emailAddress}</p>
            <p className="text-xs text-muted-foreground/60 flex items-center gap-1.5 mt-1">
              <Calendar className="w-3 h-3" />
              Joined {user && 'createdAt' in user && (user as any).createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 max-w-md">
          <div className="grid gap-2">
            <Label htmlFor="name">Display Name</Label>
            <div className="flex gap-2">
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                className="bg-white/5 border-white/10" 
              />
              {isEditing ? (
                <>
                  <Button onClick={async () => { await handleSaveProfile(); setIsEditing(false); }} disabled={isSaving} size="sm">
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setName(user?.fullName || '') }}>Cancel</Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" value={user?.emailAddresses?.[0]?.emailAddress || ''} disabled className="bg-white/5 border-white/10 opacity-60" />
          </div>
        </div>
      </div>
    </div>
  )
}
