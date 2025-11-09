"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Layers, Plus, Archive, Play, Pause, StopCircle, AlertCircle, CheckCircle2, Cpu, Database as DatabaseIcon } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/components/ui/toast"

export default function StacksPage() {
  const [stacks, setStacks] = useState<any[]>([])
  const [showEmptyState, setShowEmptyState] = useState(false)
  const { addToast, ToastContainer } = useToast()
  
  const t = trpc as any
  const stacksQuery = t.stacks.list.useQuery()
  const updateStatusMutation = t.stacks.updateStatus.useMutation()

  useEffect(() => {
    if (stacksQuery.data) {
      setStacks(stacksQuery.data)
    }
  }, [stacksQuery.data])

  // Show empty state after 2 seconds if still loading with no data
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stacks.length === 0 && !stacksQuery.isError) {
        setShowEmptyState(true)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [stacks.length, stacksQuery.isError])

  const handleToggleStack = async (stack: any) => {
    const newStatus = stack.status === 'running' ? 'stopped' : 'running'
    
    try {
      await updateStatusMutation.mutateAsync({
        id: stack.id,
        status: newStatus
      })
      
      // Update local state
      setStacks(stacks.map(s => 
        s.id === stack.id ? { ...s, status: newStatus } : s
      ))
      
      addToast({
        type: 'success',
        title: `Stack ${newStatus === 'running' ? 'Started' : 'Stopped'}`,
        description: `${stack.name} is now ${newStatus}`
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        description: 'Failed to update stack status'
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'running': return <CheckCircle2 className="w-4 h-4 text-success" />
      case 'stopped': return <StopCircle className="w-4 h-4 text-gray-400" />
      case 'error': return <AlertCircle className="w-4 h-4 text-error" />
      case 'deploying': return <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      default: return null
    }
  }

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      <Sidebar />
      <ToastContainer />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Stacks</h1>
              </div>
              <button className="glass-card px-4 py-2 text-accent hover:bg-accent/20 transition-all duration-300 rounded-lg border border-accent/30 flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Create Stack
              </button>
            </div>
            <p className="text-sm sm:text-base text-gray-400">
              Compose services into applications—define what runs together · {stacks.length} stack{stacks.length !== 1 ? 's' : ''}
            </p>
          </motion.div>

          {/* Loading State */}
          {stacksQuery.isLoading && !showEmptyState && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <motion.div
                  className="rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
                <p className="text-gray-400">Loading stacks...</p>
              </div>
            </div>
          )}

          {/* Empty State - Show after loading timeout or when no data */}
          {(showEmptyState || (!stacksQuery.isLoading && stacks.length === 0)) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="glass-card p-8 sm:p-12 text-center border border-white/10 rounded-lg"
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 glass-card rounded-full border border-accent/30">
                  <Layers className="w-12 h-12 text-accent" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3">No stacks yet</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Create a stack to compose services (S3, DynamoDB, Lambda, your APIs) into a cohesive application. 
                Each stack runs independently with its own resources and logs.
              </p>
              <button className="px-6 py-3 text-accent bg-gradient-to-br from-white/[0.07] to-white/[0.03] hover:bg-accent/20 hover:glow-accent transition-all duration-300 rounded-lg border border-accent/30 flex items-center mx-auto backdrop-blur-sm">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Stack
              </button>
              <div className="mt-8 pt-8 border-t border-white/10">
                <p className="text-sm text-gray-500 mb-4">Quick examples:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                  <div className="glass-card p-4 border border-white/5 rounded">
                    <div className="text-accent font-semibold mb-2">Web + API + DB</div>
                    <p className="text-xs text-gray-400">Frontend, backend, and DynamoDB table</p>
                  </div>
                  <div className="glass-card p-4 border border-white/5 rounded">
                    <div className="text-accent font-semibold mb-2">Serverless Pipeline</div>
                    <p className="text-xs text-gray-400">Lambda + S3 event triggers</p>
                  </div>
                  <div className="glass-card p-4 border border-white/5 rounded">
                    <div className="text-accent font-semibold mb-2">Microservices</div>
                    <p className="text-xs text-gray-400">Multiple services with shared CloudWatch logs</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stacks Grid */}
          {!stacksQuery.isLoading && stacks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stacks.map((stack, index) => (
                <motion.div
                  key={stack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="glass-card p-6 border border-white/10 rounded-lg hover:border-accent/30 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{stack.name}</h3>
                        {getStatusIcon(stack.status)}
                      </div>
                      <p className="text-xs text-gray-400">{stack.description || 'No description'}</p>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-2">Services ({stack.services?.length || 0})</div>
                    <div className="flex flex-wrap gap-1">
                      {stack.services?.slice(0, 4).map((service: any, idx: number) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-accent/10 text-accent rounded">
                          {service.name}
                        </span>
                      ))}
                      {stack.services?.length > 4 && (
                        <span className="px-2 py-1 text-xs bg-white/5 text-gray-400 rounded">
                          +{stack.services.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resource Usage */}
                  {stack.resource_usage && (
                    <div className="mb-4 p-3 bg-white/5 rounded">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {stack.resource_usage.cpu && (
                          <div className="flex items-center gap-1">
                            <Cpu className="w-3 h-3 text-accent" />
                            <span className="text-gray-400">CPU:</span>
                            <span className="font-medium">{stack.resource_usage.cpu}%</span>
                          </div>
                        )}
                        {stack.resource_usage.memory && (
                          <div className="flex items-center gap-1">
                            <DatabaseIcon className="w-3 h-3 text-warning" />
                            <span className="text-gray-400">RAM:</span>
                            <span className="font-medium">{stack.resource_usage.memory}MB</span>
                          </div>
                        )}
                        {stack.resource_usage.containers !== undefined && (
                          <div className="col-span-2 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-info" />
                            <span className="text-gray-400">Containers:</span>
                            <span className="font-medium">{stack.resource_usage.containers}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStack(stack)}
                      disabled={updateStatusMutation.isPending}
                      className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                        stack.status === 'running'
                          ? 'bg-error/20 text-error hover:bg-error/30 border border-error/30'
                          : 'bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {stack.status === 'running' ? (
                        <>
                          <Pause className="w-4 h-4 inline mr-1" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 inline mr-1" />
                          Start
                        </>
                      )}
                    </button>
                    <button className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-sm transition-all">
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Metadata */}
                  <div className="mt-4 pt-4 border-t border-white/5 text-xs text-gray-500">
                    Updated {new Date(stack.updated_at).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

