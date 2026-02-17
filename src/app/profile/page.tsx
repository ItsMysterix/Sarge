"use client"

import { AppShell } from "@/components/layout/app-shell"
import { AlertTriangle, Github } from "lucide-react"
import { useState, useEffect } from "react"
import { useUser } from "@/lib/clerk-safe"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/components/ui/toast"
import { AuthLoading } from "@/components/auth/loading"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

import { GeneralTab } from "@/components/profile/general-tab"
import { AccountTab } from "@/components/profile/account-tab"
import { BillingTab } from "@/components/profile/billing-tab"
import { DeveloperTab } from "@/components/profile/developer-tab"
import { NotificationsTab } from "@/components/profile/notifications-tab"

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { data: session } = useSession()
  const { addToast, ToastContainer } = useToast()
  
  const [activeTab, setActiveTab] = useState("general")
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showGithubModal, setShowGithubModal] = useState(false)
  const [githubConnection, setGithubConnection] = useState<{ connected: boolean; source?: string } | null>(null)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [deploymentEmails, setDeploymentEmails] = useState(true)
  const [productEmails, setProductEmails] = useState(false)

  const t = trpc as any
  const stacksQuery = t.stacks?.list?.useQuery()
  const awsSummaryQuery = t.aws?.getSummary?.useQuery()
  const tokensQuery = t.tokens?.list?.useQuery()
  
  const createTokenMutation = t.tokens?.create?.useMutation({
    onSuccess: (data: any) => {
      setNewToken(data.token)
      tokensQuery.refetch()
    }
  })

  const revokeTokenMutation = t.tokens?.revoke?.useMutation({
    onSuccess: () => {
      tokensQuery.refetch()
      addToast({ type: "success", title: "Token revoked" })
    }
  })

  useEffect(() => {
    if (user?.fullName) setName(user.fullName)
    if (!isSignedIn) return
    
    const loadGithubConnection = async () => {
      try {
        const response = await fetch("/api/github/connection")
        if (response.ok) setGithubConnection(await response.json())
      } catch (err) { console.error('Failed to load GitHub connection:', err) }
    }
    loadGithubConnection()

    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/user/settings")
        if (res.ok) {
          const data = await res.json()
          setDeploymentEmails(data.deployment_emails)
          setProductEmails(data.product_emails)
        }
      } catch (error) { console.error("Failed to fetch settings", error) }
    }
    fetchSettings()
  }, [user, isSignedIn])

  if (!isLoaded || !isSignedIn) return <AuthLoading />

  const isGitHubUser = session?.user && (session as any).accessToken
  const isGitHubConnected = Boolean(isGitHubUser || githubConnection?.connected)

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        addToast({ type: 'success', title: 'Profile Updated' })
      }
    } finally { setIsSaving(false) }
  }

  const handleChangePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', title: 'Password Mismatch' })
      return
    }
    setIsChangingPassword(true)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) addToast({ type: 'success', title: 'Password Changed' })
    } finally { setIsChangingPassword(false) }
  }

  return (
    <AppShell>
      <div className="flex-1 p-8 max-w-5xl mx-auto w-full animate-fade-in">
        <ToastContainer />
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile, security, and preferences.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted border border-border p-1">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="developer">Developer</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralTab 
              user={user} name={name} setName={setName} 
              handleSaveProfile={handleSaveProfile} isSaving={isSaving} 
            />
            <div className="bg-card p-6 border border-destructive/20 bg-destructive/5 rounded-xl space-y-4 mt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                  <p className="text-sm text-destructive/60">Irreversible actions for your account.</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <Button variant="destructive" size="sm">Delete Account</Button>
            </div>
          </TabsContent>

          <TabsContent value="account">
            <AccountTab 
              isCredentialsUser={!isGitHubUser} 
              handleChangePassword={handleChangePassword} 
              isChangingPassword={isChangingPassword} 
            />
          </TabsContent>

          <TabsContent value="billing">
            <BillingTab stacks={stacksQuery.data} awsSummary={awsSummaryQuery.data} />
          </TabsContent>

          <TabsContent value="developer">
            <DeveloperTab 
              isGitHubConnected={isGitHubConnected} 
              setShowGithubModal={setShowGithubModal}
              tokens={tokensQuery.data}
              createToken={(name) => createTokenMutation.mutate({ name })}
              revokeToken={(tokenId) => revokeTokenMutation.mutate({ tokenId })}
              isCreatingToken={createTokenMutation.isLoading}
              setIsCreatingToken={() => {}} 
              newToken={newToken}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab 
              deploymentEmails={deploymentEmails} 
              productEmails={productEmails}
              handleDeploymentEmailChange={(checked) => setDeploymentEmails(checked)}
              handleProductEmailChange={(checked) => setProductEmails(checked)}
            />
          </TabsContent>
        </Tabs>

        {!isGitHubConnected && showGithubModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-muted rounded-lg"><Github className="w-6 h-6 text-foreground" /></div>
                   <div>
                      <h3 className="font-semibold text-foreground">Connect GitHub</h3>
                      <p className="text-xs text-muted-foreground">Authorize access to your repositories.</p>
                   </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                   <Button variant="ghost" onClick={() => setShowGithubModal(false)}>Cancel</Button>
                   <a href="/api/auth/signin/github?callbackUrl=/profile?github=connected" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium">
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
