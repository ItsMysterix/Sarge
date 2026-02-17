"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, Rocket } from "lucide-react"
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
  const [creating, setCreating] = useState(false)
  
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")

  const t = trpc as any
  const createProjectMutation = t.project.create.useMutation()

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) {
      addToast({ 
        type: 'error', 
        title: 'Missing info', 
        description: 'Please provide a project name' 
      })
      return
    }
    
    try {
      setCreating(true)
      // Create a minimal project record - workspace can be added later from project detail page
      const project = await createProjectMutation.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
        workspaceId: '', // Empty initially; user will add workspace from project page
      })
      
      addToast({
        type: "success",
        title: "Project Created!",
        description: `${name} is ready to configure`,
      })

      if (onComplete) {
        onComplete(project)
      } else {
        router.push(`/projects/${slug}`)
      }
    } catch (e: any) {
      addToast({ 
        type: 'error', 
        title: 'Creation failed', 
        description: e?.message || 'Could not create project' 
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
        className="glass-card border border-white/10 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Create Project</h2>
                <p className="text-sm text-gray-400">Start a new project</p>
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
          <div>
            <label className="block text-sm font-medium mb-2">Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                const autoSlug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                setSlug(autoSlug)
              }}
              placeholder="My Awesome Project"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Project Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="my-awesome-project"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent/70 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used in URLs: /projects/{slug || 'your-slug'}
            </p>
          </div>

          <div className="pt-4">
            <p className="text-sm text-gray-400 mb-4">
              After creating your project, you'll be able to add a workspace, configure one-click deployment, and manage settings.
            </p>
            
            <Button
              onClick={handleCreate}
              disabled={creating || !name.trim() || !slug.trim()}
              className="w-full bg-accent text-black hover:bg-accent/90 flex items-center justify-center gap-2"
            >
              {creating ? (
                'Creating...'
              ) : (
                <>
                  <Rocket className="h-5 w-5" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
