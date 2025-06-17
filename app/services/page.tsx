"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Server, Database, Cpu, Globe, Zap, Brain } from "lucide-react"
import { useServices, useServiceUptime } from "@/hooks/useApi"

function ServiceCard({ service }: { service: any }) {
  const { data: uptimeData } = useServiceUptime(service.id)

  const getGradeFromUptime = (uptime: number) => {
    const uptimeNum = Number(uptime)
    if (uptimeNum >= 99.5) return { grade: "A", color: "text-success bg-success/20 border-success/30" }
    if (uptimeNum >= 98) return { grade: "B", color: "text-warning bg-warning/20 border-warning/30" }
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
    <div className="glass-card p-6 hover:bg-white/10 transition-all duration-300">
      {/* Service Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Icon className="w-8 h-8 text-accent" />
          <div>
            <h3 className="text-lg font-semibold">{service.name}</h3>
            <div className="text-sm text-gray-400">{service.status}</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-bold border ${gradeInfo.color}`}>{gradeInfo.grade}</div>
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              service.status === "up" ? "bg-success" : service.status === "degraded" ? "bg-warning" : "bg-error"
            }`}
          ></div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Uptime</div>
          <div className="text-sm font-medium">{Number(service.uptime_percent).toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Cost/Hour</div>
          <div className="text-sm font-medium">${Number(service.cost_hr).toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Status</div>
          <div
            className={`text-sm font-medium capitalize ${
              service.status === "up" ? "text-success" : service.status === "degraded" ? "text-warning" : "text-error"
            }`}
          >
            {service.status}
          </div>
        </div>
      </div>

      {/* Uptime Sparkline */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">24h Uptime Trend</div>
        <div className="flex items-end space-x-1 h-12">
          {uptimeData
            .slice(0, 24)
            .reverse()
            .map((point, idx) => (
              <div
                key={idx}
                className={`flex-1 rounded-t transition-all duration-300 ${
                  point.value > 95 ? "bg-success/60" : point.value > 90 ? "bg-warning/60" : "bg-error/60"
                }`}
                style={{ height: `${point.value}%` }}
              ></div>
            ))}
        </div>
      </div>

      {/* Service Actions */}
      <div className="flex justify-between items-center text-xs pt-3 border-t border-white/10">
        <span className="text-gray-400">Last 24h average</span>
        <button className="text-accent hover:text-accent/80 transition-colors">View Details →</button>
      </div>
    </div>
  )
}

export default function Services() {
  const { data: services, loading } = useServices()

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0f0f0f]">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-0">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-gray-400">Loading services...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0f0f0f]">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-0">
        <Header />

        <main className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Zap className="w-8 h-8 text-accent" />
              <h1 className="text-3xl font-bold">Service Health Intelligence</h1>
            </div>
            <p className="text-gray-400">Real-time service monitoring with Supabase data</p>
          </div>

          {/* Health Overview */}
          <div className="glass-card p-6 mb-8 border-l-4 border-l-accent">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-semibold">Overall Health Score</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-success mb-1">
                  {services.length > 0
                    ? services.filter((s) => s.status === "up").length === services.length
                      ? "A"
                      : "B"
                    : "N/A"}
                </div>
                <div className="text-sm text-gray-400">Overall Grade</div>
              </div>
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-warning mb-1">
                  {services.length > 0
                    ? (services.reduce((acc, s) => acc + Number(s.uptime_percent), 0) / services.length).toFixed(1)
                    : 0}
                  %
                </div>
                <div className="text-sm text-gray-400">Avg Uptime</div>
              </div>
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-accent mb-1">
                  $
                  {services.length > 0
                    ? (services.reduce((acc, s) => acc + Number(s.cost_hr), 0) * 24).toFixed(2)
                    : "0.00"}
                </div>
                <div className="text-sm text-gray-400">Daily Cost</div>
              </div>
              <div className="text-center p-4 glass-card rounded-lg">
                <div className="text-2xl font-bold text-error mb-1">
                  {services.filter((s) => s.status !== "up").length}
                </div>
                <div className="text-sm text-gray-400">Issues</div>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {services.length === 0 ? (
              <div className="col-span-2 text-center text-gray-400 py-8">
                <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No services found</p>
              </div>
            ) : (
              services.map((service) => <ServiceCard key={service.id} service={service} />)
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
