"use client"
import { useState } from "react"
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

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
    { id: "integrations", label: "Integrations", icon: Zap },
    { id: "security", label: "Security", icon: Shield },
  ];

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
        description: error instanceof Error ? error.message : "Failed to update settings",
      })
    }
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
                    onClick={() => addToast({ type: "success", title: "Settings Exported", description: "Settings downloaded successfully" })}
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Export</span>
                  </motion.button>
                  <motion.button
                    className="px-3 sm:px-4 py-2 glass-card border border-accent/20 text-accent hover:bg-accent/10 rounded-lg text-xs sm:text-sm flex items-center space-x-2 flex-1 sm:flex-none justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToast({ type: "info", title: "Import Settings", description: "Choose a settings file to import" })}
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
                        onClick={() => {
                          setEnableAnimations(!enableAnimations);
                          addToast({ type: "success", title: "Animations " + (!enableAnimations ? "enabled" : "disabled") });
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
                <div className="p-4 glass-card rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Github className="w-6 h-6 text-accent" />
                      <div>
                        <h3 className="font-medium text-sm">GitHub Repository</h3>
                        <div className="text-xs text-gray-400">Connected to deployment tracking</div>
                      </div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div className="text-xs text-gray-400 mb-3">Connected to sarge-app/main</div>
                  <button className="w-full py-2 px-3 glass-card text-xs hover:bg-white/10 transition-colors rounded">
                    Configure
                  </button>
                </div>

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
                    onClick={() => setNotifications({ ...notifications, [key]: !value })}
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
                      <button
                        key={theme.id}
                        onClick={() => setThemeMode(theme.id)}
                        className={`flex-1 p-3 rounded-lg border transition-all ${
                          themeMode === theme.id
                            ? "bg-accent/20 border-accent/30 text-accent"
                            : "glass-card border-white/10 hover:border-accent/20"
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-2" />
                        <div className="text-sm">{theme.label}</div>
                      </button>
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
        {["shortcuts", "integrations", "security"].includes(activeTab) && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-semibold mb-4 capitalize">{activeTab} Settings</h2>
            <p className="text-gray-400">Advanced {activeTab} configuration coming soon...</p>
          </motion.div>
        )}
      </AnimatePresence>
        </motion.main>
      </div>
    </div>
    </AnimationErrorBoundary>
  )
}
