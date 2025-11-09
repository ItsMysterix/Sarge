"use client"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import {
  Github,
  MessageSquare,
  Brain,
  Shield,
  Database,
  CheckCircle,
  AlertTriangle,
  SettingsIcon,
  Zap,
  Bell,
  Palette,
  Keyboard,
  Download,
  Upload,
  User,
  Mail,
  Lock,
  Moon,
  Sun,
  Monitor,
} from "lucide-react"
import { useUserSettings } from "@/hooks/useApi"
import { useToast } from "@/components/ui/toast"
import { LoadingButton } from "@/components/ui/loading-button"
import { useAppStore } from "@/lib/store"
import { motion, AnimatePresence } from "framer-motion"
import { AnimationErrorBoundary } from "@/components/ui/animation-error-boundary"
import { useUserRole } from "@/hooks/useUserRole"

type Tab = "general" | "notifications" | "appearance" | "shortcuts" | "integrations" | "security";

export default function Settings() {
  const { data: settings, loading, updateSettings } = useUserSettings()
  const { isTestingWebhook, setTestingWebhook } = useAppStore()
  const { addToast, ToastContainer } = useToast()
  const userRole = useUserRole()
  const [activeTab, setActiveTab] = useState<Tab>("general")
  const [themeMode, setThemeMode] = useState<"dark" | "light" | "auto">("dark")
  const [enableAnimations, setEnableAnimations] = useState(true)
  const [userName, setUserName] = useState("")
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
      setThemeMode(settings.theme_mode || "dark")
      setEnableAnimations(settings.enable_animations ?? true)
      if (settings.notifications) {
        setNotifications({ ...notifications, ...settings.notifications })
      }
    }
  }, [settings])

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
    { id: "integrations", label: "Integrations", icon: Zap },
    { id: "security", label: "Security", icon: Shield },
  ];

  const handleToggle = async (key: "slack_alerts" | "auto_rebuild" | "enable_animations", value: boolean) => {
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
        description: error instanceof Error ? error.message : "Failed to update settings",
      })
    }
  }

  const handleThemeChange = async (mode: "dark" | "light" | "auto") => {
    setThemeMode(mode)
    try {
      await updateSettings({ theme_mode: mode })
      addToast({
        type: "success",
        title: "Theme Updated",
        description: `Theme set to ${mode} mode`,
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Update Failed",
        description: "Failed to update theme",
      })
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
      addToast({
        type: "error",
        title: "Update Failed",
        description: "Failed to update notifications",
      })
    }
  }

  const handleExportSettings = async () => {
    try {
      addToast({ 
        type: "info", 
        title: "Exporting Data...", 
        description: "Preparing your data export" 
      })
      
      const response = await fetch('/api/data/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sarge-export-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        addToast({ 
          type: "success", 
          title: "Export Complete", 
          description: "Your data has been downloaded" 
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      addToast({ 
        type: "error", 
        title: "Export Failed", 
        description: "Could not export settings" 
      })
    }
  }

  const handleImportSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e: any) => {
      try {
        const file = e.target.files[0]
        if (file) {
          const text = await file.text()
          const data = JSON.parse(text)
          
          // Import settings
          if (data.settings) {
            await updateSettings(data.settings)
          }
          
          addToast({ 
            type: "success", 
            title: "Import Complete", 
            description: "Settings imported successfully" 
          })
        }
      } catch (error) {
        addToast({ 
          type: "error", 
          title: "Import Failed", 
          description: "Invalid settings file" 
        })
      }
    }
    input.click()
  }

  const handleWebhookTest = async () => {
    setTestingWebhook(true)
    try {
      const response = await fetch("/api/slack/test", {
        method: "POST",
      })

      const result = await response.json()

      addToast({
        type: result.success ? "success" : "error",
        title: result.success ? "Webhook Test Successful" : "Webhook Test Failed",
        description: result.message,
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Webhook Test Error",
        description: "Failed to test webhook",
      })
    } finally {
      setTestingWebhook(false)
    }
  }

  if (loading) {
    return (
      <AnimationErrorBoundary fallbackType="auto" userRole={userRole}>
        <div className="flex h-screen bg-[#0f0f0f]">
          <Sidebar />
          <div className="flex-1 flex flex-col lg:ml-0">
            <Header />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <motion.div 
                  className="rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
                <motion.p 
                  className="text-gray-400"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  Loading settings...
                </motion.p>
              </div>
            </main>
          </div>
        </div>
      </AnimationErrorBoundary>
    )
  }

  return (
    <AnimationErrorBoundary fallbackType="auto" userRole={userRole}>
      <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
        <Sidebar />
        <ToastContainer />

        <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
          <Header />

          <motion.main 
            className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <motion.div 
              className="mb-4 sm:mb-6 md:mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-2">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.6 }}>
                    <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
                  </motion.div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Settings</h1>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <motion.button
                    className="px-3 sm:px-4 py-2 glass-card border border-accent/20 text-accent hover:bg-accent/10 rounded-lg text-xs sm:text-sm flex items-center space-x-2 flex-1 sm:flex-none justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExportSettings}
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Export</span>
                  </motion.button>
                  <motion.button
                    className="px-3 sm:px-4 py-2 glass-card border border-accent/20 text-accent hover:bg-accent/10 rounded-lg text-xs sm:text-sm flex items-center space-x-2 flex-1 sm:flex-none justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleImportSettings}
                  >
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Import</span>
                  </motion.button>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-400">Configure workspace, snapshots, integrations, and notifications</p>
              
              {/* Tabs */}
              <motion.div 
                className="flex space-x-1 sm:space-x-2 mt-4 sm:mt-6 overflow-x-auto scrollbar-hide pb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {tabs.map((tab, i) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${
                        activeTab === tab.id
                          ? "bg-accent/20 text-accent border border-accent/30"
                          : "glass-card hover:bg-white/10 text-gray-400"
                      }`}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{tab.label}</span>
                    </motion.button>
                  );
                })}
              </motion.div>
            </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === "general" && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8"
              >
                {/* Existing content - AI Features & Integrations */}
                <motion.div 
                  className="glass-card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  whileHover={{ scale: 1.01, y: -5 }}
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                      <Brain className="w-6 h-6 text-accent" />
                    </motion.div>
                    <h2 className="text-xl font-semibold">AI Features</h2>
                  </div>

                  <div className="space-y-4">
                    <motion.div 
                      className="flex items-center justify-between p-3 glass-card rounded-lg"
                      whileHover={{ scale: 1.02, x: 5 }}
                    >
                      <div>
                        <div className="font-medium text-sm">Slack Alerts</div>
                        <div className="text-xs text-gray-400">Get AI-powered alerts and summaries in Slack</div>
                      </div>
                      <motion.button
                        onClick={() => handleToggle("slack_alerts", !settings?.slack_alerts)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings?.slack_alerts ? "bg-accent" : "bg-gray-600"
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings?.slack_alerts ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </motion.button>
                    </motion.div>

                    <motion.div 
                      className="flex items-center justify-between p-3 glass-card rounded-lg"
                      whileHover={{ scale: 1.02, x: 5 }}
                    >
                      <div>
                        <div className="font-medium text-sm">Auto Rebuild</div>
                        <div className="text-xs text-gray-400">Automatically rebuild infrastructure on critical issues</div>
                      </div>
                      <motion.button
                        onClick={() => handleToggle("auto_rebuild", !settings?.auto_rebuild)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings?.auto_rebuild ? "bg-accent" : "bg-gray-600"
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings?.auto_rebuild ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </motion.button>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-center justify-between p-3 glass-card rounded-lg"
                      whileHover={{ scale: 1.02, x: 5 }}
                    >
                      <div>
                        <div className="font-medium text-sm">Enable Animations</div>
                        <div className="text-xs text-gray-400">Show smooth transitions and effects</div>
                      </div>
                      <motion.button
                        onClick={async () => {
                          const newValue = !enableAnimations
                          setEnableAnimations(newValue)
                          await handleToggle("enable_animations", newValue)
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          enableAnimations ? "bg-accent" : "bg-gray-600"
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            enableAnimations ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>

            {/* Integrations */}
            <motion.div 
              className="glass-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.01, y: -5 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Zap className="w-6 h-6 text-warning" />
                <h2 className="text-xl font-semibold">System Integrations</h2>
              </div>

              <div className="space-y-4">
                <GitHubRepositoryConnect />

                <div className="p-4 glass-card rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="w-6 h-6 text-accent" />
                      <div>
                        <h3 className="font-medium text-sm">Slack Notifications</h3>
                        <div className="text-xs text-gray-400">Get alerts and summaries</div>
                      </div>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  </div>
                  <div className="text-xs text-gray-400 mb-3">Webhook endpoint configured</div>
                  <LoadingButton
                    loading={isTestingWebhook}
                    loadingText="Testing..."
                    onClick={handleWebhookTest}
                    className="w-full py-2 px-3 bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 text-xs rounded transition-colors"
                  >
                    Test Webhook
                  </LoadingButton>
                </div>
              </div>
            </motion.div>

            {/* Data Management */}
            <motion.div 
              className="glass-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.01, y: -5 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Database className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-semibold">Data Management</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 glass-card rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Supabase Connection</span>
                    <span className="text-xs text-success">Connected</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-3">Real-time data sync active</div>
                  <button className="text-xs text-accent hover:text-accent/80 transition-colors">View Tables →</button>
                </div>

                <div className="p-4 glass-card rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Data Retention</span>
                    <span className="text-xs text-warning">90 days</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-3">Logs and metrics retention period</div>
                  <button className="text-xs text-accent hover:text-accent/80 transition-colors">Configure →</button>
                </div>

                <div className="p-4 glass-card rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Export Data</span>
                    <span className="text-xs text-gray-400">Available</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-3">Download all processed insights</div>
                  <button className="text-xs text-accent hover:text-accent/80 transition-colors">Export →</button>
                </div>
              </div>
            </motion.div>

            {/* Security */}
            <motion.div 
              className="glass-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.01, y: -5 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="w-6 h-6 text-success" />
                <h2 className="text-xl font-semibold">Security & Access</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 glass-card rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Dev Mode</span>
                    <span className="text-xs text-warning">Active</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-3">Using dev-mode user ID for all operations</div>
                  <button className="text-xs text-accent hover:text-accent/80 transition-colors">
                    Configure Auth →
                  </button>
                </div>

                <div className="p-4 glass-card rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">API Access</span>
                    <span className="text-xs text-success">Secured</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-3">Supabase RLS policies active</div>
                  <button className="text-xs text-accent hover:text-accent/80 transition-colors">
                    View Policies →
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === "notifications" && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <motion.div
                  key={key}
                  className="flex items-center justify-between p-3 glass-card rounded-lg"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div>
                    <div className="font-medium text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div className="text-xs text-gray-400">Receive notifications for {key}</div>
                  </div>
                  <motion.button
                    onClick={() => handleNotificationToggle(key, !value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? "bg-accent" : "bg-gray-600"
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        value ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "appearance" && (
          <motion.div
            key="appearance"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-semibold mb-6">Appearance Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-3 block">Theme Mode</label>
                <div className="flex space-x-2">
                  {[
                    { id: "dark" as const, label: "Dark", icon: Moon },
                    { id: "light" as const, label: "Light", icon: Sun },
                    { id: "auto" as const, label: "Auto", icon: Monitor },
                  ].map((theme) => {
                    const Icon = theme.icon;
                    return (
                      <motion.button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`flex-1 p-3 rounded-lg border transition-all ${
                          themeMode === theme.id
                            ? "bg-accent/20 border-accent/30 text-accent"
                            : "glass-card border-white/10 hover:border-accent/20"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-2" />
                        <div className="text-sm">{theme.label}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              <div className="p-4 glass-card rounded-lg">
                <p className="text-sm text-gray-400">Currently using: <span className="text-accent font-medium">Cyberpunk DevOps Theme</span></p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Other tabs show a placeholder */}
        {activeTab === "shortcuts" && (
          <motion.div
            key="shortcuts"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-semibold mb-6">Keyboard Shortcuts</h2>
            <div className="space-y-3">
              {[
                { action: "Quick Deploy", shortcut: "Ctrl+D", description: "Deploy current configuration" },
                { action: "Open Metrics", shortcut: "Ctrl+M", description: "View metrics dashboard" },
                { action: "View Logs", shortcut: "Ctrl+L", description: "Open logs viewer" },
                { action: "Settings", shortcut: "Ctrl+,", description: "Open settings panel" },
                { action: "Search", shortcut: "Ctrl+K", description: "Global search" },
                { action: "Command Palette", shortcut: "Ctrl+P", description: "Open command palette" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center justify-between p-3 glass-card rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div>
                    <div className="font-medium text-sm">{item.action}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                  <kbd className="px-2 py-1 text-xs font-mono bg-black/40 border border-white/20 rounded">
                    {item.shortcut}
                  </kbd>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "integrations" && (
          <motion.div
            key="integrations"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* GitHub Integration */}
            <motion.div className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Github className="w-6 h-6 text-accent" />
                <h3 className="text-lg font-semibold">GitHub</h3>
              </div>
              <GitHubRepositoryConnect />
            </motion.div>

            {/* Slack Integration */}
            <motion.div className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <MessageSquare className="w-6 h-6 text-accent" />
                <h3 className="text-lg font-semibold">Slack</h3>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-400">Get notifications and alerts in Slack</div>
                <div className="flex items-center justify-between p-2 glass-card rounded">
                  <span className="text-sm">Status</span>
                  <span className="text-xs text-warning">Configured</span>
                </div>
                <LoadingButton
                  loading={isTestingWebhook}
                  loadingText="Testing..."
                  onClick={handleWebhookTest}
                  className="w-full py-2 px-3 bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 text-sm rounded transition-colors"
                >
                  Test Webhook
                </LoadingButton>
              </div>
            </motion.div>

            {/* Add more integrations */}
            <motion.div className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Database className="w-6 h-6 text-info" />
                <h3 className="text-lg font-semibold">Database</h3>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-400">PostgreSQL (Neon) connection</div>
                <div className="flex items-center justify-between p-2 glass-card rounded">
                  <span className="text-sm">Status</span>
                  <span className="text-xs text-success">Connected</span>
                </div>
                <button className="w-full py-2 px-3 glass-card hover:bg-white/10 text-sm rounded transition-colors">
                  View Connection Details
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === "security" && (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Authentication */}
            <motion.div className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="w-6 h-6 text-accent" />
                <h3 className="text-lg font-semibold">Authentication</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Auth Provider</div>
                    <div className="text-xs text-gray-400">Auth.js with GitHub OAuth</div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Session Type</div>
                    <div className="text-xs text-gray-400">JWT (JSON Web Tokens)</div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
              </div>
            </motion.div>

            {/* API Security */}
            <motion.div className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-success" />
                <h3 className="text-lg font-semibold">API Security</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Database RLS</div>
                    <div className="text-xs text-gray-400">Row-Level Security policies active</div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div>
                    <div className="font-medium text-sm">tRPC Server</div>
                    <div className="text-xs text-gray-400">WebSocket server secured</div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
              </div>
            </motion.div>

            {/* Data Management */}
            <motion.div className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Database className="w-6 h-6 text-warning" />
                <h3 className="text-lg font-semibold">Data Management</h3>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={handleExportSettings}
                  className="w-full p-3 glass-card hover:bg-accent/10 rounded-lg text-left transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm group-hover:text-accent transition-colors">Export All Data</div>
                      <div className="text-xs text-gray-400">Download settings, deployments, metrics, and logs</div>
                    </div>
                    <Download className="w-4 h-4 text-accent" />
                  </div>
                </button>
                <div className="p-3 glass-card rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">Data Retention</div>
                    <span className="text-xs text-warning">90 days</span>
                  </div>
                  <div className="text-xs text-gray-400">Logs and metrics automatically cleaned after retention period</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </motion.main>
      </div>
    </div>
    </AnimationErrorBoundary>
  )
}

function GitHubRepositoryConnect() {
  const [repository, setRepository] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [owner, setOwner] = useState("")
  const [repo, setRepo] = useState("")
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    fetchRepository()
  }, [])

  const fetchRepository = async () => {
    try {
      const res = await fetch('/api/repository')
      const data = await res.json()
      if (data.repository) {
        setRepository(data.repository)
        setOwner(data.repository.owner)
        setRepo(data.repository.repo)
      }
    } catch (error) {
      console.error('Error fetching repository:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!owner || !repo) return
    
    setConnecting(true)
    try {
      const res = await fetch('/api/repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, description: `${owner}/${repo}` })
      })

      if (res.ok) {
        const data = await res.json()
        setRepository(data.repository)
        alert('Repository connected successfully!')
      } else {
        alert('Failed to connect repository')
      }
    } catch (error) {
      console.error('Error connecting repository:', error)
      alert('Error connecting repository')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect this repository?')) return
    
    try {
      const res = await fetch('/api/repository', { method: 'DELETE' })
      if (res.ok) {
        setRepository(null)
        setOwner("")
        setRepo("")
        alert('Repository disconnected')
      }
    } catch (error) {
      console.error('Error disconnecting repository:', error)
    }
  }

  if (loading) {
    return <div className="p-4 glass-card rounded-lg text-center text-gray-400">Loading...</div>
  }

  return (
    <div className="p-4 glass-card rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Github className="w-6 h-6 text-accent" />
          <div>
            <h3 className="font-medium text-sm">GitHub Repository</h3>
            <div className="text-xs text-gray-400">Connect to track deployments and activity</div>
          </div>
        </div>
        {repository && <CheckCircle className="w-4 h-4 text-success" />}
      </div>

      {repository ? (
        <>
          <div className="text-xs text-gray-400 mb-3">Connected to {repository.full_name}</div>
          <button 
            onClick={handleDisconnect}
            className="w-full py-2 px-3 glass-card text-xs hover:bg-error/10 hover:text-error transition-colors rounded"
          >
            Disconnect
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-gray-400 mb-2">Enter repository details (e.g., owner: "facebook", repo: "react")</div>
          <input
            type="text"
            placeholder="Owner (e.g., facebook)"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-sm focus:border-accent/50 outline-none"
          />
          <input
            type="text"
            placeholder="Repository (e.g., react)"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-sm focus:border-accent/50 outline-none"
          />
          <button 
            onClick={handleConnect}
            disabled={connecting || !owner || !repo}
            className="w-full py-2 px-3 bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? 'Connecting...' : 'Connect Repository'}
          </button>
        </div>
      )}
    </div>
  )
}
