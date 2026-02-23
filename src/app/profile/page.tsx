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
    const [newToken, setNewToken] = useState<string | null>(null)
  const [deploymentEmails, setDeploymentEmails] = useState(true)
  const [productEmails, setProductEmails] = useState(false)

  const profileQuery = trpc.auth.getProfile.useQuery()
  const settingsQuery = trpc.settings.get.useQuery()
  const stacksQuery = trpc.stacks.list.useQuery()
  const awsSummaryQuery = trpc.aws.getSummary.useQuery()
  const tokensQuery = trpc.tokens.list.useQuery()
  const githubConnQuery = trpc.auth.getGithubConnection.useQuery(undefined, {
    enabled: isSignedIn
  })
  
  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      addToast({ type: 'success', title: 'Profile Updated' })
      profileQuery.refetch()
    }
  })

  const updateSettingsMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      settingsQuery.refetch()
    }
  })

  const createTokenMutation = trpc.tokens.create.useMutation({
    onSuccess: (data) => {
      setNewToken(data.token)
      tokensQuery.refetch()
    }
  })
 
  const revokeTokenMutation = trpc.tokens.revoke.useMutation({
    onSuccess: () => {
      tokensQuery.refetch()
      addToast({ type: "success", title: "Token revoked" })
    }
  })

  useEffect(() => {
    if (profileQuery.data?.name) setName(profileQuery.data.name)
    if (settingsQuery.data?.notifications) {
      const notes = settingsQuery.data.notifications as any
      if (notes.deploymentEmails !== undefined) setDeploymentEmails(notes.deploymentEmails)
      if (notes.productEmails !== undefined) setProductEmails(notes.productEmails)
    }
  }, [profileQuery.data, settingsQuery.data])

  if (!isLoaded || !isSignedIn) return <AuthLoading />

  const isGitHubConnected = Boolean(githubConnQuery.data?.connected)
  const isGitHubUser = (githubConnQuery.data as any)?.source === 'oauth'

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await updateProfileMutation.mutateAsync({ name })
    } finally { setIsSaving(false) }
  }

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      addToast({ type: 'success', title: 'Password Changed' })
    },
    onError: (err) => {
      addToast({ type: 'error', title: err.message })
    }
  })

  const handleChangePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', title: 'Password Mismatch' })
      return
    }
    setIsChangingPassword(true)
    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword })
    } finally { setIsChangingPassword(false) }
  }

  const handleNotificationChange = (type: 'deployment' | 'product', checked: boolean) => {
    if (type === 'deployment') setDeploymentEmails(checked)
    else setProductEmails(checked)

    updateSettingsMutation.mutate({
      notifications: {
        ...(settingsQuery.data?.notifications as any || {}),
        [type === 'deployment' ? 'deploymentEmails' : 'productEmails']: checked
      }
    })
  }

  return (
    <AppShell title="Account Settings">
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full animate-fade-in">
        <ToastContainer />
        <div className="mb-8 hidden">
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
            <BillingTab stacks={stacksQuery.data || []} awsSummary={awsSummaryQuery.data || {}} />
          </TabsContent>

          <TabsContent value="developer">
            <DeveloperTab 
              isGitHubConnected={isGitHubConnected} 
              setShowGithubModal={setShowGithubModal}
              tokens={tokensQuery.data || []}
              createToken={async (name) => { await createTokenMutation.mutateAsync({ name }) }}
              revokeToken={async (tokenId) => { await revokeTokenMutation.mutateAsync({ tokenId }) }}
              isCreatingToken={createTokenMutation.isLoading}
              setIsCreatingToken={() => {}} 
              newToken={newToken}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab 
              deploymentEmails={deploymentEmails} 
              productEmails={productEmails}
              handleDeploymentEmailChange={(checked) => handleNotificationChange('deployment', checked)}
              handleProductEmailChange={(checked) => handleNotificationChange('product', checked)}
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
