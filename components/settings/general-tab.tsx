"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Settings2, Globe, Server, Database, Download, Upload, Trash2, AlertTriangle } from "lucide-react"

interface GeneralTabProps {
  onExport?: () => void
  onImport?: () => void
  onClearData?: () => void
}

export function GeneralTab({
  onExport,
  onImport,
  onClearData
}: GeneralTabProps) {
  const [defaultRegion, setDefaultRegion] = useState("us-east-1")
  const [defaultEnvironment, setDefaultEnvironment] = useState("development")
  const [autoDeploy, setAutoDeploy] = useState(false)
  const [autoSSL, setAutoSSL] = useState(true)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Default Project Settings */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Settings2 className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Default Project Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div>
              <div className="font-medium">Default Region</div>
              <div className="text-sm text-gray-400">Primary region for new deployments</div>
            </div>
            <select 
              value={defaultRegion}
              onChange={(e) => setDefaultRegion(e.target.value)}
              className="glass-card px-4 py-2 rounded border border-white/10 focus:border-accent focus:outline-none bg-transparent"
            >
              <option value="us-east-1" className="bg-[#1a1a1a]">US East (N. Virginia)</option>
              <option value="us-west-2" className="bg-[#1a1a1a]">US West (Oregon)</option>
              <option value="eu-west-1" className="bg-[#1a1a1a]">EU (Ireland)</option>
              <option value="ap-southeast-1" className="bg-[#1a1a1a]">Asia Pacific (Singapore)</option>
              <option value="local" className="bg-[#1a1a1a]">Local (Offline)</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div>
              <div className="font-medium">Default Environment</div>
              <div className="text-sm text-gray-400">Environment for new branches</div>
            </div>
            <select 
              value={defaultEnvironment}
              onChange={(e) => setDefaultEnvironment(e.target.value)}
              className="glass-card px-4 py-2 rounded border border-white/10 focus:border-accent focus:outline-none bg-transparent"
            >
              <option value="development" className="bg-[#1a1a1a]">Development</option>
              <option value="preview" className="bg-[#1a1a1a]">Preview</option>
              <option value="production" className="bg-[#1a1a1a]">Production</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deployment Preferences */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Server className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Deployment Preferences</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div className="flex-1">
              <div className="font-medium">Auto Deploy</div>
              <div className="text-sm text-gray-400">Automatically deploy when pushing to main branch</div>
            </div>
            <button
              onClick={() => setAutoDeploy(!autoDeploy)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoDeploy ? 'bg-accent' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoDeploy ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div className="flex-1">
              <div className="font-medium">Auto SSL</div>
              <div className="text-sm text-gray-400">Automatically provision SSL certificates</div>
            </div>
            <button
              onClick={() => setAutoSSL(!autoSSL)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoSSL ? 'bg-accent' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSSL ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Data Management</h3>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={onExport}
            className="w-full flex items-center justify-between p-4 glass-card border border-white/10 hover:bg-white/5 rounded transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-accent" />
              <div className="text-left">
                <div className="font-medium">Export Settings</div>
                <div className="text-sm text-gray-400">Download all configuration as JSON</div>
              </div>
            </div>
          </button>

          <button 
            onClick={onImport}
            className="w-full flex items-center justify-between p-4 glass-card border border-white/10 hover:bg-white/5 rounded transition-colors"
          >
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-accent" />
              <div className="text-left">
                <div className="font-medium">Import Settings</div>
                <div className="text-sm text-gray-400">Upload configuration from JSON file</div>
              </div>
            </div>
          </button>

          <button 
            onClick={onClearData}
            className="w-full flex items-center justify-between p-4 glass-card border border-red-500/30 hover:bg-red-500/10 rounded transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-400" />
              <div className="text-left">
                <div className="font-medium text-red-400">Clear All Data</div>
                <div className="text-sm text-gray-400">Remove all deployments, logs, and cache</div>
              </div>
            </div>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
