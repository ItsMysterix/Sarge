"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Search, Download, Brain, AlertCircle, Info, AlertTriangle, Upload } from "lucide-react"
import { useLogs } from "@/hooks/useApi"
import { useToast } from "@/components/ui/toast"
import { formatDistanceToNow } from "date-fns"

export default function Logs() {
  const [activeFilter, setActiveFilter] = useState("ALL")
  const [searchTerm, setSearchTerm] = useState("")
  const { data: logs, loading } = useLogs(activeFilter)
  const { addToast, ToastContainer } = useToast()

  const filters = ["ALL", "INFO", "WARN", "ERROR", "ALERT"]

  // Ensure logs is always an array
  const safeLogsData = logs || []

  const filteredLogs = safeLogsData.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.service.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "info":
        return <Info className="w-4 h-4 text-accent" />
      case "warn":
        return <AlertTriangle className="w-4 h-4 text-warning" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-error" />
      case "alert":
        return <AlertCircle className="w-4 h-4 text-error animate-pulse" />
      default:
        return <Info className="w-4 h-4 text-gray-400" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "info":
        return "text-accent"
      case "warn":
        return "text-warning"
      case "error":
        return "text-error"
      case "alert":
        return "text-error"
      default:
        return "text-gray-400"
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const jsonData = JSON.parse(text)

      // Ensure it's an array
      const logsArray = Array.isArray(jsonData) ? jsonData : [jsonData]

      // Transform to match our schema
      const transformedLogs = logsArray.map((log: any) => ({
        type: log.level?.toLowerCase() || log.type?.toLowerCase() || "info",
        message: log.message || log.msg || String(log),
        service: log.service || log.source || "unknown",
        timestamp: log.timestamp || log.time || new Date().toISOString(),
      }))

      const response = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transformedLogs),
      })

      if (!response.ok) {
        throw new Error(`Failed to upload logs: ${response.status}`)
      }

      addToast({
        type: "success",
        title: "Logs Uploaded",
        description: `Successfully uploaded ${transformedLogs.length} log entries`,
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to parse log file",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0f0f0f]">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-0">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-gray-400">Loading logs...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0f0f0f]">
      <Sidebar />
      <ToastContainer />

      <div className="flex-1 flex flex-col lg:ml-0">
        <Header />

        <main className="flex-1 p-6 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Brain className="w-8 h-8 text-accent" />
              <h1 className="text-3xl font-bold">Log Intelligence</h1>
            </div>
            <p className="text-gray-400">Real-time log analysis with Supabase</p>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 glass-card border border-white/10 rounded-lg bg-transparent text-white placeholder-gray-400 focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeFilter === filter
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "glass-card hover:bg-white/10 text-gray-400"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Upload Button */}
            <label className="glass-card px-4 py-2 text-accent hover:bg-accent/20 transition-colors rounded-lg border border-accent/30 flex items-center space-x-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Upload</span>
              <input type="file" accept=".json,.txt" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* Export Button */}
            <button className="glass-card px-4 py-2 text-accent hover:bg-accent/20 transition-colors rounded-lg border border-accent/30 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>

          {/* Log Content */}
          <div className="flex-1 glass-card border border-white/10 rounded-lg overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-error rounded-full"></div>
                  <div className="w-3 h-3 bg-warning rounded-full"></div>
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                </div>
                <span className="terminal-text text-sm text-gray-400">sarge-logs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span className="terminal-text text-xs text-gray-400">LIVE</span>
              </div>
            </div>

            {/* Log Entries */}
            <div className="h-full overflow-y-auto p-4 terminal-text text-sm bg-black/10">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>
                    {safeLogsData.length === 0
                      ? "No logs available. Try uploading some log files or check your database connection."
                      : "No logs match your current filter"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredLogs.map((log, i) => (
                    <div
                      key={log.id || i}
                      className="flex items-start space-x-3 py-1 hover:bg-white/5 rounded px-2 -mx-2 transition-colors group"
                    >
                      <span className="text-gray-400 w-20 flex-shrink-0 text-xs">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </span>
                      <div className="flex items-center space-x-2 w-16 flex-shrink-0">
                        {getLevelIcon(log.type)}
                        <span className={`text-xs font-medium ${getLevelColor(log.type)}`}>
                          {log.type.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-accent w-20 flex-shrink-0 text-xs">{log.service}</span>
                      <span className="text-gray-300 flex-1">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-4 glass-card p-3 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">
                Showing {filteredLogs.length} of {safeLogsData.length} logs
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span className="text-accent">Real-time updates active</span>
              </div>
            </div>
            <div className="text-gray-400 terminal-text">Last updated: {new Date().toLocaleTimeString()}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
