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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-20"
    >
      {/* Default Project Settings */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-12">
        <div className="flex items-center gap-4 border-b border-white/5 pb-10">
          <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
            <Settings2 className="w-6 h-6 text-indigo-400/60" />
          </div>
          <div className="flex flex-col">
             <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Core Protocol Defaults</h3>
             <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Standardized environment & regional initialization</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { 
              label: 'Default Kernel Region', 
              field: 'region', 
              value: defaultRegion,
              setter: (v: string) => { setDefaultRegion(v); updateSettings?.({ defaultRegion: v }) },
              options: [
                { value: 'us-east-1', label: 'US_EAST_VIRGINIA' },
                { value: 'us-west-2', label: 'US_WEST_OREGON' },
                { value: 'eu-west-1', label: 'EU_WEST_IRELAND' },
                { value: 'ap-southeast-1', label: 'AP_SOUTH_SINGAPORE' },
                { value: 'local', label: 'OFFLINE_LOCAL' }
              ]
            },
            { 
              label: 'Execution Environment', 
              field: 'env', 
              value: defaultEnvironment,
              setter: (v: string) => { setDefaultEnvironment(v); updateSettings?.({ defaultEnvironment: v }) },
              options: [
                { value: 'development', label: 'DEV_SANDBOX' },
                { value: 'preview', label: 'PREVIEW_STAGING' },
                { value: 'production', label: 'PROD_STABLE' }
              ]
            }
          ].map((item) => (
            <div key={item.label} className="bg-[#050505] border border-white/5 rounded-3xl p-8 space-y-6 ring-1 ring-inset ring-white/[0.01]">
              <div className="flex items-center gap-3">
                 <div className="w-1 h-1 rounded-full bg-indigo-500" />
                 <label className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">{item.label}</label>
              </div>
              <select 
                value={item.value}
                onChange={(e) => item.setter(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-5 py-3.5 text-[11px] outline-none focus:border-indigo-500/30 transition-all font-black text-foreground/80 uppercase tracking-widest cursor-pointer"
              >
                {item.options.map(opt => <option key={opt.value} value={opt.value} className="bg-[#0a0a0a]">{opt.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Infrastructure Allocation */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-12">
        <div className="flex items-center gap-4 border-b border-white/5 pb-10">
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <Globe className="w-6 h-6 text-emerald-400/60" />
          </div>
          <div className="flex flex-col">
             <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Infrastructure Allocation</h3>
             <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">Resource quotas & computational weight</p>
          </div>
        </div>
        
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-6 bg-[#050505] border border-white/5 rounded-3xl p-8 ring-1 ring-inset ring-white/[0.01]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                    <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">vCPU_QUOTA</span>
                  </div>
                  <span className="font-mono text-[11px] font-black text-emerald-400 uppercase">{cpu} CORES</span>
                </div>
                <input 
                  type="range" min="0.1" max="4" step="0.1" 
                  value={cpu} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    setCpu(val)
                    updateSettings?.({ resources: { ...settings?.resources, cpu: val } })
                  }}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                />
             </div>

             <div className="space-y-6 bg-[#050505] border border-white/5 rounded-3xl p-8 ring-1 ring-inset ring-white/[0.01]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                    <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">RAM_CAPACITY</span>
                  </div>
                  <span className="font-mono text-[11px] font-black text-blue-400 uppercase">{memory} MiB</span>
                </div>
                <input 
                  type="range" min="128" max="8192" step="128" 
                  value={memory} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setMemory(val)
                    updateSettings?.({ resources: { ...settings?.resources, memory: val } })
                  }}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                />
             </div>
          </div>

          <div className="bg-[#050505] border border-white/5 rounded-3xl p-8 space-y-6 ring-1 ring-inset ring-white/[0.01]">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                 <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">MIN_REPLICA_THRESHOLD</span>
               </div>
               <span className="font-mono text-[11px] font-black text-indigo-400 uppercase">{replicas} NODES</span>
            </div>
            <div className="flex gap-4">
              {[1, 2, 3, 5, 10].map(r => (
                <button
                  key={r}
                  onClick={() => {
                    setReplicas(r)
                    updateSettings?.({ resources: { ...settings?.resources, replicas: r } })
                  }}
                  className={cn(
                    "flex-1 h-12 flex items-center justify-center rounded-xl text-[11px] font-black transition-all duration-500 ring-1 ring-inset uppercase tracking-widest",
                    replicas === r 
                      ? "bg-white text-black ring-transparent shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                      : "bg-[#0a0a0a] ring-white/5 text-muted-foreground/40 hover:ring-white/10 hover:text-muted-foreground/60"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Hardening */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-12">
        <div className="flex items-center gap-4 border-b border-white/5 pb-10">
          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
            <Zap className="w-6 h-6 text-amber-400/60" />
          </div>
          <div className="flex flex-col">
             <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Deployment Hardening</h3>
             <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1">High-availability & automated recovery protocols</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { 
              title: 'Zero_Downtime Propagation', 
              desc: 'Utilize rolling update & mirror strategies', 
              active: settings?.zeroDowntime,
              toggle: () => updateSettings?.({ zeroDowntime: !settings?.zeroDowntime })
            },
            { 
              title: 'Active_Pulse Checks', 
              desc: 'Automated health-based container recycling', 
              active: settings?.healthChecks,
              toggle: () => updateSettings?.({ healthChecks: !settings?.healthChecks })
            }
          ].map((item) => (
            <div key={item.title} className="flex items-center justify-between p-8 bg-[#050505] border border-white/5 rounded-3xl group hover:border-white/10 transition-all duration-500 ring-1 ring-inset ring-white/[0.01]">
              <div className="flex-1 space-y-2">
                <div className="text-[11px] font-black text-foreground/80 uppercase tracking-widest">{item.title}</div>
                <div className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-[0.2em]">{item.desc}</div>
              </div>
              <button
                onClick={item.toggle}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-500 outline-none",
                  item.active ? "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "bg-white/5"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-500",
                  item.active ? 'translate-x-[1.625rem]' : 'translate-x-[0.125rem]'
                )} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Data Sovereignty */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-xl space-y-10">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white/[0.03] border border-white/5 rounded-xl">
             <Database className="w-5 h-5 text-muted-foreground/30" />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/40">Data Sovereignty Control</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={onExport}
            className="flex flex-col items-start gap-6 p-8 bg-[#050505] border border-white/5 rounded-3xl hover:bg-[#080808] hover:border-white/10 transition-all duration-500 ring-1 ring-inset ring-white/[0.01] text-left group"
          >
            <Download className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
            <div className="space-y-1.5">
              <div className="text-[11px] font-black text-foreground/80 uppercase tracking-widest">Export_Nexus</div>
              <div className="text-[8px] font-bold text-muted-foreground/10 uppercase tracking-[0.3em]">Download binary state JSON</div>
            </div>
          </button>

          <button 
            onClick={onImport}
            className="flex flex-col items-start gap-6 p-8 bg-[#050505] border border-white/5 rounded-3xl hover:bg-[#080808] hover:border-white/10 transition-all duration-500 ring-1 ring-inset ring-white/[0.01] text-left group"
          >
            <Upload className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div className="space-y-1.5">
              <div className="text-[11px] font-black text-foreground/80 uppercase tracking-widest">Import_Override</div>
              <div className="text-[8px] font-bold text-muted-foreground/10 uppercase tracking-[0.3em]">Restore configuration binary</div>
            </div>
          </button>

          <button 
            onClick={onClearData}
            className="flex flex-col items-start gap-6 p-8 bg-[#050505] border border-red-500/5 rounded-3xl hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-500 ring-1 ring-inset ring-red-500/[0.01] text-left group"
          >
            <div className="w-full flex justify-between items-center">
               <Trash2 className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" />
               <AlertTriangle className="w-4 h-4 text-red-500/20" />
            </div>
            <div className="space-y-1.5">
              <div className="text-[11px] font-black text-red-400 uppercase tracking-widest">Nuke_Execution</div>
              <div className="text-[8px] font-bold text-muted-foreground/20 uppercase tracking-[0.3em]">Purge deployments/logs/cache</div>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
