'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FolderOpen, Github, Trash2, RefreshCw, PlayCircle, Plus } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useRouter } from 'next/navigation'

interface Workspace {
  id: string
  name: string
  source: 'github' | 'local'
  path: string
  repoUrl?: string
  branch?: string
  lastUsed: Date
  createdAt: Date
}

export default function WorkspacesPage() {
  const router = useRouter()
  const t = trpc as any
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pullingId, setPullingId] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await t.sarge.oneclick.workspaces.list.query()
      setWorkspaces(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workspaces'
      setError(errorMessage)
      console.error('❌ Error fetching workspaces:', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workspace?')) return
    
    setDeletingId(id)
    try {
      await t.sarge.oneclick.workspaces.delete.mutate({ workspaceId: id })
      setWorkspaces(workspaces.filter(w => w.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete workspace'
      console.error('❌ Error deleting workspace:', errorMessage)
      alert(`Failed to delete workspace: ${errorMessage}`)
    } finally {
      setDeletingId(null)
    }
  }

  const handlePull = async (id: string) => {
    setPullingId(id)
    try {
      await t.sarge.oneclick.workspaces.pull.mutate({ workspaceId: id })
      alert('Successfully pulled latest changes!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pull changes'
      console.error('❌ Error pulling changes:', errorMessage)
      alert(`Failed to pull changes: ${errorMessage}`)
    } finally {
      setPullingId(null)
    }
  }

  const handleStartLocally = (workspace: Workspace) => {
    // Navigate to one-click deploy page with workspace ID
    router.push(`/oneclick?workspaceId=${workspace.id}`)
  }

  return (
    <div className="min-h-screen bg-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Workspaces</h1>
            <p className="text-gray-400">Manage your local development workspaces</p>
          </div>
          <motion.button
            onClick={() => router.push('/oneclick')}
            className="px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            Add Workspace
          </motion.button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <motion.div
              className="w-12 h-12 border-b-2 border-accent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="glass-card p-6 border border-red-500/30">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchWorkspaces}
              className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && workspaces.length === 0 && (
          <motion.div
            className="glass-card p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FolderOpen className="w-20 h-20 text-accent/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Workspaces Yet</h2>
            <p className="text-gray-400 mb-6">
              Create your first workspace by cloning a GitHub repo or registering a local folder
            </p>
            <motion.button
              onClick={() => router.push('/oneclick')}
              className="px-6 py-3 bg-accent text-black rounded-lg hover:bg-accent/90 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Add Workspace
            </motion.button>
          </motion.div>
        )}

        {/* Workspaces Grid */}
        {!loading && !error && workspaces.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <motion.div
                key={workspace.id}
                className="glass-card p-6 border border-white/10 hover:border-accent/30 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                    {workspace.source === 'github' ? (
                      <Github className="w-6 h-6 text-accent" />
                    ) : (
                      <FolderOpen className="w-6 h-6 text-accent" />
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 bg-white/10 rounded-full">
                    {workspace.source}
                  </span>
                </div>

                {/* Name & Path */}
                <h3 className="text-lg font-semibold mb-2 truncate">{workspace.name}</h3>
                <p className="text-xs text-gray-400 mb-1 truncate" title={workspace.path}>
                  {workspace.path}
                </p>
                {workspace.repoUrl && (
                  <p className="text-xs text-gray-500 mb-4 truncate" title={workspace.repoUrl}>
                    {workspace.repoUrl}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pt-4 border-t border-white/10">
                  <span>Last used: {new Date(workspace.lastUsed).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => handleStartLocally(workspace)}
                    className="flex-1 px-3 py-2 bg-accent/20 text-accent hover:bg-accent/30 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PlayCircle className="w-4 h-4" />
                    Start
                  </motion.button>
                  
                  {workspace.source === 'github' && (
                    <motion.button
                      onClick={() => handlePull(workspace.id)}
                      disabled={pullingId === workspace.id}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Pull latest changes"
                    >
                      {pullingId === workspace.id ? (
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </motion.button>
                  )}
                  
                  <motion.button
                    onClick={() => handleDelete(workspace.id)}
                    disabled={deletingId === workspace.id}
                    className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors text-sm disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Delete workspace"
                  >
                    {deletingId === workspace.id ? (
                      <motion.div
                        className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
