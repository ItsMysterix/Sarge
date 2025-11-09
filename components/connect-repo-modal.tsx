'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Github, Lock, Globe } from 'lucide-react'

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

export function ConnectRepoModal({ isOpen, onClose, onConnect }: ConnectRepoModalProps) {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchRepos()
    }
  }, [isOpen])

  const fetchRepos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/github/repos')
      if (!response.ok) {
        throw new Error('Failed to fetch repositories')
      }
      const data = await response.json()
      setRepos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repositories')
    } finally {
      setLoading(false)
    }
  }

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConnect = () => {
    if (selectedRepo) {
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
              <h2 className="text-xl font-bold">Connect Repository</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
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
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {selectedRepo ? `Selected: ${selectedRepo.full_name}` : 'Select a repository'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={!selectedRepo}
                className="px-4 py-2 bg-accent text-black hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
