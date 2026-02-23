import React from "react"
import { MetricsChart } from "./metrics-chart"

const COLORS = {
  accent: '#00ff9f',
  warning: '#ffb800',
  error: '#ff4757',
  success: '#00ff9f',
  info: '#00d4ff',
}

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
