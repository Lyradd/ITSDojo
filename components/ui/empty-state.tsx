"use client";

import { motion } from "framer-motion";
import React from "react";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  animate?: "float" | "bounce" | "pulse" | "none";
}

export function EmptyState({ icon, title, description, action, animate = "float" }: EmptyStateProps) {
  const animations = {
    float: { y: [0, -10, 0] },
    bounce: { y: [0, -15, 0] },
    pulse: { scale: [1, 1.1, 1] },
    none: {}
  };

  const transition = {
    float: { repeat: Infinity, duration: 3, ease: "easeInOut" },
    bounce: { repeat: Infinity, duration: 1.5, ease: "easeOut" },
    pulse: { repeat: Infinity, duration: 2, ease: "easeInOut" },
    none: {}
  } as const;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center w-full"
    >
      <motion.div 
        animate={animations[animate]}
        transition={transition[animate]}
        className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 ring-8 ring-zinc-50 dark:ring-zinc-900/50 relative text-zinc-400 dark:text-zinc-500"
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">{title}</h3>
      <p className="text-sm md:text-base text-zinc-500 max-w-md mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      {action && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
