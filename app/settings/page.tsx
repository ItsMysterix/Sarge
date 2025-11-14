"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { SettingsIcon } from "lucide-react"
import { useUserSettings } from "@/hooks/useApi"
import { useToast } from "@/components/ui/toast"
import { useAppStore } from "@/lib/store"
import { motion } from "framer-motion"
import { useUserRole } from "@/hooks/useUserRole" // kept in case of future role-based gating
import { TabsNavigation, type SettingsTab } from "@/components/settings/tabs-navigation"
import { GeneralTab } from "@/components/settings/general-tab"
import { AppearanceTab } from "@/components/settings/appearance-tab"
import { NotificationsTab } from "@/components/settings/notifications-tab"
import { IntegrationsTab } from "@/components/settings/integrations-tab"
import { SecurityTab } from "@/components/settings/security-tab"
import { ShortcutsTab } from "@/components/settings/shortcuts-tab"
import { AppShell } from '@/components/layout/app-shell';
import { PageTitle } from '@/components/layout/page-title';
import { Settings as SettingsIconAlt } from 'lucide-react';

export default function Settings() {
  const { data: settings, loading, updateSettings } = useUserSettings()
  const { isTestingWebhook, setTestingWebhook } = useAppStore()
  const { addToast, ToastContainer } = useToast()
  const userRole = useUserRole()
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

  // Load settings on mount
  useEffect(() => {
    if (settings) {
      setEnableAnimations(settings.enable_animations ?? true)
      if (settings.notifications) {
        setNotifications({ ...notifications, ...settings.notifications })
      }
    }
  }, [settings])

  // Handler functions
  const handleToggle = async (key: "slack_alerts" | "auto_rebuild", value: boolean) => {
    try {
      await updateSettings({ [key]: value })
      addToast({
        type: "success",
        title: "Settings Updated",
        description: `${key.replace("_", " ")} ${value ? "enabled" : "disabled"}`,
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Update Failed",
        description: "Failed to update settings",
      })
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
    setEnableAnimations(enabled)
    try {
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
    const updated = { ...notifications, [key]: value }
    setNotifications(updated)
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
    addToast({ type: 'success', title: 'Settings Exported', description: 'Configuration downloaded successfully' })
  }

  const handleImportSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const text = await file.text()
        const data = JSON.parse(text)
        await updateSettings(data)
        addToast({ type: 'success', title: 'Settings Imported', description: 'Configuration restored successfully' })
      }
    }
    input.click()
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      addToast({ type: 'warning', title: 'Clear Data', description: 'This feature will be implemented soon' })
    }
  }

  if (loading) {
    return (
      <AppShell>
        <ToastContainer />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <motion.div
              className="rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
            <p className="text-gray-400">Loading settings...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <ToastContainer />
      <motion.main
        className="flex-1 p-6 overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Restored original styled header */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div>
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                <SettingsIconAlt className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent" />
              </motion.div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">Settings</h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-400">Application and environment settings</p>
          </div>
        </motion.div>

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
      </motion.main>
    </AppShell>
  )
}
