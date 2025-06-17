"use client"
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
} from "lucide-react"
import { useUserSettings } from "@/hooks/useApi"
import { useToast } from "@/components/ui/toast"
import { LoadingButton } from "@/components/ui/loading-button"
import { useAppStore } from "@/lib/store"

export default function Settings() {
  const { data: settings, loading, updateSettings } = useUserSettings()
  const { isTestingWebhook, setTestingWebhook } = useAppStore()
  const { addToast, ToastContainer } = useToast()

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
      <div className="flex h-screen bg-[#0f0f0f]">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-0">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-gray-400">Loading settings...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0f0f0f]">
      <Sidebar />
      <ToastContainer />

      <div className="flex-1 flex flex-col lg:ml-0">
        <Header />

        <main className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <SettingsIcon className="w-8 h-8 text-accent" />
              <h1 className="text-3xl font-bold">Platform Settings</h1>
            </div>
            <p className="text-gray-400">Configure Supabase integrations and system preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI Features */}
            <div className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Brain className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-semibold">AI Features</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Slack Alerts</div>
                    <div className="text-xs text-gray-400">Get AI-powered alerts and summaries in Slack</div>
                  </div>
                  <button
                    onClick={() => handleToggle("slack_alerts", !settings?.slack_alerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings?.slack_alerts ? "bg-accent" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings?.slack_alerts ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Auto Rebuild</div>
                    <div className="text-xs text-gray-400">Automatically rebuild infrastructure on critical issues</div>
                  </div>
                  <button
                    onClick={() => handleToggle("auto_rebuild", !settings?.auto_rebuild)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings?.auto_rebuild ? "bg-accent" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings?.auto_rebuild ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Integrations */}
            <div className="glass-card p-6">
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
            </div>

            {/* Data Management */}
            <div className="glass-card p-6">
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
            </div>

            {/* Security & Access */}
            <div className="glass-card p-6">
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
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
