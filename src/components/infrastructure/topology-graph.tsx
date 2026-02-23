"use client"

import React, { useCallback } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Handle,
  Position,
  BackgroundVariant
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Server, Database, Globe, Lock, GitBranch, ArrowRight, Activity } from 'lucide-react'
import { ServiceNode } from './service-node'

const nodeTypes = {
  serviceNode: ServiceNode,
}

const initialNodes = [
  {
    id: 'github',
    type: 'serviceNode',
    position: { x: 250, y: 0 },
    data: { label: 'GitHub Repo', status: 'Source', icon: GitBranch, colorClass: 'text-foreground' },
  },
  {
    id: 'cloudflare',
    type: 'serviceNode',
    position: { x: 500, y: 0 },
    data: { label: 'Cloudflare', status: 'DNS & CDN', icon: Globe, colorClass: 'text-amber-500' },
  },
  {
    id: 'api-gateway',
    type: 'serviceNode',
    position: { x: 375, y: 150 },
    data: { label: 'API Gateway', status: 'Routing', icon: Server, colorClass: 'text-emerald-500' },
  },
  {
    id: 'frontend',
    type: 'serviceNode',
    position: { x: 150, y: 300 },
    data: { label: 'Next.js Frontend', status: 'Running', icon: Activity, colorClass: 'text-blue-500' },
  },
  {
    id: 'backend',
    type: 'serviceNode',
    position: { x: 450, y: 300 },
    data: { label: 'Rust Core Service', status: 'Running', icon: Lock, colorClass: 'text-orange-500' },
  },
  {
    id: 'postgres',
    type: 'serviceNode',
    position: { x: 450, y: 450 },
    data: { label: 'Neon PostgreSQL', status: 'Healthy', icon: Database, colorClass: 'text-purple-500' },
  },
]

const initialEdges: Edge[] = [
  { id: 'e1', source: 'github', target: 'frontend', animated: true, style: { stroke: '#4b5563' } },
  { id: 'e2', source: 'github', target: 'backend', animated: true, style: { stroke: '#4b5563' } },
  { id: 'e3', source: 'cloudflare', target: 'api-gateway', animated: true, style: { stroke: '#4b5563' } },
  { id: 'e4', source: 'api-gateway', target: 'frontend', animated: true, style: { stroke: '#4b5563' } },
  { id: 'e5', source: 'api-gateway', target: 'backend', animated: true, style: { stroke: '#4b5563' } },
  { id: 'e6', source: 'backend', target: 'postgres', animated: true, style: { stroke: '#4b5563' } },
]

export function TopologyGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), [setEdges])

  return (
    <div className="w-full h-[600px] border border-border rounded-xl overflow-hidden bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#3f3f46" />
        <Controls 
          className="bg-card border-border border rounded-md shadow-lg overflow-hidden [&>button]:border-border [&>button]:bg-card [&>button]:text-muted-foreground hover:[&>button]:bg-muted hover:[&>button]:text-foreground"
        />
        <MiniMap 
          nodeColor="#3f3f46" 
          maskColor="rgba(0, 0, 0, 0.4)" 
          className="bg-card border border-border rounded-md shadow-xl"
        />
      </ReactFlow>
    </div>
  )
}
