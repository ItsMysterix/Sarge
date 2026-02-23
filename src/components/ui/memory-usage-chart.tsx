import React from "react"
import { MetricsChart } from "./metrics-chart"

const COLORS = {
  warning: '#ffb800',
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
