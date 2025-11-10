"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  FolderGit2, ArrowRight, ArrowLeft, Check, Sparkles, 
  Code, Settings, Rocket, Github, Folder, Link2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"

interface ProjectWizardProps {
  onComplete?: (project: any) => void
  onCancel?: () => void
}

export function ProjectWizard({ onComplete, onCancel }: ProjectWizardProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const [step, setStep] = useState(1)
  const [creating, setCreating] = useState(false)
  
  const [formData, setFormData] = useState({
    source: "workspace" as "workspace" | "github" | "local",
    workspaceId: "",
    name: "",
    slug: "",
    description: "",
    framework: "",
    buildCommand: "",
    devCommand: "",
    installCommand: "",
    autoDeploy: true,
    autoDeployBranch: "main",
    
    // Git & Repository
    protectedBranches: ["main", "master"],
    branchProtection: true,
    autoMerge: false,
    
    // Team & Collaboration
    enableCollaboration: false,
    defaultRole: "viewer" as "viewer" | "developer" | "admin",
    requireApproval: true,
    
    // Environment Variables (initial setup)
    envVars: [] as Array<{ key: string; value: string; environment: string }>,
    
    // Security
    passwordProtected: false,
    password: "",
    ipWhitelist: [] as string[],
    enableWAF: false,
    
    // Performance & Build
    nodeVersion: "18.x",
    enableCaching: true,
    enableEdge: false,
    buildTimeout: 15,
    
    // Monitoring
    enableAnalytics: true,
    enableErrorTracking: true,
    logRetention: 7,
  })

  const t = trpc as any
  const workspacesQuery = t.sarge.oneclick.listWorkspaces.useQuery()
  const createProjectMutation = t.sarge.project.create.useMutation()

  const steps = [
    { number: 1, title: "Choose Source", icon: Folder },
    { number: 2, title: "Project Details", icon: Code },
    { number: 3, title: "Build Settings", icon: Settings },
    { number: 4, title: "Git & Security", icon: Github },
    { number: 5, title: "Team & Environment", icon: Code },
    { number: 6, title: "Review & Create", icon: Rocket },
  ]

  const handleNext = () => {
    if (step < 6) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleCreate = async () => {
    try {
      setCreating(true)
      
      const project = await createProjectMutation.mutateAsync(formData)
      
      addToast({
        type: "success",
        title: "Project Created!",
        description: `${formData.name} is ready to deploy`,
      })

      if (onComplete) {
        onComplete(project)
      } else {
        router.push(`/projects/${project.slug}`)
      }
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Creation Failed",
        description: error.message || "Failed to create project",
      })
    } finally {
      setCreating(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.source && (formData.source !== "workspace" || formData.workspaceId)
      case 2:
        return formData.name && formData.slug
      case 3:
        return true // Optional fields
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Create New Project</h2>
                <p className="text-sm text-gray-400">Set up your project in a few streamlined steps</p>
              </div>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-white transition-colors hover:bg-white/10 rounded-lg p-2"
              >
                ✕
              </button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all shadow-inner
                      ${step > s.number 
                        ? "bg-accent text-black" 
                        : step === s.number 
                        ? "bg-accent/90 text-black ring-4 ring-accent/30" 
                        : "bg-white/5 text-gray-500"
                      }
                    `}
                  >
                    {step > s.number ? <Check className="w-5 h-5" /> : s.number}
                  </div>
                  <span className={`
                    text-xs mt-2 font-medium
                    ${step >= s.number ? "text-white" : "text-gray-500"}
                  `}>
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`
                    flex-1 h-0.5 mx-4 transition-colors rounded-full
                    ${step > s.number ? "bg-accent" : "bg-white/10"}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 240px)" }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-semibold mb-4">Choose Your Source</h3>
                
                {/* Workspace Option */}
                <button
                  onClick={() => setFormData({ ...formData, source: "workspace" })}
                  className={`
                    w-full p-6 rounded-lg border-2 text-left transition-all
                    ${formData.source === "workspace"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-800 hover:border-gray-700"
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    <FolderGit2 className="w-8 h-8 text-blue-400 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2">Existing Workspace</h4>
                      <p className="text-sm text-gray-400">
                        Use a workspace you've already added (cloned from GitHub or registered locally)
                      </p>
                    </div>
                  </div>
                </button>

                {formData.source === "workspace" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="pl-4"
                  >
                    <label className="block text-sm font-medium mb-2">Select Workspace</label>
                    <select
                      value={formData.workspaceId}
                      onChange={(e) => {
                        const workspace = workspacesQuery.data?.find((w: any) => w.id === e.target.value)
                        setFormData({ 
                          ...formData, 
                          workspaceId: e.target.value,
                          name: workspace?.name || "",
                          slug: workspace?.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "",
                        })
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70"
                    >
                      <option value="">Select a workspace...</option>
                      {workspacesQuery.data?.map((workspace: any) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name} - {workspace.path}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}

                {/* Coming Soon Options */}
                <div className="opacity-50 pointer-events-none">
                  <button className="w-full p-6 rounded-lg border-2 border-gray-800 text-left">
                    <div className="flex items-start gap-4">
                      <Github className="w-8 h-8 text-gray-500 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">GitHub Repository</h4>
                          <span className="text-xs bg-gray-800 px-2 py-1 rounded">Coming Soon</span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Import directly from a GitHub repository
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold mb-4">Project Details</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                      setFormData({ ...formData, name: e.target.value, slug })
                    }}
                    placeholder="My Awesome Project"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Project Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    placeholder="my-awesome-project"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used in URLs: /projects/{formData.slug || "your-slug"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your project..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70 resize-none"
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold mb-4">Build Configuration</h3>
                <p className="text-sm text-gray-400 mb-6">
                  These will be auto-detected from your workspace, but you can customize them.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Install Command</label>
                    <input
                      type="text"
                      value={formData.installCommand}
                      onChange={(e) => setFormData({ ...formData, installCommand: e.target.value })}
                      placeholder="npm install (auto-detected)"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Build Command</label>
                    <input
                      type="text"
                      value={formData.buildCommand}
                      onChange={(e) => setFormData({ ...formData, buildCommand: e.target.value })}
                      placeholder="npm run build (auto-detected)"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Dev Command</label>
                    <input
                      type="text"
                      value={formData.devCommand}
                      onChange={(e) => setFormData({ ...formData, devCommand: e.target.value })}
                      placeholder="npm run dev (auto-detected)"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Framework</label>
                    <input
                      type="text"
                      value={formData.framework}
                      onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                      placeholder="Auto-detected"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto Deploy</h4>
                      <p className="text-sm text-gray-400">Automatically deploy on git push</p>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, autoDeploy: !formData.autoDeploy })}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors
                          ${formData.autoDeploy ? "bg-accent" : "bg-white/10"}
                      `}
                    >
                      <div className={`
                        absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                        ${formData.autoDeploy ? "translate-x-7" : "translate-x-1"}
                      `} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold mb-4">Git & Security</h3>
                
                {/* Git Repository Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-300">Repository Settings</h4>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h5 className="font-medium">Branch Protection</h5>
                      <p className="text-sm text-gray-400">Protect main branches from direct pushes</p>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, branchProtection: !formData.branchProtection })}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors
                          ${formData.branchProtection ? "bg-accent" : "bg-white/10"}
                      `}
                    >
                      <div className={`
                        absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                        ${formData.branchProtection ? "translate-x-7" : "translate-x-1"}
                      `} />
                    </button>
                  </div>

                  {formData.branchProtection && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Protected Branches</label>
                      <input
                        type="text"
                        value={formData.protectedBranches.join(", ")}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          protectedBranches: e.target.value.split(",").map(b => b.trim())
                        })}
                        placeholder="main, master, develop"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h5 className="font-medium">Auto Merge</h5>
                      <p className="text-sm text-gray-400">Automatically merge approved PRs</p>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, autoMerge: !formData.autoMerge })}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors
                          ${formData.autoMerge ? "bg-accent" : "bg-white/10"}
                      `}
                    >
                      <div className={`
                        absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                        ${formData.autoMerge ? "translate-x-7" : "translate-x-1"}
                      `} />
                    </button>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="space-y-4 pt-4 border-t border-gray-800">
                  <h4 className="font-medium text-sm text-gray-300">Security</h4>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h5 className="font-medium">Password Protection</h5>
                      <p className="text-sm text-gray-400">Require password to access deployments</p>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, passwordProtected: !formData.passwordProtected })}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors
                          ${formData.passwordProtected ? "bg-accent" : "bg-white/10"}
                      `}
                    >
                      <div className={`
                        absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                        ${formData.passwordProtected ? "translate-x-7" : "translate-x-1"}
                      `} />
                    </button>
                  </div>

                  {formData.passwordProtected && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Deployment Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h5 className="font-medium">Web Application Firewall</h5>
                      <p className="text-sm text-gray-400">Enable WAF protection (DDoS, SQL injection, etc.)</p>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, enableWAF: !formData.enableWAF })}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors
                          ${formData.enableWAF ? "bg-accent" : "bg-white/10"}
                      `}
                    >
                      <div className={`
                        absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                        ${formData.enableWAF ? "translate-x-7" : "translate-x-1"}
                      `} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold mb-4">Team & Environment</h3>
                
                {/* Team Collaboration */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-300">Team Collaboration</h4>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h5 className="font-medium">Enable Team Access</h5>
                      <p className="text-sm text-gray-400">Allow team members to collaborate on this project</p>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, enableCollaboration: !formData.enableCollaboration })}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors
                          ${formData.enableCollaboration ? "bg-accent" : "bg-white/10"}
                      `}
                    >
                      <div className={`
                        absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                        ${formData.enableCollaboration ? "translate-x-7" : "translate-x-1"}
                      `} />
                    </button>
                  </div>

                  {formData.enableCollaboration && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Default Role for New Members</label>
                        <select
                          value={formData.defaultRole}
                          onChange={(e) => setFormData({ ...formData, defaultRole: e.target.value as any })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70"
                        >
                          <option value="viewer">Viewer (Read-only)</option>
                          <option value="developer">Developer (Deploy & Edit)</option>
                          <option value="admin">Admin (Full Access)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div>
                          <h5 className="font-medium">Require Deployment Approval</h5>
                          <p className="text-sm text-gray-400">Admins must approve before deployments</p>
                        </div>
                        <button
                          onClick={() => setFormData({ ...formData, requireApproval: !formData.requireApproval })}
                          className={`
                            relative w-12 h-6 rounded-full transition-colors
                              ${formData.requireApproval ? "bg-accent" : "bg-white/10"}
                          `}
                        >
                          <div className={`
                            absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                            ${formData.requireApproval ? "translate-x-7" : "translate-x-1"}
                          `} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Environment Variables */}
                <div className="space-y-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-gray-300">Environment Variables (Initial Setup)</h4>
                    <button
                      onClick={() => setFormData({ 
                        ...formData, 
                        envVars: [...formData.envVars, { key: "", value: "", environment: "production" }]
                      })}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      + Add Variable
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500">You can add more environment variables later in project settings.</p>

                  {formData.envVars.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {formData.envVars.map((env, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={env.key}
                            onChange={(e) => {
                              const newEnvVars = [...formData.envVars]
                              newEnvVars[idx].key = e.target.value
                              setFormData({ ...formData, envVars: newEnvVars })
                            }}
                            placeholder="KEY"
                            className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent/70 font-mono"
                          />
                          <input
                            type="text"
                            value={env.value}
                            onChange={(e) => {
                              const newEnvVars = [...formData.envVars]
                              newEnvVars[idx].value = e.target.value
                              setFormData({ ...formData, envVars: newEnvVars })
                            }}
                            placeholder="value"
                            className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent/70 font-mono"
                          />
                          <button
                            onClick={() => {
                              const newEnvVars = formData.envVars.filter((_, i) => i !== idx)
                              setFormData({ ...formData, envVars: newEnvVars })
                            }}
                            className="text-red-400 hover:text-red-300 px-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Performance Settings */}
                <div className="space-y-4 pt-4 border-t border-gray-800">
                  <h4 className="font-medium text-sm text-gray-300">Performance & Monitoring</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Node.js Version</label>
                      <select
                        value={formData.nodeVersion}
                        onChange={(e) => setFormData({ ...formData, nodeVersion: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70"
                      >
                        <option value="16.x">Node.js 16.x</option>
                        <option value="18.x">Node.js 18.x (Recommended)</option>
                        <option value="20.x">Node.js 20.x</option>
                        <option value="21.x">Node.js 21.x</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Build Timeout (minutes)</label>
                      <input
                        type="number"
                        value={formData.buildTimeout}
                        onChange={(e) => setFormData({ ...formData, buildTimeout: parseInt(e.target.value) })}
                        min="5"
                        max="60"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h5 className="font-medium">Enable Caching</h5>
                      <p className="text-sm text-gray-400">Cache dependencies for faster builds</p>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, enableCaching: !formData.enableCaching })}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors
                          ${formData.enableCaching ? "bg-accent" : "bg-white/10"}
                      `}
                    >
                      <div className={`
                        absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                        ${formData.enableCaching ? "translate-x-7" : "translate-x-1"}
                      `} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h5 className="font-medium">Analytics & Monitoring</h5>
                      <p className="text-sm text-gray-400">Track performance and usage metrics</p>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, enableAnalytics: !formData.enableAnalytics })}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors
                          ${formData.enableAnalytics ? "bg-accent" : "bg-white/10"}
                      `}
                    >
                      <div className={`
                        absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                        ${formData.enableAnalytics ? "translate-x-7" : "translate-x-1"}
                      `} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold mb-4">Review & Create</h3>
                
                <div className="bg-gray-800/50 rounded-lg p-6 space-y-4 max-h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-400">Name:</span>
                      <p className="font-medium">{formData.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Slug:</span>
                      <p className="font-mono text-sm">{formData.slug}</p>
                    </div>
                  </div>
                  
                  {formData.description && (
                    <div>
                      <span className="text-sm text-gray-400">Description:</span>
                      <p className="text-sm">{formData.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                    <div>
                      <span className="text-sm text-gray-400">Framework:</span>
                      <p className="text-sm">{formData.framework || "Auto-detected"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Node Version:</span>
                      <p className="text-sm">{formData.nodeVersion}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <span className="text-sm text-gray-400 mb-2 block">Features Enabled:</span>
                    <div className="flex flex-wrap gap-2">
                      {formData.autoDeploy && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">Auto Deploy</span>}
                      {formData.branchProtection && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Branch Protection</span>}
                      {formData.passwordProtected && <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">Password Protected</span>}
                      {formData.enableWAF && <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">WAF Enabled</span>}
                      {formData.enableCollaboration && <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs">Team Collaboration</span>}
                      {formData.enableCaching && <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">Build Caching</span>}
                      {formData.enableAnalytics && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">Analytics</span>}
                    </div>
                  </div>

                  {formData.envVars.length > 0 && (
                    <div className="pt-4 border-t border-gray-700">
                      <span className="text-sm text-gray-400">Environment Variables:</span>
                      <p className="text-sm">{formData.envVars.length} variable(s) configured</p>
                    </div>
                  )}

                  {formData.protectedBranches.length > 0 && (
                    <div className="pt-4 border-t border-gray-700">
                      <span className="text-sm text-gray-400">Protected Branches:</span>
                      <p className="text-sm">{formData.protectedBranches.join(", ")}</p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-400">
                    ✨ Your project will be analyzed automatically to detect frameworks, dependencies, and optimal build settings. All settings can be modified later in project settings.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between bg-black/30 backdrop-blur-sm">
          <Button
            onClick={handleBack}
            disabled={step === 1}
            variant="outline"
            className="border-white/10 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-3">
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="outline"
                className="border-white/10 hover:bg-white/10"
              >
                Cancel
              </Button>
            )}
            
            {step < 6 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-accent text-black hover:bg-accent/90"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="bg-accent text-black hover:bg-accent/90"
              >
                {creating ? "Creating..." : "Create Project"}
                <Rocket className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
