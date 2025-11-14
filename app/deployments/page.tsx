"use client";
export const dynamic = 'force-dynamic'
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { ListView } from './components/ListView';
import { useRouter } from 'next/navigation';
import { Plus, Filter, GitBranch, Clock, CheckCircle2, XCircle, PlayCircle, RotateCcw, TrendingUp, Rocket } from 'lucide-react';
import { QuickStatCard } from '@/components/ui/quick-stat-card';
import { FilterBar } from '@/components/ui/filter-bar';
import { TimelineItem } from '@/components/ui/timeline-item';
import { AppShell } from '@/components/layout/app-shell';
import { PageTitle } from '@/components/layout/page-title';
import { EmptyState } from '@/components/ui/empty-state';
import { OnboardingSteps } from '@/components/ui/onboarding-steps';

export default function DeploymentsPage() {
  const t = trpc as any;
  const { data, isLoading } = t.deploy.getDeployments.useQuery(undefined, {
    refetchInterval: 5000,
    refetchOnWindowFocus: false,
  });
  const router = useRouter();
  const { addToast, ToastContainer } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState([
    { id: "pending", label: "Pending", active: false },
    { id: "running", label: "Running", active: false },
    { id: "success", label: "Success", active: false },
    { id: "failed", label: "Failed", active: false },
    { id: "main", label: "Main Branch", active: false },
    { id: "develop", label: "Develop", active: false },
    { id: "production", label: "Production", active: false },
    { id: "staging", label: "Staging", active: false },
  ]);
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");

  // Subscription removed for Vercel compatibility; list is polled above.

  const handleFilterToggle = (filterId: string) => {
    setFilters(filters.map(f => f.id === filterId ? { ...f, active: !f.active } : f))
  }

  const handleClearFilters = () => {
    setFilters(filters.map(f => ({ ...f, active: false })))
    setSearchQuery("")
  }

  const items = useMemo(() => {
    const rows = data ?? [];
    const activeStatusFilters = filters.filter(f => ["pending", "running", "success", "failed"].includes(f.id) && f.active);
    const activeBranchFilters = filters.filter(f => ["main", "develop"].includes(f.id) && f.active);
    const activeEnvFilters = filters.filter(f => ["production", "staging"].includes(f.id) && f.active);

    return rows.filter((r: any) => {
      const matchesSearch = !searchQuery || 
        r.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.branch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.commit?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = activeStatusFilters.length === 0 || activeStatusFilters.some(f => r.status === f.id);
      const matchesBranch = activeBranchFilters.length === 0 || activeBranchFilters.some(f => r.branch?.toLowerCase().includes(f.id));
      const matchesEnv = activeEnvFilters.length === 0 || activeEnvFilters.some(f => r.summary?.toLowerCase().includes(f.id));

      return matchesSearch && matchesStatus && matchesBranch && matchesEnv;
    });
  }, [data, filters, searchQuery]);

  const stats = useMemo(() => {
    const all = data ?? [];
    return {
      total: all.length,
      success: all.filter((d: any) => d.status === 'success').length,
      failed: all.filter((d: any) => d.status === 'failed').length,
      running: all.filter((d: any) => d.status === 'running').length,
      pending: all.filter((d: any) => d.status === 'pending').length,
      successRate: all.length > 0 
        ? ((all.filter((d: any) => d.status === 'success').length / all.length) * 100).toFixed(1)
        : 0
    };
  }, [data]);

  return (
    <AppShell>
      <main className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 w-full max-w-[100vw]">
        <PageTitle
          title="Deployments"
          description="Track, monitor, and analyze deployment history"
          icon={<Rocket className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent" />}
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ToastContainer />
          {/* Quick Stats */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <QuickStatCard
              title="Total Deploys"
              value={stats.total.toString()}
              icon={Rocket}
              subtitle="All time"
              color="accent"
              delay={0}
            />
            <QuickStatCard
              title="Success Rate"
              value={`${stats.successRate}%`}
              icon={CheckCircle2}
              trend={{ direction: "up", value: 3.2 }}
              subtitle={`${stats.success} successful`}
              color="success"
              delay={0.1}
            />
            <QuickStatCard
              title="Active"
              value={(stats.running + stats.pending).toString()}
              icon={PlayCircle}
              subtitle={`${stats.running} running, ${stats.pending} pending`}
              color="warning"
              delay={0.2}
            />
            <QuickStatCard
              title="Failed"
              value={stats.failed.toString()}
              icon={XCircle}
              trend={stats.failed > 0 ? { direction: "down", value: 12 } : undefined}
              subtitle="Needs attention"
              color={stats.failed > 0 ? "error" : "success"}
              delay={0.3}
            />
          </motion.div>
          {/* Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-6"
          >
            <FilterBar
              searchPlaceholder="Search deployments..."
              searchValue={searchQuery}
              onSearchChange={(value) => setSearchQuery(value)}
              filters={filters}
              onFilterToggle={handleFilterToggle}
              onClearFilters={handleClearFilters}
            />
          </motion.div>
          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <Card>
                  <CardBody>
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {Array.from({ length: 8 }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Skeleton className="h-10" />
                        </motion.div>
                      ))}
                    </motion.div>
                  </CardBody>
                </Card>
              ) : !data || data.length === 0 ? (
                <EmptyState
                  icon={Rocket}
                  title="No Deployments Yet"
                  description="Start deploying your applications with automated setup, dependency installation, and service management."
                  actionLabel="Start Deploying"
                  actionHref="/oneclick"
                  secondaryActionLabel="Learn More"
                  secondaryActionHref="/docs"
                >
                  <OnboardingSteps
                    steps={[
                      {
                        number: 1,
                        title: "Add your workspace",
                        description: "Clone a GitHub repository or register a local project folder. Sarge supports multiple frameworks and languages.",
                      },
                      {
                        number: 2,
                        title: "Configure and deploy",
                        description: "Choose your starting port and click deploy. Sarge automatically detects services, installs dependencies, and starts them.",
                      },
                      {
                        number: 3,
                        title: "Monitor and manage",
                        description: "Track deployment status here, view logs, check metrics, and manage your running services.",
                      },
                    ]}
                  />
                </EmptyState>
              ) : items.length === 0 ? (
                <Card>
                  <CardBody>
                    <motion.div 
                      className="text-sm text-zinc-400 text-center py-12"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-4xl mb-4"
                      >
                        📦
                      </motion.div>
                      <p>No deployments found matching your filters</p>
                      <button
                        onClick={handleClearFilters}
                        className="mt-4 px-4 py-2 text-accent hover:underline"
                      >
                        Clear filters
                      </button>
                    </motion.div>
                  </CardBody>
                </Card>
              ) : (
                <ListView items={items} router={router} />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main>
    </AppShell>
  );
}
 
