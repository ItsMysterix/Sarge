"use client"

import { AppShell } from "@/components/layout/app-shell"
import { User, Mail, Calendar, GitBranch, Activity, Settings, Save, Database, Cloud, Zap, Lock, Key, Github, Terminal, Copy, Plus, Trash2, Shield, Clock, Loader2, CheckCircle, ExternalLink, CreditCard, Bell, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useUser } from "@/lib/clerk-safe"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/components/ui/toast"
import { AuthLoading } from "@/components/auth/loading"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { data: session } = useSession()
  const { addToast, ToastContainer } = useToast()
  
  // Tabs State
  const [activeTab, setActiveTab] = useState("general")

  // General Tab State
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Account Tab State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Developer Tab State
  const [showGithubModal, setShowGithubModal] = useState(false)
  const [githubConnection, setGithubConnection] = useState<{ connected: boolean; source?: string } | null>(null)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [tokenName, setTokenName] = useState("")
  const [isCreatingToken, setIsCreatingToken] = useState(false)

  // Notifications Tab State
  const [deploymentEmails, setDeploymentEmails] = useState(true)
  const [productEmails, setProductEmails] = useState(false)

  // Data Fetching
  const t = trpc as any
  const stacksQuery = t.stacks?.list?.useQuery()
  const stacks = stacksQuery?.data || []

  // Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/user/settings")
        if (res.ok) {
          const data = await res.json()
          setDeploymentEmails(data.deployment_emails)
          setProductEmails(data.product_emails)
        }
      } catch (error) {
        console.error("Failed to fetch settings", error)
      }
    }
    fetchSettings()
  }, [])

  const updateSettings = async (updates: { deployment_emails?: boolean; product_emails?: boolean }) => {
     try {
        await fetch("/api/user/settings", {
           method: "PATCH",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(updates),
        })
        addToast({
           type: "success",
           title: "Success",
           description: "Preferences updated.",
        })
     } catch (error) {
        addToast({
           type: "error",
           title: "Error",
           description: "Failed to update preferences.",
        })
     }
  }

  const handleDeploymentEmailChange = (checked: boolean) => {
     setDeploymentEmails(checked)
     updateSettings({ deployment_emails: checked, product_emails: productEmails })
  }

  const handleProductEmailChange = (checked: boolean) => {
     setProductEmails(checked)
     updateSettings({ deployment_emails: deploymentEmails, product_emails: checked })
  }
  const awsSummaryQuery = t.aws?.getSummary?.useQuery()
  const tokensQuery = t.tokens?.list?.useQuery()
  
  const createTokenMutation = t.tokens?.create?.useMutation({
    onSuccess: () => {
      setTokenName("")
      setIsCreatingToken(false)
      tokensQuery.refetch()
      addToast({
        type: "success",
        title: "Success",
        description: "Token created successfully",
      })
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Error",
        description: error.message,
      })
    }
  })
  const revokeTokenMutation = t.tokens?.revoke?.useMutation({
    onSuccess: () => {
      tokensQuery.refetch()
      addToast({ type: "success", title: "Token revoked" })
    }
  })

  useEffect(() => {
    if (user?.fullName) {
      setName(user.fullName)
    }
  }, [user])

  useEffect(() => {
    if (!isSignedIn) return
    const loadGithubConnection = async () => {
      try {
        const response = await fetch("/api/github/connection")
        if (!response.ok) return
        const data = await response.json()
        setGithubConnection(data)
      } catch (err) {
        console.error('Failed to load GitHub connection:', err)
      }
    }
    loadGithubConnection()
  }, [isSignedIn])

  if (!isLoaded || !isSignedIn) {
    return <AuthLoading />
  }

  const isGitHubUser = session?.user && (session as any).accessToken
  const isCredentialsUser = !isGitHubUser
  const isGitHubConnected = Boolean(isGitHubUser || githubConnection?.connected)

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (response.ok) {
        addToast({ type: 'success', title: 'Profile Updated', description: 'Your profile has been saved successfully' })
        setIsEditing(false)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Update Failed', description: error instanceof Error ? error.message : 'Failed to update profile' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', title: 'Password Mismatch', description: 'New password and confirmation do not match' })
      return
    }
    if (newPassword.length < 8) {
      addToast({ type: 'error', title: 'Weak Password', description: 'Password must be at least 8 characters long' })
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (response.ok) {
        addToast({ type: 'success', title: 'Password Changed', description: 'Your password has been updated successfully' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to change password')
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Password Change Failed', description: error instanceof Error ? error.message : 'Failed to change password' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <AppShell>
      <div className="flex-1 p-8 max-w-5xl mx-auto w-full animate-fade-in">
        <ToastContainer />
        
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile, security, and preferences.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-black/20 border border-white/5 p-1">
            <TabsTrigger value="general" className="data-[state=active]:bg-white/10">General</TabsTrigger>
            <TabsTrigger value="account" className="data-[state=active]:bg-white/10">Account</TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-white/10">Billing</TabsTrigger>
            <TabsTrigger value="developer" className="data-[state=active]:bg-white/10">Developer</TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-white/10">Notifications</TabsTrigger>
          </TabsList>

          {/* GENERAL TAB */}
          <TabsContent value="general" className="space-y-6 pt-2">
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
                        <Button onClick={handleSaveProfile} disabled={isSaving} size="sm">
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

            <div className="glass-card p-6 border border-red-900/20 bg-red-900/5 rounded-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-red-400">Danger Zone</h3>
                  <p className="text-sm text-red-400/60">Irreversible actions for your account.</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-red-900/20">
                <div>
                  <h4 className="font-medium text-sm">Delete Account</h4>
                  <p className="text-xs text-muted-foreground">Permanently remove your account and all data.</p>
                </div>
                <Button variant="destructive" size="sm">Delete Account</Button>
              </div>
            </div>
          </TabsContent>

          {/* ACCOUNT TAB */}
          <TabsContent value="account" className="space-y-6 pt-2">
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
                  <Button onClick={handleChangePassword} disabled={isChangingPassword || !currentPassword || !newPassword} className="w-fit">
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
          </TabsContent>

          {/* BILLING TAB */}
          <TabsContent value="billing" className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 border border-white/10 rounded-xl md:col-span-2 space-y-6">
                <div className="flex items-start justify-between">
                   <div>
                      <h3 className="text-lg font-medium">Current Plan</h3>
                      <p className="text-sm text-muted-foreground">You are on the <span className="text-white font-medium">Pro Plan</span>.</p>
                   </div>
                   <span className="px-3 py-1 bg-violet-500/20 text-violet-300 text-xs font-medium rounded-full border border-violet-500/30">
                     $20/month
                   </span>
                </div>
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Next billing date</span>
                    <span>March 1, 2026</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Payment method</span>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>•••• 4242</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">Manage Subscription</Button>
              </div>

              <div className="glass-card p-6 border border-white/10 rounded-xl space-y-6">
                 <div>
                    <h3 className="text-lg font-medium">Usage</h3>
                    <p className="text-sm text-muted-foreground">Resource consumption.</p>
                 </div>
                 <div className="space-y-4">
                    <div>
                       <div className="flex justify-between text-xs mb-1.5">
                          <span>Stacks</span>
                          <span className="text-muted-foreground">{stacksQuery.data?.length || 0} / 50</span>
                       </div>
                       <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-accent w-[10%] rounded-full" />
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between text-xs mb-1.5">
                          <span>S3 Buckets</span>
                          <span className="text-muted-foreground">{awsSummaryQuery.data?.s3?.bucketCount || 0} / 100</span>
                       </div>
                       <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-[5%] rounded-full" />
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </TabsContent>

          {/* DEVELOPER TAB */}
          <TabsContent value="developer" className="space-y-6 pt-2">
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
                  <Button onClick={() => setIsCreatingToken(true)} size="sm">Generate New</Button>
               </div>
               
               {isCreatingToken && (
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
                           onClick={() => createTokenMutation.mutate({ name: tokenName })} 
                           disabled={!tokenName || createTokenMutation.isLoading}
                        >
                           Create
                        </Button>
                        <Button variant="ghost" onClick={() => setIsCreatingToken(false)}>Cancel</Button>
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
                  {tokensQuery.data?.length === 0 && !isCreatingToken && (
                     <div className="py-8 text-center text-muted-foreground text-sm">No tokens found.</div>
                  )}
                  {tokensQuery.data?.map((token: any) => (
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
                       <Button variant="ghost" size="icon" onClick={() => revokeTokenMutation.mutate({ tokenId: token.id })} className="text-muted-foreground hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  ))}
               </div>
            </div>
          </TabsContent>

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications" className="space-y-6 pt-2">
             <div className="glass-card p-6 border border-white/10 rounded-xl space-y-6">
                <div>
                   <h3 className="text-lg font-medium">Email Notifications</h3>
                   <p className="text-sm text-muted-foreground">Choose what updates you want to receive.</p>
                </div>
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                         <Label className="text-base">Deployment Status</Label>
                         <p className="text-sm text-muted-foreground">Receive emails when deployments succeed or fail.</p>
                      </div>
                      <Switch checked={deploymentEmails} onCheckedChange={handleDeploymentEmailChange} />
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                         <Label className="text-base">Product Updates</Label>
                         <p className="text-sm text-muted-foreground">News about new features and improvements.</p>
                      </div>
                      <Switch checked={productEmails} onCheckedChange={handleProductEmailChange} />
                   </div>
                </div>
             </div>
          </TabsContent>
        </Tabs>

        {/* GitHub Modal reused logic */}
        {!isGitHubConnected && showGithubModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-white/5 rounded-lg"><Github className="w-6 h-6" /></div>
                   <div>
                      <h3 className="font-semibold">Connect GitHub</h3>
                      <p className="text-xs text-muted-foreground">Authorize access to your repositories.</p>
                   </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                   <Button variant="ghost" onClick={() => setShowGithubModal(false)}>Cancel</Button>
                   <a href="/api/auth/signin/github?callbackUrl=/profile?github=connected" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                      Continue with GitHub
                   </a>
                </div>
             </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
