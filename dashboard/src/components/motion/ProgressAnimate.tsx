"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface Props {
  value: number; // 0-100
  color?: string;
  className?: string;
  height?: string;
}

export function ProgressAnimate({
  value,
  color = "bg-vault-accent",
  className,
  height = "h-2",
}: Props) {
  const shouldReduce = useReducedMotion();

  return (
    <div
      className={cn(
        "w-full rounded-full bg-vault-border overflow-hidden",
        height,
        className
      )}
    >
      <motion.div
        className={cn("h-full rounded-full", color)}
        initial={{ width: shouldReduce ? `${value}%` : "0%" }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
      />
    </div>
  );
}
