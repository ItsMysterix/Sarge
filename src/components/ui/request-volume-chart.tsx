import React from "react"
import { MetricsChart } from "./metrics-chart"

const COLORS = {
  info: '#00d4ff',
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
