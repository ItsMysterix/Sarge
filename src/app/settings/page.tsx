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
      // Disconnect immediately (clears credentials on backend)
      toggleProviderMutation.mutate({
        providerId,
        projectSlug: currentProject?.slug || 'global',
        status: 'disconnected'
      })
    } else {
      // Open modal to collect credentials
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

  const handleExportSettings = () => {}
  const handleImportSettings = () => {}
  const handleClearData = async () => {
    if (confirm('Clear all data?')) clearDataMutation.mutate()
  }

  if (loading || (activeTab === 'integrations' && providersQuery.isLoading)) {
    return (
      <AppShell>
        <LoadingScreen title="Synchronizing Preferences" subtitle="Restoring your configuration..." />
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Settings">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
             <SettingsIcon className="w-6 h-6 text-error" />
          </div>
          <p className="text-sm font-medium">Failed to load settings</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-xs text-accent hover:underline"
          >
            Retry Connection
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Settings">
      <ToastContainer />
      <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
        <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-10">
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
              slackAlerts={settings?.slackAlerts ?? false}
              autoRebuild={settings?.autoRebuild ?? false}
              webhookConfigured={channelsQuery.data?.some((c: any) => c.type === 'slack' || c.type === 'webhook') ?? false}
              isTestingWebhook={isTestingWebhook}
              providers={providersQuery.data || []}
              onToggle={handleToggle}
              onTestWebhook={handleWebhookTest}
              onConnectGitHub={() => {
                // In a real app, this would start the OAuth flow or redirect to account settings
                addToast({ type: "info", title: "GitHub", description: "GitHub linkage is managed via your Auth account." })
              }}
              onToggleProvider={handleToggleProvider}
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
