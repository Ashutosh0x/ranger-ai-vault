"use client";

import { motion, useReducedMotion } from "motion/react";
import { cardHover } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function ScaleOnHover({ children, className }: Props) {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className={cn("cursor-pointer", className)}
    >
      {children}
    </motion.div>
  );
}
