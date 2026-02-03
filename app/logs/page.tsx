"use client";
export const dynamic = 'force-dynamic'

import type React from "react";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageTitle } from "@/components/layout/page-title";
import { ScrollText } from "lucide-react";
import {
  Search,
  Download,
  Brain,
  AlertCircle,
  Info,
  AlertTriangle,
  Upload,
  Bookmark,
  BookmarkCheck,
  Clock,
  Pause,
  Play,
  FileDown,
  Filter as FilterIcon,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { AnimationErrorBoundary } from "@/components/ui/animation-error-boundary";
import { useUserRole } from "@/hooks/useUserRole";
import { StatCard } from "@/components/ui/stat-card";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";

export default function Logs() {
  const t = trpc as any;
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [bookmarkedLogs, setBookmarkedLogs] = useState<Set<string>>(new Set());
  const [isPaused, setIsPaused] = useState(false);
  const [timeRange, setTimeRange] = useState("1h");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [showEmptyState, setShowEmptyState] = useState(false);
  const { addToast, ToastContainer } = useToast();
  const userRole = useUserRole();

  const [filters, setFilters] = useState([
    { id: "info", label: "Info", active: false },
    { id: "warn", label: "Warning", active: false },
    { id: "error", label: "Error", active: false },
    { id: "alert", label: "Alert", active: false },
    { id: "bookmarked", label: "Bookmarked", active: false },
  ]);

  // Get active type filters
  const activeTypeFilters = filters.filter(f => ["info", "warn", "error", "alert"].includes(f.id) && f.active);
  const typeFilter = activeTypeFilters.length === 1 ? activeTypeFilters[0].id : undefined;

  const logsQuery = t.logs.recent.useQuery(
    { 
      type: typeFilter,
      service: selectedService !== "all" ? selectedService : undefined,
      search: searchTerm || undefined,
    },
    { 
      refetchOnWindowFocus: false, 
      enabled: !isPaused,
      refetchInterval: isPaused ? false : 5000, // Refresh every 5 seconds when not paused
    }
  );

  const servicesQuery = t.logs.services.useQuery(undefined, {
    refetchOnMount: true,
    staleTime: 60000, // Cache for 1 minute
  });

  const logs = logsQuery.data?.items || [];
  const availableServices = servicesQuery.data || [];

  // Show empty state after 2 seconds if still loading with no data
  useEffect(() => {
    const timer = setTimeout(() => {
      if (logs.length === 0 && !logsQuery.isError) {
        setShowEmptyState(true)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [logs.length, logsQuery.isError])

  const handleFilterToggle = (filterId: string) => {
    setFilters(filters.map(f => f.id === filterId ? { ...f, active: !f.active } : f))
  }

  const handleClearFilters = () => {
    setFilters(filters.map(f => ({ ...f, active: false })))
    setSearchTerm("")
    setSelectedService("all")
  }

  const toggleBookmark = (logId: string) => {
    setBookmarkedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  }

  const exportLogs = (format: "json" | "csv") => {
    const dataStr = format === "json" 
      ? JSON.stringify(filteredLogs, null, 2)
      : convertToCSV(filteredLogs);
    
    const blob = new Blob([dataStr], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `logs-${new Date().toISOString()}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
    
    addToast({
      type: "success",
      title: "Export Complete",
      description: `Logs exported as ${format.toUpperCase()}`,
    });
  }

  const convertToCSV = (data: any[]) => {
    const headers = ["Timestamp", "Level", "Service", "Message"];
    const rows = data.map(log => [
      log.timestamp,
      log.type,
      log.service,
      log.message.replace(/,/g, ";"), // Escape commas
    ]);
    return [headers, ...rows].map(row => row.join(",")).join("\n");
  }

  const filteredLogs = logs.filter((log: any) => {
    const showBookmarked = filters.find(f => f.id === "bookmarked")?.active;
    const matchesBookmark = !showBookmarked || bookmarkedLogs.has(log.id);
    return matchesBookmark;
  });

  const stats = {
    total: logs.length,
    info: logs.filter((l: any) => l.type === "info").length,
    warn: logs.filter((l: any) => l.type === "warn").length,
    error: logs.filter((l: any) => l.type === "error").length,
    alert: logs.filter((l: any) => l.type === "alert").length,
    bookmarked: bookmarkedLogs.size,
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "info":
        return <Info className="w-4 h-4 text-accent" />;
      case "warn":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-error" />;
      case "alert":
        return <AlertCircle className="w-4 h-4 text-error animate-pulse" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "info":
        return "text-accent";
      case "warn":
        return "text-warning";
      case "error":
        return "text-error";
      case "alert":
        return "text-error";
      default:
        return "text-gray-400";
    }
  };

  const getLevelBorderColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "info":
        return "border-l-accent";
      case "warn":
        return "border-l-warning";
      case "error":
        return "border-l-error";
      case "alert":
        return "border-l-error";
      default:
        return "border-l-gray-400";
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      const logsArray = Array.isArray(jsonData) ? jsonData : [jsonData];

      const transformedLogs = logsArray.map((log: any) => ({
        type: log.level?.toLowerCase() || log.type?.toLowerCase() || "info",
        message: log.message || log.msg || String(log),
        service: log.service || log.source || "unknown",
        timestamp: log.timestamp || log.time || new Date().toISOString(),
      }));

      const response = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedLogs),
      });

      if (!response.ok) throw new Error(`Failed to upload logs: ${response.status}`);

      addToast({
        type: "success",
        title: "Logs Uploaded",
        description: `Successfully uploaded ${transformedLogs.length} log entries`,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Upload Failed",
        description:
          error instanceof Error ? error.message : "Failed to parse log file",
      });
    }
  };

  if (logsQuery.isLoading && !showEmptyState) {
    return (
      <AnimationErrorBoundary fallbackType="auto" userRole={userRole}>
        <AppShell>
          <PageTitle
            title="Live Logs"
            description="Streaming runtime logs across services"
            icon={<ScrollText className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent" />}
            className="mb-6"
          />
          <main className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 w-full max-w-[100vw] flex items-center justify-center">
            <EmptyState 
              title="No logs found"
              icon={ScrollText}
              description="Logs will appear after you deploy, analyze, or interact with your services. You can also upload log files or trigger a deployment to generate activity."
              actionLabel="Go to Deployments"
              onAction={() => window.location.href = "/deployments"}
            />
          </main>
        </AppShell>
      </AnimationErrorBoundary>
    );
  }

  return (
    <AnimationErrorBoundary fallbackType="auto" userRole={userRole}>
      <AppShell>
        <ToastContainer />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-4 pb-2">
          <PageTitle
            title="Live Logs"
            description="Streaming runtime logs across services"
            icon={<ScrollText className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent" />}
            className="mb-6"
          />
        </div>
        <motion.main 
          className="flex-1 p-3 sm:p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
            {/* Control Buttons */}
            <motion.div 
              className="mb-4 sm:mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <motion.button
                  className={`px-3 sm:px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 text-sm sm:text-base ${
                    isPaused 
                      ? "bg-accent/10 border-accent/20 text-accent hover:bg-accent/20" 
                      : "bg-success/10 border-success/20 text-success hover:bg-success/20"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? <Play className="w-3 h-3 sm:w-4 sm:h-4" /> : <Pause className="w-3 h-3 sm:w-4 sm:h-4" />}
                  <span>{isPaused ? "Resume" : "Pause"}</span>
                </motion.button>
                
                <motion.label 
                  className="glass-card px-3 sm:px-4 py-2 text-accent hover:bg-accent/20 border border-accent/30 flex items-center space-x-2 rounded-lg cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm font-medium">Upload</span>
                    <input
                      type="file"
                      accept=".json,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </motion.label>

                  <motion.div className="relative">
                    <motion.button 
                      className="glass-card px-3 sm:px-4 py-2 text-accent hover:bg-accent/20 border border-accent/30 flex items-center space-x-2 rounded-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => exportLogs("json")}
                    >
                      <FileDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-medium hidden sm:inline">Export JSON</span>
                      <span className="text-xs sm:text-sm font-medium sm:hidden">JSON</span>
                    </motion.button>
                  </motion.div>

                  <motion.button 
                    className="glass-card px-3 sm:px-4 py-2 text-accent hover:bg-accent/20 border border-accent/30 flex items-center space-x-2 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => exportLogs("csv")}
                  >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">CSV</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <StatCard
                title="Total Logs"
                value={stats.total.toString()}
                icon={Brain}
                subtitle="All entries"
                color="accent"
                delay={0}
              />
              <StatCard
                title="Info"
                value={stats.info.toString()}
                icon={Info}
                subtitle="Informational"
                color="accent"
                delay={0.05}
              />
              <StatCard
                title="Warnings"
                value={stats.warn.toString()}
                icon={AlertTriangle}
                trend={stats.warn > 0 ? { direction: "up", value: 2 } : undefined}
                subtitle="Needs review"
                color="warning"
                delay={0.1}
              />
              <StatCard
                title="Errors"
                value={stats.error.toString()}
                icon={AlertCircle}
                trend={stats.error > 0 ? { direction: "up", value: 1 } : undefined}
                subtitle="Critical"
                color="error"
                delay={0.15}
              />
              <StatCard
                title="Alerts"
                value={stats.alert.toString()}
                icon={AlertCircle}
                subtitle="High priority"
                color="error"
                delay={0.2}
              />
              <StatCard
                title="Bookmarked"
                value={stats.bookmarked.toString()}
                icon={BookmarkCheck}
                subtitle="Saved for review"
                color="accent"
                delay={0.25}
              />
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-6 space-y-4"
            >
              <FilterBar
                searchPlaceholder="Search logs..."
                searchValue={searchTerm}
                onSearchChange={(value) => setSearchTerm(value)}
                filters={filters}
                onFilterToggle={handleFilterToggle}
                onClearFilters={handleClearFilters}
              />
              
              {/* Service Filter */}
              <div className="flex items-center space-x-3">
                <FilterIcon className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="glass-card px-4 py-2 rounded-lg border border-white/10 bg-transparent text-white focus:outline-none focus:border-accent/50"
                >
                  <option value="all" className="bg-[#0f0f0f]">All Services</option>
                  {(availableServices as string[]).map((service: string) => (
                    <option key={service} value={service} className="bg-[#0f0f0f]">{service}</option>
                  ))}
                </select>

                <Clock className="w-4 h-4 text-gray-400" />
                <div className="flex rounded-lg border border-accent/20 bg-accent/5 p-1">
                  {["1h", "6h", "24h", "7d"].map((range) => (
                    <button
                      key={range}
                      className={`px-3 py-1 rounded text-sm transition-all ${
                        timeRange === range ? "bg-accent text-black" : "text-gray-400 hover:text-white"
                      }`}
                      onClick={() => setTimeRange(range)}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Log Display */}
            <motion.div 
              className="glass-card border border-white/10 rounded-lg flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-error rounded-full" />
                    <div className="w-3 h-3 bg-warning rounded-full" />
                    <div className="w-3 h-3 bg-accent rounded-full" />
                  </div>
                  <span className="terminal-text text-sm text-gray-400">sarge-logs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isPaused ? "bg-gray-400" : "bg-accent animate-pulse"}`} />
                  <span className="terminal-text text-xs text-gray-400">{isPaused ? "PAUSED" : "LIVE"}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 terminal-text text-sm bg-black/10">
                <AnimatePresence mode="wait">
                  {filteredLogs.length === 0 ? (
                    <EmptyState 
                      title="No logs found"
                      icon={ScrollText}
                      description="Logs will appear after you deploy, analyze, or interact with your services. You can also upload log files or trigger a deployment to generate activity."
                      actionLabel="Go to Deployments"
                      onAction={() => window.location.href = "/deployments"}
                    />
                  ) : (
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {filteredLogs.map((log: any, i: number) => {
                        const isBookmarked = bookmarkedLogs.has(log.id);
                        return (
                          <motion.div
                            key={log.id || i}
                            className={`glass-card border-l-4 ${getLevelBorderColor(log.type)} p-3 hover:bg-white/5 transition-colors group relative`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.5) }}
                            whileHover={{ scale: 1.01, x: 2 }}
                          >
                            <div className="flex items-start justify-between space-x-3">
                              <div className="flex items-start space-x-3 flex-1">
                                <div className="flex items-center space-x-2 w-20 flex-shrink-0">
                                  {getLevelIcon(log.type)}
                                  <span className={`text-xs font-medium ${getLevelColor(log.type)}`}>
                                    {log.type.toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-1">
                                    <span className="text-accent text-xs font-medium">{log.service}</span>
                                    <span className="text-gray-400 text-xs">
                                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-gray-300 text-sm">{log.message}</p>
                                </div>
                              </div>
                              <motion.button
                                className={`flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                                  isBookmarked ? "text-accent opacity-100" : "text-gray-400 hover:text-accent"
                                }`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => toggleBookmark(log.id)}
                              >
                                {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Footer Stats */}
            <motion.div 
              className="mt-4 glass-card p-3 flex items-center justify-between text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">
                  Showing {filteredLogs.length} of {logs.length} logs
                </span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isPaused ? "bg-gray-400" : "bg-accent animate-pulse"}`} />
                  <span className={isPaused ? "text-gray-400" : "text-accent"}>
                    {isPaused ? "Updates paused" : "Real-time updates active"}
                  </span>
                </div>
                {bookmarkedLogs.size > 0 && (
                  <div className="flex items-center space-x-2">
                    <BookmarkCheck className="w-4 h-4 text-accent" />
                    <span className="text-accent">{bookmarkedLogs.size} bookmarked</span>
                  </div>
                )}
              </div>
              <div className="text-gray-400 terminal-text">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </motion.div>
        </motion.main>
      </AppShell>
    </AnimationErrorBoundary>
  );
}
