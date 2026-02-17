"use client"

import { motion } from "framer-motion"
import { Server, Database, CheckCircle } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { ServiceDistributionChart } from "@/components/ui/metrics-chart"

interface ServicesTabProps {
  services: any[]
  serviceData: any[]
}

export function ServicesTab({ services, serviceData }: ServicesTabProps) {
  return (
    <div className="space-y-6">
      {/* Service Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard size="lg"
          icon={Server}
          title="Active Containers"
          value={services.length || 5}
          detail="Running · 0 stopped"
          color="text-cyan-400"
        />
        
        <StatCard size="lg"
          icon={Database}
          title="Services"
          value={serviceData.length}
          detail="AWS services active"
          color="text-accent"
          delay={0.1}
        />
        
        <StatCard size="lg"
          icon={CheckCircle}
          title="Health"
          value="100%"
          detail="All services operational"
          color="text-success"
          delay={0.2}
        />
      </div>

      {/* Large Service Charts */}
      <motion.div 
        className="glass-card p-8 border border-white/10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <ServiceDistributionChart data={serviceData} />
      </motion.div>

      {/* Services List */}
      <motion.div 
        className="glass-card p-6 border border-white/10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-accent" />
          Service Details
        </h3>
        <div className="space-y-3">
          {serviceData.map((service, idx) => (
            <div key={idx} className="glass-card p-4 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="text-sm text-gray-400">
                  {service.value}% utilization
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
