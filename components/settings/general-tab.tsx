"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { User, Database, Download, Upload, Trash2 } from "lucide-react"
import { LoadingButton } from "@/components/ui/loading-button"

interface GeneralTabProps {
  userName: string
  isEditingName: boolean
  onNameChange: (name: string) => void
  onEditToggle: () => void
  onSave: () => Promise<void>
}

export function GeneralTab({
  userName,
  isEditingName,
  onNameChange,
  onEditToggle,
  onSave
}: GeneralTabProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await onSave()
    setIsSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* User Profile Section */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">User Profile</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Display Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={userName}
                onChange={(e) => onNameChange(e.target.value)}
                disabled={!isEditingName}
                className="flex-1 glass-card px-4 py-2 rounded border border-white/10 focus:border-accent focus:outline-none disabled:opacity-50"
              />
              {!isEditingName ? (
                <button
                  onClick={onEditToggle}
                  className="px-4 py-2 glass-card border border-white/10 hover:bg-white/5 rounded transition-colors"
                >
                  Edit
                </button>
              ) : (
                <LoadingButton
                  onClick={handleSave}
                  loading={isSaving}
                  className="px-4 py-2 bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 rounded transition-colors"
                >
                  Save
                </LoadingButton>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Settings */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Workspace</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div>
              <div className="font-medium">Default Region</div>
              <div className="text-sm text-gray-400">Primary AWS region for deployments</div>
            </div>
            <select className="glass-card px-4 py-2 rounded border border-white/10 focus:border-accent focus:outline-none">
              <option>us-east-1</option>
              <option>us-west-2</option>
              <option>eu-west-1</option>
              <option>ap-southeast-1</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between p-4 glass-card rounded border border-white/10">
            <div>
              <div className="font-medium">Default Environment</div>
              <div className="text-sm text-gray-400">Target environment for new deployments</div>
            </div>
            <select className="glass-card px-4 py-2 rounded border border-white/10 focus:border-accent focus:outline-none">
              <option>development</option>
              <option>staging</option>
              <option>production</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Download className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Data Management</h3>
        </div>
        
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 glass-card rounded border border-white/10 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-info" />
              <div className="text-left">
                <div className="font-medium">Export Settings</div>
                <div className="text-sm text-gray-400">Download your workspace configuration</div>
              </div>
            </div>
          </button>
          
          <button className="w-full flex items-center justify-between p-4 glass-card rounded border border-white/10 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Upload className="w-4 h-4 text-success" />
              <div className="text-left">
                <div className="font-medium">Import Settings</div>
                <div className="text-sm text-gray-400">Restore workspace from backup</div>
              </div>
            </div>
          </button>
          
          <button className="w-full flex items-center justify-between p-4 glass-card rounded border border-error/30 hover:bg-error/10 transition-colors">
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-error" />
              <div className="text-left">
                <div className="font-medium text-error">Clear All Data</div>
                <div className="text-sm text-gray-400">Reset workspace to default state</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
