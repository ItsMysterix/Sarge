"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Brain } from "lucide-react";

interface PageTitleProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageTitle({
  title,
  description,
  icon,
  actions,
  className = "",
}: PageTitleProps) {
  return (
    <motion.div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8 ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div>
        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
          <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
            {icon || <Brain className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-accent" />}
          </motion.div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">{title}</h1>
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-gray-400">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
