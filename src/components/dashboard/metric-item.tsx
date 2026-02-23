import { motion } from 'framer-motion'

export function MetricItem({ 
  label, 
  value, 
  status, 
  icon: Icon, 
  delay 
}: { 
  label: string
  value: any
  status: "success" | "warning" | "error"
  icon: any
  delay: number 
}) {
  const statusColors = {
    success: "text-success",
    warning: "text-warning",
    error: "text-error"
  }

  return (
    <motion.div 
      className="text-center p-4 glass-card rounded-lg border border-white/10 hover:border-accent/30 transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${statusColors[status]}`} />
        <div className="text-xs text-gray-400">{label}</div>
      </div>
      <motion.div 
        className={`text-2xl font-bold ${statusColors[status]}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.2, type: "spring" }}
      >
        {value}
      </motion.div>
    </motion.div>
  )
}
