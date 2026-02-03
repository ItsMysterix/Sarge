"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { AppShell } from '@/components/layout/app-shell'
import { useToast } from '@/components/ui/toast'
import { 
  ArrowLeft, RefreshCw, Download, GitBranch, Clock, 
  CheckCircle2, XCircle, Loader2, Square, ExternalLink,
  Terminal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

export default function DeploymentDetailPage({ params }: { params: { id: string } }) {
  const id = params.id
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()
  
  const t = trpc as any
  
  // Queries
  const deploymentsQuery = t.deploy.getDeployments.useQuery(
    { limit: 100 }, 
    { refetchInterval: 5000 }
  )
  const logsQuery = t.deploy.getLogs.useQuery(
    { deploymentId: id }, 
    { enabled: !!id, refetchInterval: 2000 }
  )
  
  // Mutations
  const stopMutation = t.deploy.stopDeployment.useMutation()
  const createMutation = t.deploy.create.useMutation()
  
  // Find deployment from list
  const deployment = useMemo(() => {
    const items = deploymentsQuery.data?.items || deploymentsQuery.data || []
    return items.find((d: any) => String(d.id) === id)
  }, [deploymentsQuery.data, id])

  // Logs
  const logs = logsQuery.data || []

  const handleStop = async () => {
    try {
      await stopMutation.mutateAsync({ deploymentId: id })
      addToast({ type: 'success', title: 'Deployment stopped' })
      deploymentsQuery.refetch()
    } catch (e) {
      addToast({ type: 'error', title: 'Failed to stop deployment' })
    }
  }

  const handleRerun = async () => {
    if (!deployment) return
    try {
      const result = await createMutation.mutateAsync({
        branch: deployment.branch || 'main',
        commit: deployment.commit,
        summary: `Re-run: ${deployment.summary || 'Deployment'}`,
        services: deployment.services || [],
        provider: deployment.provider || 'aws',
        environment: deployment.environment || 'preview',
      })
      addToast({ type: 'success', title: 'Deployment restarted' })
      if (result?.id) {
        router.push(`/deployments/${result.id}`)
      }
    } catch (e) {
      addToast({ type: 'error', title: 'Failed to restart deployment' })
    }
  }

  const exportLogs = () => {
    const text = logs.map((l: any) => 
      `[${l.timestamp || ''}] ${l.step ? `[${l.step}] ` : ''}${l.message}`
    ).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deployment-${id.slice(0, 8)}-logs.txt`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: 'Logs exported' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-emerald-400'
      case 'running': return 'text-amber-400'
      case 'failed': return 'text-red-400'
      default: return 'text-zinc-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case 'running': return <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Clock className="w-5 h-5 text-zinc-500" />
    }
  }

  if (deploymentsQuery.isLoading) {
    return (
      <AppShell>
        <div className="p-6 flex items-center justify-center flex-1">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  if (!deployment) {
    return (
      <AppShell>
        <div className="p-6 max-w-4xl mx-auto">
          <button 
            onClick={() => router.push('/deployments')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Deployments
          </button>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Deployment not found</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <ToastContainer />
      <div className="p-6 max-w-4xl mx-auto animate-fade-in">
        
        {/* Back */}
        <button 
          onClick={() => router.push('/deployments')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deployments
        </button>

        {/* Header Card */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(deployment.status)}
              <div>
                <h1 className="text-lg font-semibold">
                  {deployment.summary || 'Deployment'}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                  <code className="text-xs bg-black/30 px-1.5 py-0.5 rounded">
                    #{id.slice(0, 8)}
                  </code>
                  <span className={cn("capitalize", getStatusColor(deployment.status))}>
                    {deployment.status}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={exportLogs}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              
              {deployment.status === 'running' ? (
                <button
                  onClick={handleStop}
                  disabled={stopMutation.isPending}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  <Square className="w-3.5 h-3.5" />
                  {stopMutation.isPending ? 'Stopping...' : 'Stop'}
                </button>
              ) : (
                <button
                  onClick={handleRerun}
                  disabled={createMutation.isPending}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-white/10 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", createMutation.isPending && "animate-spin")} />
                  {createMutation.isPending ? 'Starting...' : 'Re-run'}
                </button>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/[0.06]">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Branch</div>
              <div className="flex items-center gap-1.5 text-sm">
                <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                {deployment.branch || 'main'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Commit</div>
              <code className="text-xs bg-black/30 px-1.5 py-0.5 rounded">
                {deployment.commit?.slice(0, 7) || '-'}
              </code>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Provider</div>
              <div className="text-sm capitalize">{deployment.provider || 'aws'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Created</div>
              <div className="text-sm">
                {deployment.created_at 
                  ? formatDistanceToNow(new Date(deployment.created_at)) + ' ago'
                  : '-'
                }
              </div>
            </div>
          </div>

          {/* URL if available */}
          {deployment.url && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <a 
                href={deployment.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-4 h-4" />
                {deployment.url}
              </a>
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Build Logs</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {logsQuery.isLoading && (
                <span className="animate-pulse">Loading...</span>
              )}
              {logs.length > 0 && (
                <span>{logs.length} entries</span>
              )}
              {deployment.status === 'running' && (
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto bg-black/30 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {logsQuery.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <>
                    <p>No logs available</p>
                    <p className="text-[10px] mt-1">Logs will appear when the build starts</p>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {logs.map((log: any, i: number) => (
                  <div 
                    key={log.id || i} 
                    className="px-4 py-2 hover:bg-white/[0.02] flex gap-3"
                  >
                    <span className="text-muted-foreground shrink-0 w-16">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                    </span>
                    {log.step && (
                      <span className="text-blue-400 shrink-0 w-20">[{log.step}]</span>
                    )}
                    <span className={cn(
                      log.message?.toLowerCase().includes('error') && 'text-red-400',
                      log.message?.toLowerCase().includes('success') && 'text-emerald-400',
                      log.message?.toLowerCase().includes('warning') && 'text-amber-400'
                    )}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
