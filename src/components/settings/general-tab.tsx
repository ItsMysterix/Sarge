"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Settings2, Globe, Server, Database, Download, Upload, Trash2, AlertTriangle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      {/* Project Defaults */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
            <Settings2 className="w-5 h-5 text-white/40" />
          </div>
          <div>
             <h3 className="text-sm font-bold text-white">Project Defaults</h3>
             <p className="text-xs text-white/20 mt-0.5">Configure default regions and environment types.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { 
              label: 'Default Region', 
              field: 'region', 
              value: defaultRegion,
              setter: (v: string) => { setDefaultRegion(v); updateSettings?.({ defaultRegion: v }) },
              options: [
                { value: 'us-east-1', label: 'US East (N. Virginia)' },
                { value: 'us-west-2', label: 'US West (Oregon)' },
                { value: 'eu-west-1', label: 'EU West (Ireland)' },
                { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
                { value: 'local', label: 'Local Development' }
              ]
            },
            { 
              label: 'Default Environment', 
              field: 'env', 
              value: defaultEnvironment,
              setter: (v: string) => { setDefaultEnvironment(v); updateSettings?.({ defaultEnvironment: v }) },
              options: [
                { value: 'development', label: 'Development' },
                { value: 'preview', label: 'Preview' },
                { value: 'production', label: 'Production' }
              ]
            }
          ].map((item) => (
            <div key={item.label} className="space-y-3">
              <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{item.label}</label>
              <select 
                value={item.value}
                onChange={(e) => item.setter(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-white/60 outline-none focus:border-white/20 transition-all cursor-pointer"
              >
                {item.options.map(opt => <option key={opt.value} value={opt.value} className="bg-[#0a0a0a]">{opt.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Allocation */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
            <Globe className="w-5 h-5 text-white/40" />
          </div>
          <div>
             <h3 className="text-sm font-bold text-white">Resource Allocation</h3>
             <p className="text-xs text-white/20 mt-0.5">Manage default compute resources for new services.</p>
          </div>
        </div>
        
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">CPU Allocation</span>
                  <span className="text-xs font-bold text-white/60">{cpu} vCPU</span>
                </div>
                <input 
                  type="range" min="0.1" max="4" step="0.1" 
                  value={cpu} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    setCpu(val)
                    updateSettings?.({ resources: { ...settings?.resources, cpu: val } })
                  }}
                  className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-white"
                />
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Memory Allocation</span>
                  <span className="text-xs font-bold text-white/60">{memory} MiB</span>
                </div>
                <input 
                  type="range" min="128" max="8192" step="128" 
                  value={memory} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setMemory(val)
                    updateSettings?.({ resources: { ...settings?.resources, memory: val } })
                  }}
                  className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-white"
                />
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center">
               <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Default Replicas</span>
               <span className="text-xs font-bold text-white/60">{replicas} Nodes</span>
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
                    "flex-1 h-10 flex items-center justify-center rounded-xl text-xs font-bold transition-all border",
                    replicas === r 
                      ? "bg-white text-black border-white shadow-xl" 
                      : "bg-white/[0.02] border-white/5 text-white/20 hover:text-white/40 hover:border-white/10"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Settings */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
            <Zap className="w-5 h-5 text-white/40" />
          </div>
          <div>
             <h3 className="text-sm font-bold text-white">Deployment Settings</h3>
             <p className="text-xs text-white/20 mt-0.5">Control how your applications are deployed and managed.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { 
              title: 'Zero Downtime Deployments', 
              desc: 'Rolling update strategy for all services', 
              active: settings?.zeroDowntime,
              toggle: () => updateSettings?.({ zeroDowntime: !settings?.zeroDowntime })
            },
            { 
              title: 'Health Monitoring', 
              desc: 'Automated container recovery on failure', 
              active: settings?.healthChecks,
              toggle: () => updateSettings?.({ healthChecks: !settings?.healthChecks })
            }
          ].map((item) => (
            <div key={item.title} className="flex items-center justify-between p-6 bg-white/[0.01] border border-white/5 rounded-2xl">
              <div>
                <div className="text-xs font-bold text-white/80">{item.title}</div>
                <div className="text-[10px] text-white/20 font-medium mt-1">{item.desc}</div>
              </div>
              <button
                onClick={item.toggle}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-all",
                  item.active ? "bg-white" : "bg-white/5"
                )}
              >
                <span className={cn(
                  "inline-block h-3.5 w-3.5 transform rounded-full transition-transform",
                  item.active ? 'translate-x-[1.25rem] bg-black' : 'translate-x-[0.125rem] bg-white/20'
                )} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
             <Database className="w-5 h-5 text-white/10" />
          </div>
          <h3 className="text-xs font-bold text-white/20 uppercase tracking-widest">Configuration Management</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={onExport}
            className="flex items-center gap-4 p-5 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] transition-all text-left"
          >
            <Download className="w-5 h-5 text-white/30" />
            <div>
              <div className="text-xs font-bold text-white/80 uppercase tracking-widest">Export</div>
              <p className="text-[10px] text-white/10 mt-1">Download settings JSON</p>
            </div>
          </button>

          <button 
            onClick={onImport}
            className="flex items-center gap-4 p-5 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] transition-all text-left"
          >
            <Upload className="w-5 h-5 text-white/30" />
            <div>
              <div className="text-xs font-bold text-white/80 uppercase tracking-widest">Import</div>
              <p className="text-[10px] text-white/10 mt-1">Restore from backup</p>
            </div>
          </button>

          <button 
            onClick={onClearData}
            className="flex items-center gap-4 p-5 bg-red-500/[0.02] border border-red-500/10 rounded-2xl hover:bg-red-500/5 transition-all text-left"
          >
            <Trash2 className="w-5 h-5 text-red-400/40" />
            <div>
              <div className="text-xs font-bold text-red-400 uppercase tracking-widest">Reset Cache</div>
              <p className="text-[10px] text-red-500/20 mt-1">Purge all local state</p>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
