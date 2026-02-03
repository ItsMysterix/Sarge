"use client"
export const dynamic = 'force-dynamic'

import { AppShell } from "@/components/layout/app-shell"
import { PageTitle } from "@/components/layout/page-title"
import { Server, Database, Cpu, Globe, Zap, Brain, Play, Pause, RefreshCcw, Settings, TrendingUp, Activity, AlertTriangle } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { FilterBar } from "@/components/ui/filter-bar"
import { StatusBadge } from "@/components/ui/status-badge"
import { ActionMenu } from "@/components/ui/action-menu"
import { StatCard } from "@/components/ui/stat-card"
import { useState } from "react"

function ServiceCard({ service, delay }: { service: any; delay: number }) {
  const t = trpc as any
  const { data: uptimeData = [] } = t.services.uptime.useQuery({ id: service.id }, { refetchOnWindowFocus: false })

  const getGradeFromUptime = (uptime: number) => {
    if (uptime >= 99.5) return { grade: "A", color: "text-success bg-success/20 border-success/30" }
    if (uptime >= 98) return { grade: "B", color: "text-warning bg-warning/20 border-warning/30" }
    return { grade: "C", color: "text-error bg-error/20 border-error/30" }
  }

  const getIcon = (name: string) => {
    if (name.toLowerCase().includes("api")) return Server
    if (name.toLowerCase().includes("database") || name.toLowerCase().includes("db")) return Database
    if (name.toLowerCase().includes("worker") || name.toLowerCase().includes("queue")) return Cpu
    return Globe
  }

  const gradeInfo = getGradeFromUptime(Number(service.uptime_percent))
  const Icon = getIcon(service.name)

  return (
    <motion.div 
      className="glass-card p-4 sm:p-6 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-accent/30"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.01, y: -3 }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="p-2 bg-accent/10 rounded-lg shrink-0"
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
          </motion.div>
          <div className="min-w-0 flex-1 sm:flex-none">
            <h3 className="text-base sm:text-lg font-semibold truncate">{service.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge 
                status={service.status === "up" ? "success" : service.status === "degraded" ? "warning" : "error"} 
                label={service.status}
                size="sm"
              />
              <span className="text-xs text-gray-400 terminal-text">
                {service.instance_count || 3} instances
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end">
          <motion.div 
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-base sm:text-lg font-bold border ${gradeInfo.color}`}
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {gradeInfo.grade}
          </motion.div>
          <ActionMenu
            actions={[
              {
                label: "Restart Service",
                icon: RefreshCcw,
                onClick: () => console.log("Restart", service.name),
              },
              {
                label: "Scale Instances",
                icon: TrendingUp,
                onClick: () => console.log("Scale", service.name),
              },
              {
                label: "View Logs",
                icon: Database,
                onClick: () => console.log("Logs", service.name),
              },
              {
                label: "Settings",
                icon: Settings,
                onClick: () => console.log("Settings", service.name),
              },
              {
                label: "Stop Service",
                icon: Pause,
                onClick: () => console.log("Stop", service.name),
                variant: "danger",
              },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
        {[
          { label: "Uptime", value: `${Number(service.uptime_percent).toFixed(1)}%`, trend: "+0.3%" },
          { label: "Cost/Hour", value: `$${Number(service.cost_hr).toFixed(2)}`, trend: "-12%" },
          { label: "Requests/min", value: service.requests || "1.2k", trend: "+8%" },
          { label: "Latency", value: service.latency || "45ms", trend: "-5%" }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: delay + i * 0.05 }}
            className="glass-card p-3 rounded hover:bg-white/5 transition-all"
          >
            <div className="text-xs text-gray-400 mb-1">{item.label}</div>
            <div className="text-sm font-medium flex items-center gap-2">
              {item.value}
              {item.trend && (
                <span className={`text-xs ${
                  item.trend.startsWith("+") ? "text-success" : "text-error"
                }`}>
                  {item.trend}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2 flex items-center justify-between">
          <span>24h Uptime Trend</span>
          <span className="text-success">{Number(service.uptime_percent).toFixed(1)}% avg</span>
        </div>
        <div className="flex items-end space-x-1 h-16">
          {uptimeData
            .slice(0, 24)
            .reverse()
            .map((point: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ height: 0, opacity: 0 }}
                whileInView={{ height: `${point.value}%`, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: delay + idx * 0.01, duration: 0.3 }}
                whileHover={{ scale: 1.2, y: -2 }}
                className={`flex-1 rounded-t transition-all duration-300 cursor-pointer ${
                  point.value > 95 ? "bg-success/60 hover:bg-success" : point.value > 90 ? "bg-warning/60 hover:bg-warning" : "bg-error/60 hover:bg-error"
                }`}
                title={`${point.value}% uptime`}
              />
            ))}
        </div>
      </div>

      <motion.div 
        className="flex justify-between items-center text-xs pt-3 border-t border-white/10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.3 }}
      >
        <span className="text-gray-400">Last deployed {formatDistanceToNow(new Date(service.created_at || Date.now()))} ago</span>
        <motion.button 
          className="text-accent hover:text-accent/80 transition-colors font-medium"
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          View Details →
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

export default function Services() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState([
    { id: "up", label: "Running", active: false },
    { id: "degraded", label: "Degraded", active: false },
    { id: "down", label: "Down", active: false },
    { id: "api", label: "APIs", active: false },
    { id: "database", label: "Databases", active: false },
    { id: "worker", label: "Workers", active: false },
  ])

  const t = trpc as any
  const { data: services = [], isLoading: loading, refetch } = t.services.all.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  const handleFilterToggle = (filterId: string) => {
    setFilters(filters.map(f => f.id === filterId ? { ...f, active: !f.active } : f))
  }

  const handleClearFilters = () => {
    setFilters(filters.map(f => ({ ...f, active: false })))
    setSearchQuery("")
  }

  // Apply filters and search
  const filteredServices = services.filter((service: any) => {
    const activeStatusFilters = filters.filter(f => ["up", "degraded", "down"].includes(f.id) && f.active)
    const activeTypeFilters = filters.filter(f => ["api", "database", "worker"].includes(f.id) && f.active)
    
    const matchesSearch = !searchQuery || service.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = activeStatusFilters.length === 0 || activeStatusFilters.some(f => service.status === f.id)
    const matchesType = activeTypeFilters.length === 0 || activeTypeFilters.some(f => service.name.toLowerCase().includes(f.id))

    return matchesSearch && matchesStatus && matchesType
  })

  const stats = {
    total: services.length,
    up: services.filter((s: any) => s.status === "up").length,
    degraded: services.filter((s: any) => s.status === "degraded").length,
    down: services.filter((s: any) => s.status === "down").length,
    avgUptime: services.length > 0 
      ? (services.reduce((sum: number, s: any) => sum + Number(s.uptime_percent), 0) / services.length).toFixed(1)
      : 0
  }

  if (loading) {
    return (
      <AppShell>
        <PageTitle
          title="Services"
          description="Overview of running local services"
          icon={<Server className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent" />}
        />
        <main className="flex-1 p-6 flex items-center justify-center">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
              <motion.p 
                className="text-gray-400"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                Loading services...
              </motion.p>
            </motion.div>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageTitle
        title="Services"
        description="Overview of running local services"
        icon={<Server className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent" />}
      />
      <motion.main 
        className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
          {/* Actions Row (Removed large page heading for unified header design) */}
          <motion.div 
            className="flex justify-end mb-4 sm:mb-6"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.button
              className="px-3 sm:px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg text-accent hover:bg-accent/20 transition-colors flex items-center space-x-2 text-sm sm:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refetch()}
            >
              <RefreshCcw className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Refresh</span>
            </motion.button>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <StatCard
              title="Total Services"
              value={stats.total.toString()}
              icon={Server}
              subtitle="All services"
              color="accent"
              delay={0}
            />
            <StatCard
              title="Healthy"
              value={stats.up.toString()}
              icon={Activity}
              trend={{ direction: "up", value: 2.5 }}
              subtitle="Running normally"
              color="success"
              delay={0.1}
            />
            <StatCard
              title="Issues"
              value={(stats.degraded + stats.down).toString()}
              icon={AlertTriangle}
              trend={stats.degraded + stats.down > 0 ? { direction: "up", value: 1 } : undefined}
              subtitle={`${stats.degraded} degraded, ${stats.down} down`}
              color={stats.degraded + stats.down > 0 ? "error" : "success"}
              delay={0.2}
            />
            <StatCard
              title="Avg Uptime"
              value={`${stats.avgUptime}%`}
              icon={TrendingUp}
              trend={{ direction: "up", value: 0.3 }}
              subtitle="Last 30 days"
              color="warning"
              delay={0.3}
            />
          </motion.div>

          {/* Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-4 sm:mb-6"
          >
            <FilterBar
              searchPlaceholder="Search services..."
              searchValue={searchQuery}
              onSearchChange={(value) => setSearchQuery(value)}
              filters={filters}
              onFilterToggle={handleFilterToggle}
              onClearFilters={handleClearFilters}
            />
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <AnimatePresence mode="wait">
              {filteredServices.length === 0 ? (
                <motion.div 
                  className="col-span-2 text-center text-gray-400 py-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  </motion.div>
                  <p>No services found matching your filters</p>
                  <button
                    onClick={handleClearFilters}
                    className="mt-4 px-4 py-2 text-accent hover:underline"
                  >
                    Clear filters
                  </button>
                </motion.div>
              ) : (
                filteredServices.map((service: any, i: number) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <ServiceCard service={service} delay={i * 0.1} />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
      </motion.main>
    </AppShell>
  )
}
