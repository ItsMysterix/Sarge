'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderGit2, Github, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'

interface Repository {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  default_branch: string
  language?: string
  stargazers_count?: number
  updated_at?: string
  // Derived for convenience
  owner?: string
  repo?: string
  branch?: string
}

interface StepSelectRepoProps {
  onRepoSelected: (repo: Repository) => void
}

export function StepSelectRepo({ onRepoSelected }: StepSelectRepoProps) {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)

  useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch live repositories from GitHub API (includes public + private)
      const response = await fetch('/api/github/repos')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch repositories')
      }
      
      const repos = await response.json()
      
      // Transform GitHub API response to component format
      // Extract owner/repo from full_name and add derived fields
      const formattedRepos = repos.map((repo: any) => {
        const [owner, repoName] = repo.full_name.split('/')
        return {
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          owner, // Extracted for compatibility with auto-deploy.tsx
          repo: repoName, // Extracted for compatibility with auto-deploy.tsx
          branch: repo.default_branch, // Mapped for compatibility
          private: repo.private,
          html_url: repo.html_url,
          default_branch: repo.default_branch,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          updated_at: repo.updated_at,
        }
      })
      
      setRepositories(formattedRepos)
    } catch (err) {
      console.error('Error fetching repositories:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load repositories'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepo(repo)
  }

  const handleContinue = () => {
    if (selectedRepo) {
      onRepoSelected(selectedRepo)
    }
  }

  const handleConnectGitHub = () => {
    window.location.href = '/api/auth/signin?callbackUrl=/oneclick'
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-blue-400 mb-4" />
        <p className="text-gray-400">Loading your repositories...</p>
      </div>
    )
  }

  if (error && repositories.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Connection Error</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={fetchRepositories}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="h-5 w-5" />
          Retry
        </button>
      </div>
    )
  }

  if (repositories.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderGit2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Repositories Connected</h3>
        <p className="text-gray-400 mb-6">
          Connect your GitHub account to import repositories and deploy them with one click.
        </p>
        <button
          onClick={handleConnectGitHub}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
        >
          <Github className="h-5 w-5" />
          Connect GitHub
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Select a Repository</h2>
        <p className="text-sm md:text-base text-gray-400">
          Choose a repository to analyze and deploy. Our AI will detect the framework, ports, and tools automatically.
        </p>
      </div>

      {/* Repositories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {repositories.map((repo, index) => (
            <motion.button
              key={repo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelectRepo(repo)}
              className={`p-4 md:p-5 rounded-lg border-2 transition-all text-left group hover:scale-[1.02] ${
                selectedRepo?.id === repo.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <FolderGit2 className="h-5 w-5 text-white" />
                  </div>
                  {selectedRepo?.id === repo.id && (
                    <CheckCircle2 className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                {repo.private && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                    Private
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-base md:text-lg text-white group-hover:text-blue-400 transition-colors truncate">
                  {repo.name}
                </h3>
                <p className="text-sm text-gray-400 truncate">
                  {repo.full_name}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-gray-400">{repo.default_branch}</span>
                  </div>
                  {repo.language && (
                    <span className="text-xs text-gray-400">{repo.language}</span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
            <span className="text-blue-400">💡</span>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-white mb-1">What happens next?</h4>
            <p className="text-sm text-gray-400">
              Our AI will analyze your repository to detect:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-blue-400">•</span>
                Framework and runtime (Next.js, React, Node.js, etc.)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">•</span>
                Required ports for your application
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">•</span>
                Build tools and dependencies
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">•</span>
                Environment variables needed
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <button
          onClick={handleConnectGitHub}
          className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <Github className="h-4 w-4" />
          Connect more repositories
        </button>

        <button
          onClick={handleContinue}
          disabled={!selectedRepo}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          Continue with AI Analysis
          <motion.span
            initial={{ x: 0 }}
            animate={{ x: selectedRepo ? [0, 5, 0] : 0 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            →
          </motion.span>
        </button>
      </div>
    </div>
  )
}
