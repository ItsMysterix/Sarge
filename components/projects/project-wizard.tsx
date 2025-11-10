"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Sparkles, Github, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"

interface ProjectWizardProps {
  onComplete?: (workspace: any) => void
  onCancel?: () => void
}

export function ProjectWizard({ onComplete, onCancel }: ProjectWizardProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const { data: session } = useSession()
  const [creating, setCreating] = useState(false)
  
  const [source, setSource] = useState<"github" | "local" | null>(null)
  
  // GitHub clone fields
  const [repoUrlInput, setRepoUrlInput] = useState("")
  const [githubOwner, setGithubOwner] = useState("")
  const [githubRepo, setGithubRepo] = useState("")
  const [githubBranch, setGithubBranch] = useState("main")
  
  // Local registration field
  const [localPath, setLocalPath] = useState("")

  const t = trpc as any
  const cloneRepoMutation = t.sarge.oneclick.workspaces.cloneRepo.useMutation()
  const registerLocalMutation = t.sarge.oneclick.workspaces.registerLocal.useMutation()

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

  const handleCloneGitHub = async () => {
    const parsed = repoUrlInput ? parseRepoInput(repoUrlInput) : {}
    const owner = githubOwner || parsed.owner
    const repo = githubRepo || parsed.repo
    const branch = githubBranch || 'main'
    
    if (!owner || !repo) {
      addToast({ 
        type: 'error', 
        title: 'Missing info', 
        description: 'Provide owner/repo or paste a valid repository URL' 
      })
      return
    }
    
    try {
      setCreating(true)
      let repoUrl: string | undefined
      if (parsed.url && (/^git@/.test(parsed.url) || /^ssh:\/\//.test(parsed.url))) {
        repoUrl = parsed.url
      } else if (parsed.url && /^https?:\/\//.test(parsed.url)) {
        const u = new URL(parsed.url)
        if (u.hostname.endsWith('github.com')) {
          if (!u.pathname.endsWith('.git')) u.pathname = u.pathname.replace(/\/$/, '') + '.git'
          if (session?.accessToken && u.protocol === 'https:') {
            repoUrl = `https://x-access-token:${session.accessToken}@github.com${u.pathname}`
          } else {
            repoUrl = u.toString()
          }
        } else {
          repoUrl = parsed.url
        }
      } else {
        repoUrl = `https://github.com/${owner}/${repo}.git`
        if (session?.accessToken) {
          repoUrl = `https://x-access-token:${session.accessToken}@github.com/${owner}/${repo}.git`
        }
      }

      const workspace = await cloneRepoMutation.mutateAsync({ repoUrl, branch })
      
      addToast({
        type: "success",
        title: "Workspace Created!",
        description: `${workspace.name} cloned successfully`,
      })

      if (onComplete) {
        onComplete(workspace)
      } else {
        router.push('/projects')
      }
    } catch (e: any) {
      addToast({ 
        type: 'error', 
        title: 'Clone failed', 
        description: e?.message || 'Could not clone repository' 
      })
    } finally {
      setCreating(false)
    }
  }

  const handleRegisterLocal = async () => {
    if (!localPath.trim()) {
      addToast({ 
        type: 'error', 
        title: 'Missing path', 
        description: 'Provide a local folder path' 
      })
      return
    }
    
    try {
      setCreating(true)
      const workspace = await registerLocalMutation.mutateAsync({ localPath: localPath.trim() })
      
      addToast({
        type: "success",
        title: "Workspace Registered!",
        description: `${workspace.name} added successfully`,
      })

      if (onComplete) {
        onComplete(workspace)
      } else {
        router.push('/projects')
      }
    } catch (e: any) {
      addToast({ 
        type: 'error', 
        title: 'Registration failed', 
        description: e?.message || 'Could not register local folder' 
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Add Workspace</h2>
                <p className="text-sm text-gray-400">Clone from GitHub or register a local folder</p>
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
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!source && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold mb-4">Choose Source</h3>
              
              {/* GitHub Option */}
              <button
                onClick={() => setSource('github')}
                className="w-full p-6 rounded-lg border-2 border-white/10 hover:border-accent/40 text-left transition-all group"
              >
                <div className="flex items-start gap-4">
                  <Github className="w-8 h-8 text-accent flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">GitHub Repository</h4>
                    <p className="text-sm text-gray-400">
                      Clone a repository from GitHub (public or private)
                    </p>
                  </div>
                </div>
              </button>

              {/* Local Folder Option */}
              <button
                onClick={() => setSource('local')}
                className="w-full p-6 rounded-lg border-2 border-white/10 hover:border-accent/40 text-left transition-all group"
              >
                <div className="flex items-start gap-4">
                  <Folder className="w-8 h-8 text-accent flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">Local Folder</h4>
                    <p className="text-sm text-gray-400">
                      Register an existing folder on your machine
                    </p>
                  </div>
                </div>
              </button>
            </motion.div>
          )}

          {source === 'github' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Clone from GitHub</h3>
                <button
                  onClick={() => setSource(null)}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  ← Back
                </button>
              </div>

              {/* Paste full repo URL (optional) */}
              <div>
                <label className="block text-sm font-medium mb-2">Repository URL (optional)</label>
                <input
                  type="text"
                  value={repoUrlInput}
                  onChange={(e) => setRepoUrlInput(e.target.value)}
                  onBlur={() => {
                    if (!repoUrlInput) return
                    const parsed = parseRepoInput(repoUrlInput)
                    if (parsed.owner && !githubOwner) setGithubOwner(parsed.owner)
                    if (parsed.repo && !githubRepo) setGithubRepo(parsed.repo)
                  }}
                  placeholder="https://github.com/owner/repo or git@github.com:owner/repo.git"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Paste a full URL or fill the fields below</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Owner</label>
                  <input
                    type="text"
                    value={githubOwner}
                    onChange={(e) => setGithubOwner(e.target.value)}
                    placeholder="owner"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-accent/70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Repository</label>
                  <input
                    type="text"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="repo"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-accent/70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Branch</label>
                  <input
                    type="text"
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                    placeholder="main"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-accent/70"
                  />
                </div>
              </div>

              <Button
                onClick={handleCloneGitHub}
                disabled={creating || (!repoUrlInput && (!githubOwner || !githubRepo))}
                className="w-full bg-accent text-black hover:bg-accent/90"
              >
                {creating ? 'Cloning...' : 'Clone Repository'}
              </Button>
            </motion.div>
          )}

          {source === 'local' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Register Local Folder</h3>
                <button
                  onClick={() => setSource(null)}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  ← Back
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Folder Path</label>
                <input
                  type="text"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder="/path/to/your/project"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Absolute path to your local project folder</p>
              </div>

              <Button
                onClick={handleRegisterLocal}
                disabled={creating || !localPath.trim()}
                className="w-full bg-accent text-black hover:bg-accent/90"
              >
                {creating ? 'Registering...' : 'Register Folder'}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
