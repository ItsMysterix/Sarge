"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { useUserSettings } from "@/hooks/use-sarge-api"
import { trpc } from "@/lib/trpc"
import { useProject } from "@/lib/project-context"
import { useToast } from "@/components/ui/toast"
import { useAppStore } from "@/lib/store"
import { TabsNavigation, type SettingsTab } from "@/components/settings/tabs-navigation"
import { GeneralTab } from "@/components/settings/general-tab"
import { AppearanceTab } from "@/components/settings/appearance-tab"
import { NotificationsTab } from "@/components/settings/notifications-tab"
import { IntegrationsTab } from "@/components/settings/integrations-tab"
import { BillingTab } from "@/components/settings/billing-tab"
import { SecurityTab } from "@/components/settings/security-tab"
import { ShortcutsTab } from "@/components/settings/shortcuts-tab"
import { VariablesTab } from "@/components/settings/variables-tab"
import { TargetsTab } from "@/components/settings/targets-tab"
import { DomainsTab } from "@/components/settings/domains-tab"
import { MembersTab } from "@/components/settings/members-tab"
import { WebhooksTab } from "@/components/settings/webhooks-tab"
import { ConnectProviderModal } from "@/components/settings/connect-provider-modal"
import { AppShell } from '@/components/layout/app-shell'
import { Settings as SettingsIcon, CreditCard } from 'lucide-react'
import posthog from 'posthog-js'
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"

