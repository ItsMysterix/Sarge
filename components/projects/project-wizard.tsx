"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  FolderGit2, ArrowRight, ArrowLeft, Check, Sparkles, 
  Code, Settings, Rocket, Github, Folder, Link2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
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
  const { data: session } = useSession()
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

    // GitHub inputs for cloning
    githubOwner: "",
    githubRepo: "",
    githubBranch: "main",
    
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

  // Optional: single paste field for repo URL (e.g., https://github.com/owner/repo or git@github.com:owner/repo.git)
  const [repoUrlInput, setRepoUrlInput] = useState("")

  const t = trpc as any
  const workspacesQuery = t.sarge.oneclick.workspaces.list.useQuery()
  const createProjectMutation = t.project.create.useMutation()
  const cloneRepoMutation = t.sarge.oneclick.workspaces.cloneRepo.useMutation()

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

  // Parse various repo URL forms into { owner, repo, url }
  const parseRepoInput = (input: string): { owner?: string; repo?: string; url?: string } => {
    const val = input.trim()
    if (!val) return {}
    // SSH scp syntax: git@github.com:owner/repo.git
    const sshMatch = val.match(/^git@[^:]+:([^/]+)\/([^\.\s]+)(?:\.git)?$/)
    if (sshMatch) {
      return { owner: sshMatch[1], repo: sshMatch[2], url: val }
    }
    // https URL: https://github.com/owner/repo(.git)
    try {
      const u = new URL(val)
      if (u.hostname.endsWith('github.com')) {
        // Strip potential token prefix in username portion like x-access-token:TOKEN@
        const parts = u.pathname.replace(/^\//, '').split('/')
        if (parts.length >= 2) {
          const owner = parts[0]
          const repoWithMaybeGit = parts[1]
          const repo = repoWithMaybeGit.replace(/\.git$/, '')
          return { owner, repo, url: val }
        }
      }
    } catch {}
    // owner/repo shorthand
    const short = val.match(/^([\w-\.]+)\/([\w-\.]+)$/)
    if (short) {
      return { owner: short[1], repo: short[2] }
    }
    return {}
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        // Require a concrete workspace to proceed for both Workspace and GitHub sources
        if (formData.source === 'workspace' || formData.source === 'github') {
          return Boolean(formData.workspaceId)
        }
        return Boolean(formData.source)
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

                {/* GitHub Option */}
                <button
                  onClick={() => setFormData({ ...formData, source: 'github' })}
                  className={`
                    w-full p-6 rounded-lg border-2 text-left transition-all
                    ${formData.source === 'github'
                      ? 'border-accent bg-accent/10'
                      : 'border-white/10 hover:border-accent/40'}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <Github className="w-8 h-8 text-accent flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2">GitHub Repository</h4>
                      <p className="text-sm text-gray-400">
                        Clone a GitHub repository into a workspace and continue
                      </p>
                    </div>
                  </div>
                </button>

                {formData.source === 'github' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pl-4 space-y-3"
                  >
                    {/* Paste full repo URL (optional) */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Paste Repository URL (optional)</label>
                      <input
                        type="text"
                        value={repoUrlInput}
                        onChange={(e) => setRepoUrlInput(e.target.value)}
                        onBlur={() => {
                          if (!repoUrlInput) return
                          const parsed = parseRepoInput(repoUrlInput)
                          if (parsed.owner && !formData.githubOwner) {
                            setFormData((fd) => ({ ...fd, githubOwner: parsed.owner! }))
                          }
                          if (parsed.repo && !formData.githubRepo) {
                            setFormData((fd) => ({ ...fd, githubRepo: parsed.repo! }))
                          }
                        }}
                        placeholder="https://github.com/owner/repo or git@github.com:owner/repo.git"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-accent/70 font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">You can paste a full URL or fill the fields below.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Owner</label>
                        <input
                          type="text"
                          value={(formData as any).githubOwner || ''}
                          onChange={(e) => setFormData({ ...formData, githubOwner: e.target.value })}
                          placeholder="itsmysterix"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-accent/70"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Repository</label>
                        <input
                          type="text"
                          value={(formData as any).githubRepo || ''}
                          onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                          placeholder="my-nextjs-app"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-accent/70"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Branch</label>
                        <input
                          type="text"
                          value={(formData as any).githubBranch || 'main'}
                          onChange={(e) => setFormData({ ...formData, githubBranch: e.target.value })}
                          placeholder="main"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-accent/70"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={async () => {
                          // Prefer pasted URL if provided; otherwise build from owner/repo
                          const parsed = repoUrlInput ? parseRepoInput(repoUrlInput) : {}
                          const owner = (formData as any).githubOwner || parsed.owner
                          const repo = (formData as any).githubRepo || parsed.repo
                          const branch = (formData as any).githubBranch || 'main'
                          if (!owner || !repo) {
                            addToast({ type: 'error', title: 'Missing info', description: 'Provide owner/repo or paste a valid repository URL' })
                            return
                          }
                          try {
                            let repoUrl: string | undefined
                            if (parsed.url && (/^git@/.test(parsed.url) || /^ssh:\/\//.test(parsed.url))) {
                              // SSH provided – pass through, backend accepts ssh syntax
                              repoUrl = parsed.url
                            } else if (parsed.url && /^https?:\/\//.test(parsed.url)) {
                              // Use pasted https URL (ensure .git)
                              const u = new URL(parsed.url)
                              if (u.hostname.endsWith('github.com')) {
                                if (!u.pathname.endsWith('.git')) u.pathname = u.pathname.replace(/\/$/, '') + '.git'
                                // Inject token for private repos if available
                                if (session?.accessToken && u.protocol === 'https:') {
                                  repoUrl = `https://x-access-token:${session.accessToken}@github.com${u.pathname}`
                                } else {
                                  repoUrl = u.toString()
                                }
                              } else {
                                repoUrl = parsed.url
                              }
                            } else {
                              // Build from fields
                              repoUrl = `https://github.com/${owner}/${repo}.git`
                              if (session?.accessToken) {
                                repoUrl = `https://x-access-token:${session.accessToken}@github.com/${owner}/${repo}.git`
                              }
                            }

                            const ws = await cloneRepoMutation.mutateAsync({ repoUrl, branch })
                            setFormData({
                              ...formData,
                              workspaceId: ws.id,
                              name: ws.name || (repo as string),
                              slug: (ws.name || (repo as string)).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                            })
                          } catch (e: any) {
                            addToast({ type: 'error', title: 'Clone failed', description: e?.message || 'Could not clone repository' })
                          }
                        }}
                        disabled={cloneRepoMutation.isLoading || (!repoUrlInput && (!(formData as any).githubOwner || !(formData as any).githubRepo))}
                        className="bg-accent text-black hover:bg-accent/90"
                      >
                        {cloneRepoMutation.isLoading ? 'Cloning…' : 'Clone from GitHub'}
                      </Button>
                      {formData.workspaceId && (
                        <span className="text-xs text-success">Workspace ready ✓</span>
                      )}
                    </div>
                  </motion.div>
                )}
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
                    <Switch checked={formData.autoDeploy} onCheckedChange={(v: boolean) => setFormData({ ...formData, autoDeploy: v })} />
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
                    <Switch checked={formData.branchProtection} onCheckedChange={(v: boolean) => setFormData({ ...formData, branchProtection: v })} />
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
                    <Switch checked={formData.autoMerge} onCheckedChange={(v: boolean) => setFormData({ ...formData, autoMerge: v })} />
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
                    <Switch checked={formData.passwordProtected} onCheckedChange={(v: boolean) => setFormData({ ...formData, passwordProtected: v })} />
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
                    <Switch checked={formData.enableWAF} onCheckedChange={(v: boolean) => setFormData({ ...formData, enableWAF: v })} />
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
                    <Switch checked={formData.enableCollaboration} onCheckedChange={(v: boolean) => setFormData({ ...formData, enableCollaboration: v })} />
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
                        <Switch checked={formData.requireApproval} onCheckedChange={(v: boolean) => setFormData({ ...formData, requireApproval: v })} />
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
                    <Switch checked={formData.enableCaching} onCheckedChange={(v: boolean) => setFormData({ ...formData, enableCaching: v })} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h5 className="font-medium">Analytics & Monitoring</h5>
                      <p className="text-sm text-gray-400">Track performance and usage metrics</p>
                    </div>
                    <Switch checked={formData.enableAnalytics} onCheckedChange={(v: boolean) => setFormData({ ...formData, enableAnalytics: v })} />
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
