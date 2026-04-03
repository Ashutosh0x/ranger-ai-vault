"use client";

import { motion, useReducedMotion } from "motion/react";
import { staggerContainer, fadeInUp } from "@/lib/animations";

interface StaggerGridProps {
  children: React.ReactNode;
  className?: string;
  once?: boolean;
}

export function StaggerGrid({
  children,
  className,
  once = true,
}: StaggerGridProps) {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-30px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={fadeInUp} className={className}>
      {children}
    </motion.div>
  );
}
