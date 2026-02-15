"use client";

import { motion } from "framer-motion";

export function GridLoader({ className }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-1 w-8 h-8 ${className}`}>
      {[0, 1, 3, 2].map((index) => (
        <motion.div
          key={index}
          className="bg-white rounded-[1px]"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
