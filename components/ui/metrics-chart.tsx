"use client"

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface MetricsChartProps {
  data?: any[]
  type?: 'line' | 'area' | 'bar' | 'pie'
  dataKey?: string
  xAxisKey?: string
  title?: string
  color?: string
  height?: number
}

const COLORS = {
  accent: '#00ff9f',
  warning: '#ffb800',
  error: '#ff4757',
  success: '#00ff9f',
  info: '#00d4ff',
}

const CHART_COLORS = [
  COLORS.accent,
  COLORS.warning,
  COLORS.info,
  '#ff6b9d',
  '#c44569',
  '#786fa6',
]

export function MetricsChart({
  data = [],
  type = 'line',
  dataKey = 'value',
  xAxisKey = 'name',
  title,
  color = COLORS.accent,
  height = 300,
}: MetricsChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate sample data for demo
      return Array.from({ length: 24 }, (_, i) => ({
        [xAxisKey]: `${i}:00`,
        [dataKey]: Math.floor(Math.random() * 100),
      }))
    }
    return data
  }, [data, xAxisKey, dataKey])

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-accent/30">
          <p className="text-sm text-gray-400">{payload[0].name}</p>
          <p className="text-lg font-bold text-accent">
            {payload[0].value}
            {type === 'area' || type === 'line' ? '%' : ''}
          </p>
        </div>
      )
    }
    return null
  }

  if (type === 'line') {
    return (
      <div className="w-full">
        {title && <h3 className="text-sm font-medium text-gray-400 mb-3">{title}</h3>}
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#666" 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#999' }}
            />
            <YAxis 
              stroke="#666" 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#999' }}
            />
            <Tooltip content={customTooltip} />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === 'area') {
    return (
      <div className="w-full">
        {title && <h3 className="text-sm font-medium text-gray-400 mb-3">{title}</h3>}
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#666" 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#999' }}
            />
            <YAxis 
              stroke="#666" 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#999' }}
            />
            <Tooltip content={customTooltip} />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              fill="url(#colorGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === 'bar') {
    return (
      <div className="w-full">
        {title && <h3 className="text-sm font-medium text-gray-400 mb-3">{title}</h3>}
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#666" 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#999' }}
            />
            <YAxis 
              stroke="#666" 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#999' }}
            />
            <Tooltip content={customTooltip} />
            <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === 'pie') {
    return (
      <div className="w-full">
        {title && <h3 className="text-sm font-medium text-gray-400 mb-3">{title}</h3>}
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${(Number(percent ?? 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return null
}

// Pre-configured chart components for common use cases
export function CPUUsageChart({ data }: { data?: any[] }) {
  return (
    <MetricsChart
      data={data}
      type="area"
      dataKey="cpu"
      xAxisKey="time"
      title="CPU Usage Over Time"
      color={COLORS.accent}
    />
  )
}

export function MemoryUsageChart({ data }: { data?: any[] }) {
  return (
    <MetricsChart
      data={data}
      type="area"
      dataKey="memory"
      xAxisKey="time"
      title="Memory Usage Over Time"
      color={COLORS.warning}
    />
  )
}

export function RequestVolumeChart({ data }: { data?: any[] }) {
  return (
    <MetricsChart
      data={data}
      type="bar"
      dataKey="requests"
      xAxisKey="time"
      title="Request Volume"
      color={COLORS.info}
    />
  )
}

export function ErrorRateChart({ data }: { data?: any[] }) {
  return (
    <MetricsChart
      data={data}
      type="line"
      dataKey="errors"
      xAxisKey="time"
      title="Error Rate"
      color={COLORS.error}
    />
  )
}

export function ServiceDistributionChart({ data }: { data?: any[] }) {
  return (
    <MetricsChart
      data={data}
      type="pie"
      dataKey="value"
      xAxisKey="name"
      title="Service Distribution"
      height={250}
    />
  )
}
