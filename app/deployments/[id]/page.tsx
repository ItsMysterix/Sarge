"use client";
export const dynamic = 'force-dynamic'
import React, { useEffect, useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { LogViewer, LogLine } from '@/components/logs/LogViewer';
import { StatusBadge } from '@/components/ui/status-badge';
import { AppShell } from '@/components/layout/app-shell';
import { ArrowLeft, RefreshCw, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeployDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const { addToast, ToastContainer } = useToast();
  const router = useRouter();
  const t = trpc as any;
  const list = t.deploy.getDeployments.useQuery(undefined, { refetchOnWindowFocus: false });
  const logsQuery = t.deploy.getLogs.useQuery({ deploymentId: id }, { 
    enabled: !!id,
    refetchOnWindowFocus: false 
  });
  const [lines, setLines] = useState<LogLine[]>([]);
  const [meta, setMeta] = useState<any | null>(null);

  // Load initial logs from database
  useEffect(() => {
    if (logsQuery.data) {
      const logLines: LogLine[] = logsQuery.data.map((log: any, index: number) => ({
        id: log.id || index,
        text: log.message,
        ts: log.timestamp,
        step: log.step,
      }));
      setLines(logLines);
    }
  }, [logsQuery.data]);

  t.deploy.subscribe.useSubscription({ deploymentId: id }, {
    onData(ev: any) {
      if (!ev || ev.type === 'ready') return;
      if (ev.message) {
        setLines((prev) => [...prev, { id: prev.length, text: String(ev.message), ts: ev.timestamp ?? ev.created_at, step: ev.step }]);
      }
      if (ev.status) setMeta((m: any) => ({ ...(m ?? {}), status: ev.status, updated_at: ev.updated_at ?? new Date().toISOString() }));
    },
    onError(err: any) { addToast({ type: 'warning', title: 'Realtime disconnected', description: err.message }); },
  });

  const initial = useMemo(() => (list.data ?? []).find((d: any) => String(d.id) === id), [list.data, id]);
  useEffect(() => { if (initial) setMeta(initial); }, [initial]);

  if (!initial && list.isFetched && !list.isLoading) {
    return (
      <AppShell>
        <main className="flex-1 p-6">
            <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => router.push('/deployments')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Deployments
              </button>
            </div>
            <div className="text-center py-12">
              <p className="text-gray-400">Deployment not found</p>
            </div>
        </main>
      </AppShell>
    );
  }

  const exportLogs = () => {
    const logText = lines.map(line => `[${line.ts || ''}] ${line.step ? `[${line.step}] ` : ''}${line.text}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deployment-${id}-logs.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: 'Logs Exported', description: 'Deployment logs saved successfully' });
  };

  return (
    <AppShell>
      <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          <ToastContainer />
          
          {/* Back Button */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button 
              onClick={() => router.push('/deployments')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Deployments
            </button>
          </div>

          {/* Deployment Info Card */}
          <Card className="mb-4">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge status={meta?.status ?? initial?.status ?? 'pending'} />
                  <div className="font-mono text-sm text-gray-400">#{id.substring(0, 8)}</div>
                  <div className="text-sm text-gray-300">{meta?.summary ?? initial?.summary ?? ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={exportLogs}
                    className="px-3 py-1.5 rounded border border-zinc-700 hover:border-accent hover:text-accent transition-colors text-sm flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                  <button 
                    className="px-3 py-1.5 rounded border border-zinc-700 opacity-50 text-sm flex items-center gap-2" 
                    disabled
                  >
                    <RefreshCw className="w-3 h-3" />
                    Re-run
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="text-xs text-gray-400 flex flex-col sm:flex-row gap-2 sm:gap-6">
                <div><span className="text-gray-500">Branch:</span> {initial?.branch ?? 'main'}</div>
                <div><span className="text-gray-500">Commit:</span> {initial?.commit ?? '-'}</div>
                <div><span className="text-gray-500">Created:</span> {initial?.created_at ? new Date(initial.created_at).toLocaleString() : '-'}</div>
                {meta?.updated_at && <div><span className="text-gray-500">Updated:</span> {new Date(meta.updated_at).toLocaleString()}</div>}
              </div>
            </CardBody>
          </Card>

          {/* Logs Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="font-semibold">Build Logs</div>
                {logsQuery.isLoading && (
                  <div className="text-xs text-gray-400 animate-pulse">Loading logs...</div>
                )}
                {lines.length > 0 && (
                  <div className="text-xs text-gray-400">{lines.length} log entries</div>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <div role="log" aria-live="polite">
                {lines.length === 0 && !logsQuery.isLoading ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>No logs available for this deployment</p>
                    <p className="text-xs mt-2">Logs will appear here when the build starts</p>
                  </div>
                ) : (
                  <LogViewer lines={lines} height={520} />
                )}
              </div>
            </CardBody>
          </Card>
      </main>
    </AppShell>
  );
}
