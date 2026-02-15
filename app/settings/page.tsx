"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useUserSettings } from "@/hooks/useApi"
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
import { AppShell } from '@/components/layout/app-shell'
import { Settings as SettingsIcon, Loader2 } from 'lucide-react'

export default function Settings() {
  const { data: settings, loading, updateSettings } = useUserSettings()
  const { isTestingWebhook, setTestingWebhook } = useAppStore()
  const { addToast, ToastContainer } = useToast()
  const { theme, setTheme } = useTheme()

  const [activeTab, setActiveTab] = useState<SettingsTab>("general")
  const [enableAnimations, setEnableAnimations] = useState(true)
  const [notifications, setNotifications] = useState({
    deploySuccess: true,
    deployFailure: true,
    serviceDown: true,
    highCpu: true,
    highMemory: false,
    securityAlerts: true,
    emailNotifications: false,
    slackNotifications: true,
  })

  useEffect(() => {
    if (settings) {
      setEnableAnimations(settings.enable_animations ?? true)
      if (settings.notifications) {
        setNotifications({ ...notifications, ...settings.notifications })
      }
    }
  }, [settings])

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
    } catch {
      addToast({ type: "error", title: "Update Failed", description: "Failed to update theme" })
    }
  }

  const handleAnimationsToggle = async (enabled: boolean) => {
    setEnableAnimations(enabled)
    try {
      await updateSettings({ enable_animations: enabled })
      addToast({
        type: "success",
        title: "Animations Updated",
        description: `Animations ${enabled ? "enabled" : "disabled"}`,
      })
    } catch {
      addToast({ type: "error", title: "Update Failed", description: "Failed to update animations" })
    }
  }

  const handleNotificationToggle = async (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value }
    setNotifications(updated)
    try {
      await updateSettings({ notifications: updated })
      addToast({
        type: "success",
        title: "Notification Updated",
        description: `${key} notifications ${value ? "enabled" : "disabled"}`,
      })
    } catch {
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
    } catch {
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
          addToast({ type: 'error', title: 'Import Failed', description: 'Failed to import settings. Invalid file or data.' })
          console.error(error)
        }
      }
    }
    input.click()
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      addToast({ type: 'warning', title: 'Clear Data', description: 'This feature will be implemented soon' })
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <ToastContainer />
      <main className="flex-1 p-6 max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="w-6 h-6 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage your project configuration and preferences</p>
        </div>

        {/* Tabs Navigation */}
        <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === "general" && (
          <GeneralTab
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
            enableAnimations={enableAnimations}
            onThemeChange={handleThemeChange}
            onAnimationsToggle={handleAnimationsToggle}
          />
        )}

        {activeTab === "notifications" && (
          <NotificationsTab
            notifications={notifications}
            onToggle={handleNotificationToggle}
          />
        )}

        {activeTab === "integrations" && (
          <IntegrationsTab
            slackAlerts={settings?.slack_alerts ?? false}
            autoRebuild={settings?.auto_rebuild ?? false}
            webhookConfigured={true}
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
      </main>
    </AppShell>
  )
}
