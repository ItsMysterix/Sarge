'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Github, Lock, Globe, FolderOpen, Download } from 'lucide-react'
import { trpc } from '@/lib/trpc'

interface Repo {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  clone_url: string
  updated_at: string
  language: string | null
  stargazers_count: number
}

interface ConnectRepoModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (repo: Repo) => void
}

type WorkspaceMode = 'select' | 'clone' | 'local'

export function ConnectRepoModal({ isOpen, onClose, onConnect }: ConnectRepoModalProps) {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [mode, setMode] = useState<WorkspaceMode>('select')
  const [localPath, setLocalPath] = useState('')
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)

  const t = trpc as any

  useEffect(() => {
    if (isOpen) {
      fetchRepos()
    }
  }, [isOpen])

  const fetchRepos = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Fetching repositories from GitHub...')
      const response = await fetch('/api/github/repos')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch repositories')
      }
      const data = await response.json()
      
      // Check if data has error property (for edge cases)
      if (data.error) {
        throw new Error(data.error)
      }
      
      console.log(`✅ Loaded ${data.length} repositories from GitHub`)
      setRepos(data)
      
      if (data.length === 0) {
        setError('No repositories found in your GitHub account')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load repositories'
      setError(errorMessage)
      console.error('❌ Error fetching repos:', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConnect = async () => {
    if (mode === 'clone' && selectedRepo) {
      // Clone repository to workspace
      setWorkspaceLoading(true)
      setWorkspaceError(null)
      try {
        const result = await t.sarge.oneclick.workspaces.cloneRepo.mutate({
          repoUrl: selectedRepo.clone_url,
          branch: 'main'
        })
        console.log('✅ Cloned to workspace:', result)
        onConnect(selectedRepo)
        onClose()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to clone repository'
        setWorkspaceError(errorMessage)
        console.error('❌ Error cloning repo:', errorMessage)
      } finally {
        setWorkspaceLoading(false)
      }
    } else if (mode === 'local' && localPath) {
      // Register local folder as workspace
      setWorkspaceLoading(true)
      setWorkspaceError(null)
      try {
        const result = await t.sarge.oneclick.workspaces.registerLocal.mutate({
          localPath
        })
        console.log('✅ Registered local workspace:', result)
        // Create a fake repo object for the local path
        const fakeRepo: Repo = {
          id: Date.now(),
          name: localPath.split('/').pop() || 'local',
          full_name: localPath,
          description: 'Local folder',
          private: true,
          html_url: '',
          clone_url: '',
          updated_at: new Date().toISOString(),
          language: null,
          stargazers_count: 0
        }
        onConnect(fakeRepo)
        onClose()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to register local folder'
        setWorkspaceError(errorMessage)
        console.error('❌ Error registering local folder:', errorMessage)
      } finally {
        setWorkspaceLoading(false)
      }
    } else if (selectedRepo) {
      // Default behavior: just connect without workspace management
      onConnect(selectedRepo)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card border border-white/10 rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <Github className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold">
                {mode === 'select' ? 'Connect Repository' : mode === 'clone' ? 'Clone to Workspace' : 'Use Local Folder'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Selection */}
          {mode === 'select' && (
            <div className="p-6 border-b border-white/10">
              <p className="text-sm text-gray-400 mb-4">Choose how to add your project:</p>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  onClick={() => setMode('clone')}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-accent/50 hover:bg-white/10 transition-all text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-6 h-6 text-accent mb-2" />
                  <h3 className="font-semibold mb-1">Clone from GitHub</h3>
                  <p className="text-xs text-gray-400">Clone a repository to local workspace (~/.sarge/workspaces/)</p>
                </motion.button>
                <motion.button
                  onClick={() => setMode('local')}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-accent/50 hover:bg-white/10 transition-all text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FolderOpen className="w-6 h-6 text-accent mb-2" />
                  <h3 className="font-semibold mb-1">Use Local Folder</h3>
                  <p className="text-xs text-gray-400">Point to an existing local project folder</p>
                </motion.button>
              </div>
            </div>
          )}

          {/* Search */}
          {mode === 'clone' && (
            <div className="p-6 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search repositories..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              {!loading && repos.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Showing {filteredRepos.length} of {repos.length} repositories
                </p>
              )}
            </div>
          )}

          {/* Local Path Input */}
          {mode === 'local' && (
            <div className="p-6 border-b border-white/10">
              <label className="block text-sm text-gray-400 mb-2">Local Project Path</label>
              <input
                type="text"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="/Users/username/projects/my-app"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter the absolute path to your local project folder
              </p>
              {workspaceError && (
                <p className="text-xs text-red-400 mt-2">{workspaceError}</p>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {mode === 'clone' && (
              <>
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      className="rounded-full h-12 w-12 border-b-2 border-accent"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    />
                  </div>
                )}

                {error && (
                  <div className="text-center py-12">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                      onClick={fetchRepos}
                      className="px-4 py-2 bg-accent/20 text-accent hover:bg-accent/30 rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {!loading && !error && filteredRepos.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No repositories found</p>
                  </div>
                )}

                {!loading && !error && filteredRepos.length > 0 && (
                  <div className="space-y-2">
                    {filteredRepos.map((repo) => (
                      <motion.button
                        key={repo.id}
                        onClick={() => setSelectedRepo(repo)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          selectedRepo?.id === repo.id
                            ? 'bg-accent/20 border-accent/50'
                            : 'bg-white/5 border-white/10 hover:border-accent/30'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-sm">{repo.name}</span>
                              {repo.private ? (
                                <Lock className="w-3 h-3 text-yellow-400" />
                              ) : (
                                <Globe className="w-3 h-3 text-gray-400" />
                              )}
                              {repo.language && (
                                <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full">
                                  {repo.language}
                                </span>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-xs text-gray-400 mb-2">{repo.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>⭐ {repo.stargazers_count}</span>
                              <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </>
            )}

            {mode === 'local' && (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 text-accent/50 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">Enter the path to your local project folder</p>
                <p className="text-xs text-gray-500">
                  Sarge will register this folder as a workspace without copying files
                </p>
              </div>
            )}

            {mode === 'select' && (
              <div className="text-center py-12">
                <Github className="w-16 h-16 text-accent/50 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">Choose an option above to continue</p>
                <p className="text-xs text-gray-500">
                  Clone from GitHub or use an existing local folder
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <div>
              {mode === 'clone' && selectedRepo && (
                <p className="text-sm text-gray-400">Selected: {selectedRepo.full_name}</p>
              )}
              {mode === 'local' && localPath && (
                <p className="text-sm text-gray-400">Path: {localPath}</p>
              )}
              {mode === 'select' && (
                <p className="text-sm text-gray-400">Choose an option to continue</p>
              )}
            </div>
            <div className="flex space-x-3">
              {mode !== 'select' && (
                <button
                  onClick={() => {
                    setMode('select')
                    setSelectedRepo(null)
                    setLocalPath('')
                    setWorkspaceError(null)
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {mode !== 'select' && (
                <button
                  onClick={handleConnect}
                  disabled={
                    (mode === 'clone' && !selectedRepo) ||
                    (mode === 'local' && !localPath) ||
                    workspaceLoading
                  }
                  className="px-4 py-2 bg-accent text-black hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {workspaceLoading ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      />
                      {mode === 'clone' ? 'Cloning...' : 'Registering...'}
                    </>
                  ) : (
                    <>
                      {mode === 'clone' ? 'Clone & Connect' : 'Register & Connect'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
