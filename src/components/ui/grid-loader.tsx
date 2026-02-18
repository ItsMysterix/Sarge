"use client";

import { motion } from "framer-motion";

export function GridLoader({ className, fullPage }: { className?: string, fullPage?: boolean }) {
  const content = (
    <div className={cn("grid grid-cols-2 gap-1.5 w-10 h-10", className)}>
      {[0, 1, 3, 2].map((index) => (
        <motion.div
          key={index}
          className="bg-foreground rounded-[2px]"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center w-full animate-fade-in">
        {content}
      </div>
    );
  }

  return content;
}

import { cn } from "@/lib/utils";
