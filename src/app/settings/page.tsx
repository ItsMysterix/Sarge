"use client"

import { useState, useEffect } from "react"
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
import { GridLoader } from "@/components/ui/grid-loader"

export default function Settings() {
  const { data: settings, loading, error, updateSettings } = useUserSettings()
  const { isTestingWebhook, setTestingWebhook } = useAppStore()
  const { addToast, ToastContainer } = useToast()
  const { theme, setTheme } = useTheme()
  const { currentProject } = useProject()
  const t = trpc as any

  // ... (rest of the intermediate code)

  if (loading || (activeTab === 'integrations' && providersQuery.isLoading)) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <GridLoader />
          <p className="text-xs text-muted-foreground animate-pulse">Synchronizing preferences...</p>
        </div>
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
      <main className="flex-1 p-6 max-w-6xl mx-auto animate-fade-in">
        <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-8">
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
      </main>
      <ConnectProviderModal
        provider={selectedProvider}
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnect={handleConnectProvider}
      />
    </AppShell>
  )
}
