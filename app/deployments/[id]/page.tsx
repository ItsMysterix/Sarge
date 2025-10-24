"use client";
export const dynamic = 'force-dynamic'
import React, { useEffect, useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { LogViewer, LogLine } from '@/components/logs/LogViewer';
import { StatusBadge } from '@/components/ui/status-badge';

export default function DeployDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const { addToast, ToastContainer } = useToast();
  // Cast to any locally to avoid type issues in dynamic route files if TS can't resolve backend types immediately
  const t = trpc as any;
  const list = t.deploy.getDeployments.useQuery(undefined, { refetchOnWindowFocus: false });
  const [lines, setLines] = useState<LogLine[]>([]);
  const [meta, setMeta] = useState<any | null>(null);

  t.deploy.subscribe.useSubscription({ deploymentId: id }, {
    onData(ev: any) {
      if (!ev || ev.type === 'ready') return;
      if (ev.message) {
        setLines((prev) => [...prev, { id: prev.length, text: String(ev.message), ts: ev.timestamp ?? ev.created_at }]);
      }
      if (ev.status) setMeta((m: any) => ({ ...(m ?? {}), status: ev.status, updated_at: ev.updated_at ?? new Date().toISOString() }));
    },
    onError(err: any) { addToast({ type: 'warning', title: 'Realtime disconnected', description: err.message }); },
  });

  const initial = useMemo(() => (list.data ?? []).find((d: any) => String(d.id) === id), [list.data, id]);
  useEffect(() => { if (initial) setMeta(initial); }, [initial]);

  if (!initial && list.isFetched && !list.isLoading) {
    return <div className="p-4"><a href="/deployments" className="underline">Back</a> — deployment not found.</div>;
  }

  return (
    <div className="p-4 space-y-3">
      <ToastContainer />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusBadge status={meta?.status ?? initial?.status ?? 'pending'} />
              <div className="font-mono text-sm">#{id}</div>
              <div className="text-sm opacity-75">{meta?.summary ?? initial?.summary ?? ''}</div>
            </div>
            <button className="px-2 py-1 rounded border border-zinc-700 opacity-60" disabled>Re-run</button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-xs opacity-75 flex gap-4">
            <div>Created: {initial?.created_at ?? '-'}</div>
            <div>Updated: {meta?.updated_at ?? initial?.updated_at ?? '-'}</div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="font-semibold">Logs</div>
        </CardHeader>
        <CardBody>
          <div role="log" aria-live="polite">
            <LogViewer lines={lines} height={520} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
