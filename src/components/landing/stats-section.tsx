"use client"

const stats = [
  { value: "7+", label: "Cloud Providers" },
  { value: "<30s", label: "Deploy Time" },
  { value: "100%", label: "IaC Coverage" },
  { value: "0", label: "Config Files Needed" },
]

export function StatsSection() {
  return (
    <section className="py-16 border-y border-border">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="reveal-on-scroll glass-card rounded-xl p-6 text-center" style={{ transitionDelay: `${i * 80}ms` }}>
            <div className="text-3xl font-bold tracking-tight">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
