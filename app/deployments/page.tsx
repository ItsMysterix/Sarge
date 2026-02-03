"use client"
export const dynamic = 'force-dynamic'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { AppShell } from '@/components/layout/app-shell'
import { cn } from '@/lib/utils'
import { 
  Plus, GitBranch, Clock, CheckCircle2, XCircle, Loader2, 
  ArrowUpRight, Search, X, Rocket
} from 'lucide-react'

export default function DeploymentsPage() {
  const t = trpc as any
  const router = useRouter()
  
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  
  // Form state
  const [branch, setBranch] = useState("main")
  const [summary, setSummary] = useState("")
  const [provider, setProvider] = useState("aws")
  const [environment, setEnvironment] = useState("preview")
  
  // Queries & Mutations
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading,
    refetch
  } = t.deploy.getDeployments.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage: any) => lastPage.nextCursor,
      refetchInterval: 5000,
    }
  )
  
  const statsQuery = t.deploy.stats.useQuery()
  const createMutation = t.deploy.create.useMutation()

  const allItems = useMemo(() => {
    return data?.pages.flatMap((p: any) => p.items) || []
  }, [data])

  const items = useMemo(() => {
    return allItems.filter((r: any) => {
      const matchesSearch = !searchQuery || 
        r.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.branch?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = !statusFilter || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [allItems, searchQuery, statusFilter])

  const stats = statsQuery.data || {
    total: allItems.length,
    success: allItems.filter((d: any) => d.status === 'success').length,
    failed: allItems.filter((d: any) => d.status === 'failed').length,
    running: allItems.filter((d: any) => d.status === 'running').length,
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return d.toLocaleDateString()
  }

  const handleCreate = async () => {
    try {
      const result = await createMutation.mutateAsync({
        branch,
        summary: summary || `Deploy from ${branch}`,
        provider,
        environment,
        services: [],
      })
      setShowModal(false)
      setBranch("main")
      setSummary("")
      refetch()
      if (result?.id) {
        router.push(`/deployments/${result.id}`)
      }
    } catch (e) {
      console.error('Failed to create deployment:', e)
    }
  }

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Deployments</h1>
            <p className="text-sm text-muted-foreground">Track and monitor your deployment history</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Deployment
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
          <StatCard 
            label="Total" 
            value={stats.total} 
            onClick={() => setStatusFilter(null)}
            active={!statusFilter}
          />
          <StatCard 
            label="Success" 
            value={stats.success} 
            color="emerald"
            onClick={() => setStatusFilter(statusFilter === 'success' ? null : 'success')}
            active={statusFilter === 'success'}
          />
          <StatCard 
            label="Failed" 
            value={stats.failed} 
            color="red"
            onClick={() => setStatusFilter(statusFilter === 'failed' ? null : 'failed')}
            active={statusFilter === 'failed'}
          />
          <StatCard 
            label="Running" 
            value={stats.running} 
            color="amber"
            onClick={() => setStatusFilter(statusFilter === 'running' ? null : 'running')}
            active={statusFilter === 'running'}
          />
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search deployments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        {/* Deployments List */}
        <div className="glass-card divide-y divide-white/[0.06]">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No deployments found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter ? "Try adjusting your filters" : "Create your first deployment to get started"}
              </p>
              {!searchQuery && !statusFilter && (
                <button 
                  onClick={() => setShowModal(true)}
                  className="text-sm text-white hover:underline"
                >
                  Create deployment →
                </button>
              )}
            </div>
          ) : (
            <>
              {items.map((deploy: any) => (
                <div 
                  key={deploy.id}
                  className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  onClick={() => router.push(`/deployments/${deploy.id}`)}
                >
                  {/* Status */}
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    deploy.status === 'success' && "bg-emerald-500",
                    deploy.status === 'running' && "bg-amber-500 animate-pulse",
                    deploy.status === 'pending' && "bg-zinc-500",
                    deploy.status === 'failed' && "bg-red-500"
                  )} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate">
                        {deploy.summary || 'Deployment'}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {deploy.commit?.slice(0, 7)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        {deploy.branch || 'main'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(deploy.createdAt || deploy.created_at)}
                      </span>
                      {deploy.provider && (
                        <span className="capitalize">{deploy.provider}</span>
                      )}
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div className="shrink-0">
                    {deploy.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {deploy.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                    {deploy.status === 'running' && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
                  </div>

                  {/* Arrow */}
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              ))}
            </>
          )}
        </div>

        {/* Load More */}
        {hasNextPage && (
          <div className="mt-4 text-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-semibold">New Deployment</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Summary</label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Feature update, Bug fix"
                  className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg focus:outline-none focus:border-white/20"
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Branch</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg focus:outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Provider</label>
                <div className="flex gap-2">
                  {["aws", "vercel", "railway"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setProvider(p)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-sm border capitalize transition-all",
                        provider === p 
                          ? "border-white/20 bg-white/5 text-foreground" 
                          : "border-white/[0.06] text-muted-foreground hover:border-white/15"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Environment</label>
                <div className="flex gap-2">
                  {["preview", "staging", "production"].map((e) => (
                    <button
                      key={e}
                      onClick={() => setEnvironment(e)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-sm border capitalize transition-all",
                        environment === e 
                          ? "border-white/20 bg-white/5 text-foreground" 
                          : "border-white/[0.06] text-muted-foreground hover:border-white/15"
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

function StatCard({ 
  label, 
  value, 
  color, 
  onClick, 
  active 
}: { 
  label: string
  value: number
  color?: 'emerald' | 'red' | 'amber'
  onClick: () => void
  active: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl text-left transition-all",
        "border border-white/[0.06]",
        active 
          ? "bg-white/[0.05] border-white/[0.15]" 
          : "bg-white/[0.02] hover:bg-white/[0.04]"
      )}
    >
      <div className={cn(
        "text-2xl font-semibold mb-1",
        color === 'emerald' && "text-emerald-400",
        color === 'red' && "text-red-400",
        color === 'amber' && "text-amber-400"
      )}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </button>
  )
}
