import React from "react"
import { MetricsChart } from "./metrics-chart"

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