export default function Settings() {
  const { data: settings, loading, error, updateSettings } = useUserSettings()
  const { isTestingWebhook, setTestingWebhook } = useAppStore()
  const { addToast, ToastContainer } = useToast()
  const { theme, setTheme } = useTheme()
  const { currentProject } = useProject()

  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<SettingsTab>("general")

  useEffect(() => {
    const tab = searchParams?.get("tab") as SettingsTab
    if (tab && [
      "general", "appearance", "notifications", "integrations", "billing", 
      "security", "shortcuts", "variables", "targets", "domains", 
      "members", "webhooks"
    ].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const [selectedProvider, setSelectedProvider] = useState<any | null>(null)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)

  // Providers & Billing Queries
  const providersQuery = trpc.providers.list.useQuery({ projectSlug: currentProject?.slug || 'global' })
  const costQuery = trpc.costOptimization.getCostOverview.useQuery(
    { projectId: currentProject?.id || '' },
    { enabled: !!currentProject?.id }
  )
  const recommendationsQuery = trpc.costOptimization.getRecommendations.useQuery(
    { projectId: currentProject?.id || '' },
    { enabled: !!currentProject?.id }
  )
  const budgetQuery = trpc.costOptimization.getBudgetStatus.useQuery(
    { projectId: currentProject?.id || '' },
    { enabled: !!currentProject?.id }
  )

  const accountsQuery = trpc.auth.getLinkedAccounts.useQuery()
  const channelsQuery = trpc.alerts.listChannels.useQuery({ projectId: currentProject?.id || 'global' })

  const toggleProviderMutation = trpc.providers.toggle.useMutation({
    onSuccess: () => {
      providersQuery.refetch()
      addToast({ type: 'success', title: 'Provider Visibility Updated' })
    }
  })

  const saveCredentialsMutation = trpc.providers.saveCredentials.useMutation({
    onSuccess: () => {
      providersQuery.refetch()
      addToast({ type: 'success', title: 'Account Connected', description: 'Real-time billing and orchestration active.' })
      setIsConnectModalOpen(false)
      setSelectedProvider(null)
    },
    onError: (err) => {
      addToast({ type: 'error', title: 'Connection Failed', description: err.message })
    }
  })

  const DEFAULT_NOTIFICATIONS = {
    deploySuccess: true,
    deployFailure: true,
    serviceDown: true,
    highCpu: true,
    highMemory: false,
    securityAlerts: true,
    emailNotifications: false,
    slackNotifications: true,
  }

  const handleToggleProvider = (providerId: string, currentStatus: string) => {
    if (currentStatus === 'connected') {
      toggleProviderMutation.mutate({
        providerId,
        projectSlug: currentProject?.slug || 'global',
        status: 'disconnected'
      })
    } else {
      const provider = providersQuery.data?.find((p: any) => p.id === providerId)
      if (provider) {
        setSelectedProvider(provider)
        setIsConnectModalOpen(true)
      }
    }
  }

  const handleConnectProvider = async (providerId: string, credentials: Record<string, string>) => {
    saveCredentialsMutation.mutate({
      providerId,
      projectSlug: currentProject?.slug || 'global',
      credentials
    })
  }

  const clearDataMutation = trpc.settings.clearData.useMutation({
    onSuccess: () => {
      addToast({ type: "success", title: "Data Cleared", description: "All system logs and metrics have been removed." })
    },
    onError: (err) => {
      addToast({ type: "error", title: "Action Failed", description: err.message })
    }
  })

  const testWebhookMutation = trpc.alerts.testChannel.useMutation({
    onSuccess: () => {
      addToast({ type: "success", title: "Test Success", description: "Slack webhook test successful! Message sent." })
    },
    onError: (err) => {
      addToast({ type: "error", title: "Test Failed", description: err.message })
    },
    onSettled: () => setTestingWebhook(false)
  })

  const handleToggle = async (key: "slackAlerts" | "autoRebuild", value: boolean) => {
    try {
      await updateSettings({ [key]: value })
      addToast({ type: "success", title: "Settings Updated", description: `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value ? "enabled" : "disabled"}` })
    } catch (error) {
      addToast({ type: "error", title: "Update Failed", description: "Failed to update settings" })
    }
  }

  const handleThemeChange = async (mode: "dark" | "light" | "system") => {
    setTheme(mode)
    try {
      await updateSettings({ themeMode: mode as any })
      addToast({ type: "success", title: "Theme Updated" })
    } catch (error) {
      addToast({ type: "error", title: "Update Failed" })
    }
  }

  const handleAnimationsToggle = async (enabled: boolean) => {
    try {
      posthog.setPersonProperties({ 'enable-animations': enabled })
      await updateSettings({ enableAnimations: enabled })
      addToast({ type: "success", title: "Animations Updated" })
    } catch (error) {
      addToast({ type: "error", title: "Update Failed" })
    }
  }

  const handleNotificationToggle = async (key: string, value: boolean) => {
    const updated = { ...(settings?.notifications || DEFAULT_NOTIFICATIONS), [key]: value } as any
    try {
      await updateSettings({ notifications: updated })
      addToast({ type: "success", title: "Notification Updated" })
    } catch (error) {
      addToast({ type: "error", title: "Update Failed" })
    }
  }

  const handleWebhookTest = async () => {
    const webhookChannel = channelsQuery.data?.find((c: any) => c.type === 'slack' || c.type === 'webhook')
    if (!webhookChannel) {
      addToast({ type: "error", title: "No Webhook", description: "Please configure a Slack or Webhook channel first." })
      return
    }

    setTestingWebhook(true)
    testWebhookMutation.mutate({ channelId: webhookChannel.id })
  }

  const [isSyncingGitHub, setIsSyncingGitHub] = useState(false)
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false)
  const [isSyncingAmazon, setIsSyncingAmazon] = useState(false)
  const [isSyncingMicrosoft, setIsSyncingMicrosoft] = useState(false)

  const syncGitHubMutation = trpc.github.syncGitHubIntegrations.useMutation({
    onSuccess: (data) => {
      providersQuery.refetch()
      setIsSyncingGitHub(false)
      if (data.count > 0) {
        addToast({ 
          type: 'success', 
          title: 'Infrastructure Synced', 
          description: `Discovered and connected ${data.count} services from your GitHub account.` 
        })
      }
    },
    onError: (err) => {
      setIsSyncingGitHub(false)
      addToast({ type: 'error', title: 'Sync Failed', description: err.message })
    }
  })

  const syncGoogleMutation = trpc.cloud.syncGoogle.useMutation({
    onSuccess: (data) => {
      providersQuery.refetch()
      setIsSyncingGoogle(false)
      addToast({ type: 'success', title: 'Google Bridge Active', description: `Linked ${data.count} services from your Google Cloud identity.` })
    },
    onError: (err) => {
      setIsSyncingGoogle(false)
      addToast({ type: 'error', title: 'Google Sync Failed', description: err.message })
    }
  })

  const verifyAmazonMutation = trpc.cloud.verifyAmazonConnection.useMutation({
    onSuccess: () => {
      providersQuery.refetch()
      setIsSyncingAmazon(false)
      addToast({ type: 'success', title: 'AWS Nexus Connected', description: 'Cross-account IAM role successfully assumed. Sarge is now orchestrating your AWS environment.' })
    },
    onError: (err) => {
      setIsSyncingAmazon(false)
      addToast({ type: 'error', title: 'AWS Verification Failed', description: err.message })
    }
  })

  const handleSyncAmazon = () => {
    const awsProvider = providersQuery.data?.find((p: any) => p.id === 'aws')
    if (awsProvider) {
      handleToggleProvider('aws', awsProvider.status)
    }
  }

  const syncMicrosoftMutation = trpc.cloud.syncMicrosoft.useMutation({
    onSuccess: (data) => {
      providersQuery.refetch()
      setIsSyncingMicrosoft(false)
      addToast({ type: 'success', title: 'Microsoft Bridge Active', description: `Azure services discovered and linked to your Sarge workspace.` })
    },
    onError: (err) => {
      setIsSyncingMicrosoft(false)
      addToast({ type: 'error', title: 'Microsoft Sync Failed', description: err.message })
    }
  })

  const handleSyncGitHub = () => {
    setIsSyncingGitHub(true)
    syncGitHubMutation.mutate()
  }

  const handleSyncGoogle = () => {
    setIsSyncingGoogle(true)
    syncGoogleMutation.mutate()
  }

  const handleSyncMicrosoft = () => {
    setIsSyncingMicrosoft(true)
    syncMicrosoftMutation.mutate()
  }

  const handleExportSettings = () => {}
  const handleImportSettings = () => {}
  const handleClearData = async () => {
    if (confirm('Clear all data?')) clearDataMutation.mutate()
  }

  if (loading || (activeTab === 'integrations' && providersQuery.isLoading)) {
    return (
      <AppShell>
        <LoadingScreen title="Synchronizing System Preferences" subtitle="Negotiating identity protocols..." />
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-700">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-2xl">
             <SettingsIcon className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Kernel Protocol Violation</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Failed to synchronize master configuration</p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="h-10 px-6 border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-[0.2em]"
          >
            Re-Initialize Handshake
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title={
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center shadow-2xl ring-1 ring-inset ring-white/[0.01]">
          <SettingsIcon className="w-6 h-6 text-indigo-400/60" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-black tracking-[0.5em] uppercase text-foreground/90">Kernel_Master_Configuration</span>
          <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse" />
            System_Handshake_Established // Access_Level_4
          </span>
        </div>
      </div>
    }>
      <ToastContainer />
      <div className="flex-1 p-10 lg:p-14 max-w-[1800px] mx-auto w-full flex flex-col gap-12 animate-in fade-in duration-1000">
        <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="min-h-[700px] animate-in slide-in-from-bottom-8 duration-1000">
          {activeTab === "general" && (
            <GeneralTab
              settings={settings}
              updateSettings={updateSettings}
              onExport={handleExportSettings}
              onImport={handleImportSettings}
              onClearData={handleClearData}
            />
          )}

          {activeTab === "variables" && <VariablesTab />}
          {activeTab === "targets" && (
            <TargetsTab
              providers={providersQuery.data || []}
              onToggleProvider={handleToggleProvider}
            />
          )}

          {activeTab === "appearance" && (
            <AppearanceTab
              themeMode={(theme as "dark" | "light" | "system") || "dark"}
              enableAnimations={settings?.enableAnimations ?? true}
              onThemeChange={handleThemeChange}
              onAnimationsToggle={handleAnimationsToggle}
            />
          )}

          {activeTab === "notifications" && (
            <NotificationsTab
              notifications={settings?.notifications || DEFAULT_NOTIFICATIONS}
              onToggle={handleNotificationToggle}
            />
          )}

          {activeTab === "integrations" && (
            <IntegrationsTab
              githubConnected={accountsQuery.data?.includes('github') ?? false}
              isGoogleConnected={accountsQuery.data?.includes('google') ?? false}
              isAmazonConnected={providersQuery.data?.some((p: any) => p.id === 'aws' && p.status === 'connected') ?? false}
              isMicrosoftConnected={accountsQuery.data?.includes('azure-ad') ?? false}
              slackAlerts={settings?.notifications?.slackNotifications || false}
              autoRebuild={settings?.autoRebuild ?? false}
              webhookConfigured={channelsQuery.data?.some((c: any) => c.type === 'slack' || c.type === 'webhook') ?? false}
              isTestingWebhook={isTestingWebhook}
              providers={providersQuery.data || []}
              isSyncingGitHub={isSyncingGitHub}
              isSyncingGoogle={isSyncingGoogle}
              isSyncingAmazon={isSyncingAmazon}
              isSyncingMicrosoft={isSyncingMicrosoft}
              onToggle={handleToggle}
              onTestWebhook={handleWebhookTest}
              onConnectGitHub={handleSyncGitHub}
              onToggleProvider={handleToggleProvider}
              onSyncGitHub={handleSyncGitHub}
              onSyncGoogle={handleSyncGoogle}
              onSyncAmazon={handleSyncAmazon}
              onSyncMicrosoft={handleSyncMicrosoft}
            />
          )}

          {activeTab === "billing" && (
            <BillingTab 
              costOverview={costQuery.data}
              recommendations={recommendationsQuery.data?.recommendations || []}
              budgetStatus={budgetQuery.data}
            />
          )}

          {activeTab === "security" && <SecurityTab />}
          {activeTab === "shortcuts" && <ShortcutsTab />}
          {activeTab === "domains" && <DomainsTab />}
          {activeTab === "members" && <MembersTab />}
          {activeTab === "webhooks" && <WebhooksTab />}
        </div>
      </div>
      <ConnectProviderModal
        provider={selectedProvider}
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnect={handleConnectProvider}
      />
    </AppShell>
  )
}
