"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { SettingsIcon } from "lucide-react"
import { useUserSettings } from "@/hooks/useApi"
import { useToast } from "@/components/ui/toast"
import { useAppStore } from "@/lib/store"
import { motion } from "framer-motion"
import { useUserRole } from "@/hooks/useUserRole"
import { TabsNavigation, type SettingsTab } from "@/components/settings/tabs-navigation"
import { GeneralTab } from "@/components/settings/general-tab"
import { AppearanceTab } from "@/components/settings/appearance-tab"
import { NotificationsTab } from "@/components/settings/notifications-tab"
import { IntegrationsTab } from "@/components/settings/integrations-tab"
import { SecurityTab } from "@/components/settings/security-tab"
import { ShortcutsTab } from "@/components/settings/shortcuts-tab"

export default function Settings() {
  const { data: settings, loading, updateSettings } = useUserSettings()
  const { isTestingWebhook, setTestingWebhook } = useAppStore()
  const { addToast, ToastContainer } = useToast()
  const userRole = useUserRole()
  
  const [activeTab, setActiveTab] = useState<SettingsTab>("general")
  const [themeMode, setThemeMode] = useState<"dark" | "light" | "system">("dark")
  const [enableAnimations, setEnableAnimations] = useState(true)
  const [userName, setUserName] = useState("User")
  const [isEditingName, setIsEditingName] = useState(false)
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
      const savedTheme = (settings.theme_mode || "dark") as "dark" | "light" | "system"
      setThemeMode(savedTheme)
      setEnableAnimations(settings.enable_animations ?? true)
      if (settings.notifications) {
        setNotifications({ ...notifications, ...settings.notifications })
      }
      
      // Apply theme on load
      if (savedTheme === "system") {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        document.documentElement.classList.remove('dark', 'light')
        document.documentElement.classList.add(prefersDark ? 'dark' : 'light')
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = (e: MediaQueryListEvent) => {
          document.documentElement.classList.remove('dark', 'light')
          document.documentElement.classList.add(e.matches ? 'dark' : 'light')
        }
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      } else {
        document.documentElement.classList.remove('dark', 'light')
        document.documentElement.classList.add(savedTheme)
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
    setThemeMode(mode)
    
    if (mode === "system") {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.remove('dark', 'light')
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light')
    } else {
      document.documentElement.classList.remove('dark', 'light')
      document.documentElement.classList.add(mode)
    }
    
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

  const handleSaveName = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName }),
      })
      if (response.ok) {
        addToast({ type: 'success', title: 'Profile Updated', description: 'Name saved successfully' })
        setIsEditingName(false)
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Update Failed', description: 'Failed to update name' })
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0f0f0f]">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <motion.div 
                className="rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
              <p className="text-gray-400">Loading settings...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      <Sidebar />
      <ToastContainer />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <motion.main 
          className="flex-1 p-6 overflow-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Header */}
          <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="w-8 h-8 text-accent" />
              <h1 className="text-3xl font-bold">Settings</h1>
            </div>
            <p className="text-gray-400">
              Configure workspace, snapshots, integrations, and notifications
            </p>
          </motion.div>

          {/* Tabs Navigation */}
          <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          {activeTab === "general" && (
            <GeneralTab
              userName={userName}
              isEditingName={isEditingName}
              onNameChange={setUserName}
              onEditToggle={() => setIsEditingName(!isEditingName)}
              onSave={handleSaveName}
            />
          )}

          {activeTab === "appearance" && (
            <AppearanceTab
              themeMode={themeMode}
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
      </div>
    </div>
  )
}
