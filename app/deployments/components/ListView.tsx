"use client";
import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { StatusBadge } from '@/components/ui/status-badge';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';

type Deployment = {
  id: string | number;
  status: string;
  branch?: string;
  summary?: string;
  commit?: string | null;
  created_at?: string;
  updated_at?: string;
  workspace_name?: string;
  services?: any[];
};

export function ListView({ items, onView, onLogs }: { items: Deployment[]; onView: (id: string|number) => void; onLogs: (id: string|number) => void }) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const useVirtual = items.length > 200;
  const rowVirtualizer = useVirtual ? useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  }) : null;

  const headers = (
    <div className="grid grid-cols-[120px_1fr_1fr_180px_120px_200px] gap-3 px-4 py-2 text-xs text-zinc-400">
      <div>Status</div>
      <div>Workspace</div>
      <div>Branch</div>
      <div>Commit</div>
      <div>Started</div>
      <div>Actions</div>
    </div>
  );

  if (!useVirtual) {
    return (
      <div role="table" aria-label="Deployments list" className="divide-y divide-zinc-800">
        {headers}
        {items.map((d) => (
          <Row key={d.id} d={d} onView={onView} onLogs={onLogs} />
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {headers}
      <div ref={parentRef} style={{ maxHeight: 560 }} className="overflow-auto" role="rowgroup">
        <div style={{ height: rowVirtualizer!.getTotalSize(), width: '100%', position: 'relative' }}>
          {rowVirtualizer!.getVirtualItems().map((vr: any) => (
            <div key={vr.key} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vr.start}px)` }}>
              <Row d={items[vr.index]} onView={onView} onLogs={onLogs} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ d, onView, onLogs }: { d: Deployment; onView: (id: string|number) => void; onLogs: (id: string|number) => void }) {
  const t = trpc as any
  const stopMutation = t.sarge.deploy.stopDeployment?.useMutation()
  
  const handleStop = async () => {
    if (!confirm('Stop this deployment?')) return
    try {
      await stopMutation.mutateAsync({ deploymentId: d.id.toString() })
    } catch (err) {
      console.error('Failed to stop deployment:', err)
    }
  }
  
  const short = (s?: string | null) => s ? s.slice(0,7) : '';
  const canStop = d.status === 'running' || d.status === 'pending'
  
  return (
    <div role="row" className="grid grid-cols-[120px_1fr_1fr_180px_120px_200px] gap-3 px-4 py-2 items-center">
      <div><StatusBadge status={d.status} /></div>
      <div className="truncate" title={d.workspace_name || d.summary || ''}>{d.workspace_name || d.summary || '-'}</div>
      <div className="font-mono text-xs opacity-80">{d.branch ?? '-'}</div>
      <div className="font-mono text-xs">
        <span title={d.commit ?? ''}>{short(d.commit)}</span>
      </div>
      <div className="text-xs opacity-75" title={d.created_at ?? ''}>{d.created_at?.slice(0,19).replace('T',' ') ?? '-'}</div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => onView(d.id)}>View</Button>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => onLogs(d.id)}>Logs</Button>
        {canStop && (
          <Button 
            variant="destructive"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleStop}
            disabled={stopMutation.isLoading}
          >
            {stopMutation.isLoading ? '...' : 'Stop'}
          </Button>
        )}
      </div>
    </div>
  );
}
