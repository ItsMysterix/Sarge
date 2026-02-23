import React from "react"
import CountUp from "react-countup"
import { cn } from "@/lib/utils"

export const StatCard = React.memo(({ label, value, icon, trend, trendUp }: {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
}) => {
  let renderValue: React.ReactNode = value
  if (typeof value === "number") {
    renderValue = <CountUp end={value} duration={2} separator="," />
  } else if (typeof value === "string") {
    const numMatch = value.match(/^([^\d]*)?([\d,.]+)([^\d]*)?$/)
    if (numMatch) {
      const prefix = numMatch[1] || ""
      const numValue = parseFloat(numMatch[2].replace(/,/g, ""))
      const suffix = numMatch[3] || ""
      if (!isNaN(numValue)) {
        renderValue = <CountUp end={numValue} duration={2} separator="," prefix={prefix} suffix={suffix} decimals={numValue % 1 !== 0 ? 2 : 0} />
      }
    }
  }

  return (
    <div className="card-elevated gpu-accelerate">
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground">{icon}</span>
        {trend && (
          <span className={cn(
            "text-xs font-medium",
            trendUp ? "text-emerald-400" : "text-red-400"
          )}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold mb-1">{renderValue}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
})
