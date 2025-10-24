"use client";
export const dynamic = 'force-dynamic'
import React, { useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { ListView } from './components/ListView';
import { useRouter } from 'next/navigation';

export default function DeploymentsPage() {
  const t = trpc as any;
  const { data, isLoading } = t.deploy.getDeployments.useQuery();
  const router = useRouter();
  const { addToast, ToastContainer } = useToast();
  const [filters, setFilters] = useState<{ status?: string; service?: string }>({});

  t.deploy.subscribe.useSubscription(undefined, {
    onData(ev: any) {
      if (ev?.type === 'ready') return;
      // surface success/failed as toast
      if (ev?.status === 'success') addToast({ type: 'success', title: 'Deploy succeeded', description: `#${ev.id}` });
      if (ev?.status === 'failed') addToast({ type: 'error', title: 'Deploy failed', description: `#${ev.id}` });
    },
    onError(err: any) {
      addToast({ type: 'warning', title: 'Realtime disconnected', description: err.message });
    },
  });

  const items = useMemo(() => {
    const rows = data ?? [];
    return rows.filter((r: any) => (!filters.status || r.status === filters.status));
  }, [data, filters]);

  return (
    <div className="p-4">
      <ToastContainer />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Deployments</h1>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded border border-zinc-700 hover:bg-zinc-800" aria-label="New Deploy">New Deploy</button>
              <select className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm" aria-label="Filter status" value={filters.status ?? ''} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-sm text-zinc-400">No deployments found.</div>
          ) : (
            <ListView
              items={items as any[]}
              onView={(id) => router.push(`/deployments/${id}`)}
              onLogs={(id) => router.push(`/deployments/${id}#logs`)}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
 
