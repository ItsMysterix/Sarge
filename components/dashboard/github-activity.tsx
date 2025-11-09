'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lightbulb, AlertTriangle } from 'lucide-react'
import { trpc } from '@/lib/trpc'

interface GitHubActivityProps {
  repository: any
  loading: boolean
  onConnectClick: () => void
}

export function GitHubActivity({ repository, loading, onConnectClick }: GitHubActivityProps) {
  const router = useRouter()
  const t = trpc as any
  
  const [repoInfo, setRepoInfo] = useState<any>(null)
  const [commits, setCommits] = useState<any[]>([])
  
  // Fetch GitHub data when repository is available
  useEffect(() => {
    if (repository?.owner && repository?.repo) {
      const fetchData = async () => {
        try {
          const info = await fetch(`https://api.github.com/repos/${repository.owner}/${repository.repo}`)
          if (info.ok) {
            const infoData = await info.json()
            setRepoInfo(infoData)
          }
          
          const commitsRes = await fetch(`https://api.github.com/repos/${repository.owner}/${repository.repo}/commits?per_page=5`)
          if (commitsRes.ok) {
            const commitsData = await commitsRes.json()
            setCommits(commitsData)
          }
        } catch (error) {
          console.error('Error fetching GitHub data:', error)
        }
      }
      fetchData()
    }
  }, [repository])

  if (loading) {
    return (
      <motion.div 
        className="glass-card p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center py-8 text-gray-400">
          <motion.div 
            className="h-6 w-6 border-b-2 border-accent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
          Loading repository data...
        </div>
      </motion.div>
    )
  }

  if (!repository) {
    return (
      <motion.div 
        className="glass-card p-6 mb-6 border border-warning/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-warning" />
            <div>
              <h2 className="text-xl font-semibold">Connect GitHub Repository</h2>
              <p className="text-sm text-gray-400">Connect a repository to see real-time activity and insights</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onConnectClick}
            className="px-4 py-2 bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30 rounded-lg text-sm"
          >
            Connect Repository
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="glass-card p-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <motion.div
            whileHover={{ scale: 1.2, rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Lightbulb className="w-6 h-6 text-accent" />
          </motion.div>
          <div>
            <h2 className="text-xl font-semibold">Repository Activity</h2>
            <p className="text-sm text-gray-400">{repository.full_name}</p>
          </div>
        </div>
        {repoInfo && (
          <div className="flex gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <span className="text-warning">★</span>
              <span>{repoInfo.stargazers_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🔀</span>
              <span>{repoInfo.forks_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-error" />
              <span>{repoInfo.open_issues_count}</span>
            </div>
          </div>
        )}
      </div>

      {commits.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Commits</h3>
          {commits.map((commit: any, i: number) => (
            <motion.div 
              key={commit.sha}
              className="p-4 glass-card rounded-lg border border-white/10 hover:border-accent/30 transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ scale: 1.01, x: 5 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm text-gray-300 mb-2">{commit.commit.message}</div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-gray-500">
                      by <span className="text-accent">{commit.commit.author.name}</span>
                    </span>
                    <span className="text-gray-500">
                      {new Date(commit.commit.author.date).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-accent/10 text-accent font-mono">
                      {commit.sha.substring(0, 7)}
                    </span>
                  </div>
                </div>
                <motion.a
                  href={commit.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs text-accent hover:bg-accent/10 rounded border border-accent/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View
                </motion.a>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No recent commits found
        </div>
      )}
    </motion.div>
  )
}
