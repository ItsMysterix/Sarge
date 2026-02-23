import React from "react"
import { MetricsChart } from "./metrics-chart"

const COLORS = {
  error: '#ff4757',
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
