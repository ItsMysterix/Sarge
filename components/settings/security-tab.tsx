"use client"

import { motion } from "framer-motion"
import { Shield, Lock, Key, AlertTriangle } from "lucide-react"

export function SecurityTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Authentication */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Authentication</h3>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 glass-card rounded border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium">Password</div>
                <div className="text-sm text-gray-400">Last changed 30 days ago</div>
              </div>
              <button className="px-4 py-2 glass-card border border-white/10 hover:bg-white/5 rounded transition-colors text-sm">
                Change Password
              </button>
            </div>
          </div>

          <div className="p-4 glass-card rounded border border-white/10 opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Two-Factor Authentication</div>
                <div className="text-sm text-gray-400">Add an extra layer of security</div>
              </div>
              <button 
                disabled
                className="px-4 py-2 glass-card border border-white/10 rounded text-sm cursor-not-allowed"
              >
                Enable 2FA
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2">Coming soon</div>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Key className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">API Keys</h3>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 glass-card rounded border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium">Production Key</div>
                <div className="text-sm text-gray-400 font-mono">sk_prod_••••••••••••</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 glass-card border border-white/10 hover:bg-white/5 rounded transition-colors text-xs">
                  Rotate
                </button>
                <button className="px-3 py-1.5 glass-card border border-error/30 text-error hover:bg-error/10 rounded transition-colors text-xs">
                  Revoke
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500">Last used 2 hours ago</div>
          </div>

          <button className="w-full px-4 py-3 glass-card border border-white/10 hover:bg-white/5 rounded transition-colors text-sm border-dashed">
            + Generate New API Key
          </button>
        </div>
      </div>

      {/* Access Control */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Access Control</h3>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 glass-card rounded border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Session Timeout</div>
                <div className="text-sm text-gray-400">Automatically log out after inactivity</div>
              </div>
              <select className="glass-card px-4 py-2 rounded border border-white/10 focus:border-accent focus:outline-none">
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
                <option>Never</option>
              </select>
            </div>
          </div>

          <div className="p-4 glass-card rounded border border-white/10 opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">IP Whitelist</div>
                <div className="text-sm text-gray-400">Restrict access to specific IP addresses</div>
              </div>
              <button 
                disabled
                className="px-4 py-2 glass-card border border-white/10 rounded text-sm cursor-not-allowed"
              >
                Configure
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2">Coming soon</div>
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        
        <div className="space-y-3">
          {[
            { action: 'Login from new device', time: '2 hours ago', location: 'San Francisco, CA' },
            { action: 'API key generated', time: '1 day ago', location: 'San Francisco, CA' },
            { action: 'Settings updated', time: '3 days ago', location: 'San Francisco, CA' },
          ].map((log, idx) => (
            <div key={idx} className="p-3 glass-card rounded border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{log.action}</div>
                  <div className="text-xs text-gray-400">{log.location}</div>
                </div>
                <div className="text-xs text-gray-500">{log.time}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-4 px-4 py-2 glass-card border border-white/10 hover:bg-white/5 rounded transition-colors text-sm">
          View Full Audit Log
        </button>
      </div>
    </motion.div>
  )
}
