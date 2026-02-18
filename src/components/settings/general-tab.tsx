"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Settings2, Globe, Server, Database, Download, Upload, Trash2, AlertTriangle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface GeneralTabProps {
  settings?: any
  updateSettings?: (updates: any) => Promise<any>
  onExport?: () => void
  onImport?: () => void
  onClearData?: () => void
}

export function GeneralTab({
  settings,
  updateSettings,
  onExport,
  onImport,
  onClearData
}: GeneralTabProps) {
  const [defaultRegion, setDefaultRegion] = useState(settings?.default_region || "us-east-1")
  const [defaultEnvironment, setDefaultEnvironment] = useState(settings?.default_environment || "development")
  const [cpu, setCpu] = useState(settings?.resources?.cpu || 0.5)
  const [memory, setMemory] = useState(settings?.resources?.memory || 512)
  const [replicas, setReplicas] = useState(settings?.resources?.replicas || 1)

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
              onChange={(e) => {
                const val = e.target.value
                setDefaultRegion(val)
                updateSettings?.({ defaultRegion: val })
              }}
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
              onChange={(e) => {
                const val = e.target.value
                setDefaultEnvironment(val)
                updateSettings?.({ defaultEnvironment: val })
              }}
              className="glass-card px-4 py-2 rounded border border-white/10 focus:border-accent focus:outline-none bg-transparent"
            >
              <option value="development" className="bg-[#1a1a1a]">Development</option>
              <option value="preview" className="bg-[#1a1a1a]">Preview</option>
              <option value="production" className="bg-[#1a1a1a]">Production</option>
            </select>
          </div>
        </div>
      </div>

      {/* Infrastructure & Resources */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Infrastructure & Resources</h3>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Allocation: vCPU</span>
              <span className="font-mono text-accent">{cpu} vCPU</span>
            </div>
            <input 
              type="range" min="0.1" max="4" step="0.1" 
              value={cpu} 
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                setCpu(val)
                updateSettings?.({ resources: { ...settings?.resources, cpu: val } })
              }}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Allocation: RAM</span>
              <span className="font-mono text-accent">{memory} MB</span>
            </div>
            <input 
              type="range" min="128" max="8192" step="128" 
              value={memory} 
              onChange={(e) => {
                const val = parseInt(e.target.value)
                setMemory(val)
                updateSettings?.({ resources: { ...settings?.resources, memory: val } })
              }}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Minimum Replicas</span>
              <span className="font-mono text-accent">{replicas}</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 5, 10].map(r => (
                <button
                  key={r}
                  onClick={() => {
                    setReplicas(r)
                    updateSettings?.({ resources: { ...settings?.resources, replicas: r } })
                  }}
                  className={cn(
                    "px-3 py-1 rounded border text-xs transition-all",
                    replicas === r ? "bg-white text-black border-transparent" : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Deployment */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Advanced Deployment</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div className="flex-1">
              <div className="font-medium">Zero-Downtime Deployments</div>
              <div className="text-sm text-gray-400">Use Rolling Updates or Blue/Green strategies.</div>
            </div>
            <button
              onClick={() => updateSettings?.({ zeroDowntime: !settings?.zeroDowntime })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings?.zeroDowntime ? 'bg-accent' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                   settings?.zeroDowntime ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div className="flex-1">
              <div className="font-medium">Active Health Checks</div>
              <div className="text-sm text-gray-400">Kill and restart unhealthy containers automatically.</div>
            </div>
            <button
              onClick={() => updateSettings?.({ healthChecks: !settings?.healthChecks })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings?.healthChecks ? 'bg-accent' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings?.healthChecks ? 'translate-x-6' : 'translate-x-1'
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
