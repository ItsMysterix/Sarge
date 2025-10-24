"use client";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const map: Record<string, { label: string; className: string; Icon: any }> = {
    pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', Icon: Clock },
    running: { label: 'Running', className: 'bg-blue-500/10 text-blue-400 border-blue-500/30', Icon: Loader2 },
    success: { label: 'Success', className: 'bg-green-500/10 text-green-400 border-green-500/30', Icon: CheckCircle2 },
    failed:  { label: 'Failed',  className: 'bg-red-500/10 text-red-400 border-red-500/30', Icon: XCircle },
  };
  const m = map[s] ?? { label: status, className: 'bg-zinc-700/30 text-zinc-200 border-zinc-500/20', Icon: Clock };
  const Icon = m.Icon;
  return (
    <span aria-label={`status ${m.label}`} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${m.className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {m.label}
    </span>
  );
}
