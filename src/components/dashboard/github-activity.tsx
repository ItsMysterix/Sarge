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
        <div className="flex flex-col gap-4">
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
              className="px-4 py-2 text-accent bg-gradient-to-br from-white/[0.07] to-white/[0.03] hover:bg-accent/20 hover:glow-accent border border-accent/30 rounded-lg text-sm backdrop-blur-sm transition-all duration-300"
            >
              Connect Repository
            </motion.button>
          </div>
          <div className="text-xs text-gray-500 flex items-start gap-2 pt-2 border-t border-white/10">
            <span className="text-accent">💡</span>
            <span>Pro tip: You can use <span className="text-accent font-medium">Quick Deploy</span> to test the platform without connecting a repository.</span>
          </div>
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* App icon */}
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-xl">
            N
          </div>
          <div>
            <div className="font-semibold text-lg">sarge</div>
            <div className="text-xs text-gray-400">v0-sarge.vercel.app</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={repoInfo?.html_url || `https://github.com/${repoInfo?.full_name || repository?.full_name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-xs text-gray-300 hover:text-accent transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.36 5.47 15.32C5.87 15.39 6.02 15.14 6.02 14.93C6.02 14.74 6.01 14.19 6.01 13.5C4 13.91 3.48 12.77 3.48 12.77C3.13 11.97 2.63 11.76 2.63 11.76C1.89 11.27 2.68 11.28 2.68 11.28C3.5 11.34 3.94 12.13 3.94 12.13C4.68 13.34 5.82 13 6.27 12.8C6.34 12.31 6.53 12 6.74 11.81C4.91 11.62 2.99 10.92 2.99 7.79C2.99 6.89 3.32 6.18 3.87 5.63C3.79 5.44 3.5 4.59 3.95 3.45C3.95 3.45 4.62 3.26 6.01 4.17C6.65 4 7.35 3.92 8.05 3.92C8.75 3.92 9.45 4 10.09 4.17C11.48 3.26 12.15 3.45 12.15 3.45C12.6 4.59 12.31 5.44 12.23 5.63C12.78 6.18 13.11 6.89 13.11 7.79C13.11 10.93 11.18 11.61 9.35 11.8C9.62 12.04 9.85 12.54 9.85 13.32C9.85 14.36 9.84 14.72 9.84 14.93C9.84 15.14 9.99 15.4 10.39 15.32C13.57 14.36 15.86 11.54 15.86 8C15.86 3.58 12.42 0 8 0Z" fill="currentColor"/></svg>
            <span className="font-mono">{repoInfo?.full_name || repository?.full_name}</span>
          </a>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-400">{commits[0]?.commit?.message || 'UI: fix GitHub activity connected state & raise toast z-index above header'}</span>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-400">{commits[0] ? `${Math.floor((Date.now() - new Date(commits[0].commit.author.date).getTime()) / 60000)}m ago` : ''}</span>
        <span className="text-xs text-gray-400">on</span>
        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"></path></svg>
        <span className="text-xs text-gray-400 font-mono">{repoInfo?.default_branch || repository?.default_branch || 'main'}</span>
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
