import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Server } from 'lucide-react'

// Custom Node for "Glass" look in dark mode
export const ServiceNode = ({ data }: any) => {
  const Icon = data.icon || Server
  return (
    <div className="px-4 py-3 rounded-xl border border-border bg-card/80 backdrop-blur-md shadow-lg min-w-[200px] hover:border-foreground/30 transition-all">
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-muted-foreground border-none" />
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-muted ${data.colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-bold text-foreground font-mono">{data.label}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{data.status}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-muted-foreground border-none" />
    </div>
  )
}
