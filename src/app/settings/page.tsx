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
import { SecurityTab } from "@/components/settings/security-tab"
import { ShortcutsTab } from "@/components/settings/shortcuts-tab"
import { VariablesTab } from "@/components/settings/variables-tab"
import { TargetsTab } from "@/components/settings/targets-tab"
import { DomainsTab } from "@/components/settings/domains-tab"
import { MembersTab } from "@/components/settings/members-tab"
import { WebhooksTab } from "@/components/settings/webhooks-tab"
import { AppShell } from '@/components/layout/app-shell'
import { Settings as SettingsIcon } from 'lucide-react'
import posthog from 'posthog-js'
import { GridLoader } from "@/components/ui/grid-loader"

export default function Settings() {
  const { data: settings, loading, updateSettings } = useUserSettings()
  const { isTestingWebhook, setTestingWebhook } = useAppStore()
  const { addToast, ToastContainer } = useToast()
  const { theme, setTheme } = useTheme()
  const { currentProject } = useProject()
  const t = trpc as any

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

  const channelsQuery = t.alerts?.listChannels?.useQuery(
    { projectId: currentProject?.id },
    { enabled: !!currentProject?.id }
  )
  const webhookConfigured = channelsQuery?.data?.some((c: any) => c.type === 'webhook' || c.type === 'slack' || c.type === 'discord') || false

  const [activeTab, setActiveTab] = useState<SettingsTab>("general")

  const clearDataMutation = t.settings.clearData.useMutation({
    onSuccess: () => {
      addToast({ type: "success", title: "Data Cleared", description: "All system logs and metrics have been removed." })
    },
    onError: (err: any) => {
      addToast({ type: "error", title: "Action Failed", description: err.message })
    }
  })

  const handleToggle = async (key: "slack_alerts" | "auto_rebuild", value: boolean) => {
    try {
      await updateSettings({ [key]: value })
      addToast({
        type: "success",
        title: "Settings Updated",
        description: `${key.replace("_", " ")} ${value ? "enabled" : "disabled"}`,
      })
    } catch (error) {
      addToast({ type: "error", title: "Update Failed", description: "Failed to update settings" })
    }
  }

  const handleThemeChange = async (mode: "dark" | "light" | "system") => {
    setTheme(mode)
    try {
      await updateSettings({ theme_mode: mode as any })
      addToast({
        type: "success",
        title: "Theme Updated",
        description: mode === "system" ? "Following system preferences" : `${mode} mode enabled`,
      })
    } catch (error) {
      addToast({ type: "error", title: "Update Failed", description: "Failed to update theme" })
    }
  }

  const handleAnimationsToggle = async (enabled: boolean) => {
    try {
      posthog.setPersonProperties({ 'enable-animations': enabled })
      posthog.capture('set_animations', { enabled })
      await updateSettings({ enable_animations: enabled })
      addToast({
        type: "success",
        title: "Animations Updated",
        description: `Animations ${enabled ? "enabled" : "disabled"}`,
      })
    } catch (error) {
      addToast({ type: "error", title: "Update Failed", description: "Failed to update animations" })
    }
  }

  const handleNotificationToggle = async (key: string, value: boolean) => {
    const updated = { ...(settings?.notifications || DEFAULT_NOTIFICATIONS), [key]: value }
    try {
      await updateSettings({ notifications: updated })
      addToast({
        type: "success",
        title: "Notification Updated",
        description: `${key} notifications ${value ? "enabled" : "disabled"}`,
      })
    } catch (error) {
      addToast({ type: "error", title: "Update Failed", description: "Failed to update notifications" })
    }
  }

  const handleWebhookTest = async () => {
    setTestingWebhook(true)
    try {
      const response = await fetch("/api/slack/test", { method: "POST" })
      const result = await response.json()
      addToast({
        type: result.success ? "success" : "error",
        title: result.success ? "Webhook Test Successful" : "Webhook Test Failed",
        description: result.message,
      })
    } catch (error) {
      addToast({ type: "error", title: "Webhook Test Error", description: "Failed to test webhook" })
    } finally {
      setTestingWebhook(false)
    }
  }

  const handleExportSettings = () => {
    const data = JSON.stringify(settings, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sarge-settings.json'
    a.click()
    addToast({ type: 'success', title: 'Settings Exported', description: 'Configuration downloaded' })
  }

  const handleImportSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const text = await file.text()
          const data = JSON.parse(text)
          await updateSettings(data)
          addToast({ type: 'success', title: 'Settings Imported', description: 'Configuration restored' })
        } catch (error) {
          addToast({ type: 'error', title: 'Import Failed', description: 'Failed to import settings.' })
        }
      }
    }
    input.click()
  }

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearDataMutation.mutate()
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center p-6">
          <GridLoader className="w-6 h-6 text-muted-foreground" />
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
          {activeTab === "targets" && <TargetsTab />}

          {activeTab === "appearance" && (
            <AppearanceTab
              themeMode={(theme as "dark" | "light" | "system") || "dark"}
              enableAnimations={settings?.enable_animations ?? true}
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
              slackAlerts={settings?.slack_alerts ?? false}
              autoRebuild={settings?.auto_rebuild ?? false}
              webhookConfigured={webhookConfigured}
              isTestingWebhook={isTestingWebhook}
              onToggle={handleToggle}
              onTestWebhook={handleWebhookTest}
              onConnectGitHub={() => {
                addToast({ type: "info", title: "GitHub", description: "Repository management coming soon" })
              }}
            />
          )}

          {activeTab === "security" && <SecurityTab />}
          {activeTab === "shortcuts" && <ShortcutsTab />}
          {activeTab === "domains" && <DomainsTab />}
          {activeTab === "members" && <MembersTab />}
          {activeTab === "webhooks" && <WebhooksTab />}
        </div>
      </main>
    </AppShell>
  )
}
