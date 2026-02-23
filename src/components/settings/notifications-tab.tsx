"use client"

import { motion } from "framer-motion"
import { Bell, Mail, MessageSquare, AlertTriangle } from "lucide-react"
import { Toggle } from "./toggle"

interface NotificationsTabProps {
  notifications: {
    deploySuccess: boolean
    deployFailure: boolean
    serviceDown: boolean
    highCpu: boolean
    highMemory: boolean
    securityAlerts: boolean
    emailNotifications: boolean
    slackNotifications: boolean
  }
  onToggle: (key: string, value: boolean) => void
}

export function NotificationsTab({ notifications, onToggle }: NotificationsTabProps) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Alert Notifications */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Alert Notifications</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div>
              <div className="font-medium">Deployment Success</div>
              <div className="text-sm text-gray-400">Notify when deployments complete successfully</div>
            </div>
            <Toggle 
              enabled={notifications.deploySuccess} 
              onChange={() => onToggle('deploySuccess', !notifications.deploySuccess)}
            />
          </div>

          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div>
              <div className="font-medium">Deployment Failure</div>
              <div className="text-sm text-gray-400">Alert when deployments fail</div>
            </div>
            <Toggle 
              enabled={notifications.deployFailure} 
              onChange={() => onToggle('deployFailure', !notifications.deployFailure)}
            />
          </div>

          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div>
              <div className="font-medium">Service Down</div>
              <div className="text-sm text-gray-400">Alert when services become unavailable</div>
            </div>
            <Toggle 
              enabled={notifications.serviceDown} 
              onChange={() => onToggle('serviceDown', !notifications.serviceDown)}
            />
          </div>
        </div>
      </div>

      {/* Performance Alerts */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h3 className="text-lg font-semibold">Performance Alerts</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div>
              <div className="font-medium">High CPU Usage</div>
              <div className="text-sm text-gray-400">Alert when CPU exceeds 80%</div>
            </div>
            <Toggle 
              enabled={notifications.highCpu} 
              onChange={() => onToggle('highCpu', !notifications.highCpu)}
            />
          </div>

          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div>
              <div className="font-medium">High Memory Usage</div>
              <div className="text-sm text-gray-400">Alert when memory exceeds 80%</div>
            </div>
            <Toggle 
              enabled={notifications.highMemory} 
              onChange={() => onToggle('highMemory', !notifications.highMemory)}
            />
          </div>

          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div>
              <div className="font-medium">Security Alerts</div>
              <div className="text-sm text-gray-400">Notify about security issues and vulnerabilities</div>
            </div>
            <Toggle 
              enabled={notifications.securityAlerts} 
              onChange={() => onToggle('securityAlerts', !notifications.securityAlerts)}
            />
          </div>
        </div>
      </div>

      {/* Delivery Channels */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Delivery Channels</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-info" />
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-gray-400">Receive alerts via email</div>
              </div>
            </div>
            <Toggle 
              enabled={notifications.emailNotifications} 
              onChange={() => onToggle('emailNotifications', !notifications.emailNotifications)}
            />
          </div>

          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-success" />
              <div>
                <div className="font-medium">Slack Notifications</div>
                <div className="text-sm text-gray-400">Send alerts to Slack channels</div>
              </div>
            </div>
            <Toggle 
              enabled={notifications.slackNotifications} 
              onChange={() => onToggle('slackNotifications', !notifications.slackNotifications)}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
