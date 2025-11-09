"use client"

import { motion } from "framer-motion"
import { Github, MessageSquare, Brain, Database, CheckCircle, AlertTriangle, Zap } from "lucide-react"
import { LoadingButton } from "@/components/ui/loading-button"

interface IntegrationsTabProps {
  slackAlerts: boolean
  autoRebuild: boolean
  webhookConfigured: boolean
  isTestingWebhook: boolean
  onToggle: (key: "slack_alerts" | "auto_rebuild", value: boolean) => Promise<void>
  onTestWebhook: () => Promise<void>
  onConnectGitHub: () => void
}

export function IntegrationsTab({
  slackAlerts,
  autoRebuild,
  webhookConfigured,
  isTestingWebhook,
  onToggle,
  onTestWebhook,
  onConnectGitHub
}: IntegrationsTabProps) {
  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`
        relative w-12 h-6 rounded-full transition-colors
        ${enabled ? 'bg-accent' : 'bg-white/10'}
      `}
    >
      <div
        className={`
          absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
          ${enabled ? 'translate-x-7' : 'translate-x-1'}
        `}
      />
    </button>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* AI Features */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">AI Features</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div>
              <div className="font-medium">Slack Alerts</div>
              <div className="text-sm text-gray-400">Get AI-powered alerts and summaries in Slack</div>
            </div>
            <Toggle 
              enabled={slackAlerts} 
              onChange={() => onToggle('slack_alerts', !slackAlerts)}
            />
          </div>

          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div>
              <div className="font-medium">Auto Rebuild</div>
              <div className="text-sm text-gray-400">Automatically rebuild infrastructure on critical issues</div>
            </div>
            <Toggle 
              enabled={autoRebuild} 
              onChange={() => onToggle('auto_rebuild', !autoRebuild)}
            />
          </div>
        </div>
      </div>

      {/* System Integrations */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">System Integrations</h3>
        </div>
        
        <div className="space-y-4">
          {/* GitHub */}
          <div className="p-4 glass-card rounded border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Github className="w-5 h-5 text-white" />
                <div>
                  <div className="font-medium">GitHub Repository</div>
                  <div className="text-sm text-gray-400">Connect to track deployments and activity</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-xs text-success">Connected</span>
              </div>
            </div>
            <button 
              onClick={onConnectGitHub}
              className="w-full px-4 py-2 glass-card border border-white/10 hover:bg-white/5 rounded transition-colors text-sm"
            >
              Manage Repository
            </button>
          </div>

          {/* Slack */}
          <div className="p-4 glass-card rounded border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="font-medium">Slack Notifications</div>
                  <div className="text-sm text-gray-400">Get alerts and summaries</div>
                </div>
              </div>
              {webhookConfigured ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-xs text-success">Configured</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-xs text-warning">Not configured</span>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-400 mb-3">
              Webhook endpoint configured
            </div>
            <LoadingButton
              onClick={onTestWebhook}
              loading={isTestingWebhook}
              className="w-full px-4 py-2 glass-card border border-white/10 hover:bg-white/5 rounded transition-colors text-sm"
            >
              Test Webhook
            </LoadingButton>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="glass-card p-6 border border-white/10 opacity-50">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold">More Integrations</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Jira', 'PagerDuty', 'Datadog', 'New Relic'].map((name) => (
            <div key={name} className="p-4 glass-card rounded border border-white/10">
              <div className="font-medium mb-1">{name}</div>
              <div className="text-xs text-gray-500">Coming soon</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
