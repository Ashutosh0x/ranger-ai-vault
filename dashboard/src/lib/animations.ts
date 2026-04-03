// lib/animations.ts
"use client";

import type { Variants, Transition } from "motion/react";

// ── Global timing constants ──────────────────────────
export const TIMING = {
  fast: 0.15,
  normal: 0.3,
  medium: 0.5,
  slow: 0.8,
  stagger: 0.07,
} as const;

// ── Spring presets ───────────────────────────────────
export const SPRINGS = {
  snappy: { type: "spring", stiffness: 400, damping: 30 } as Transition,
  gentle: { type: "spring", stiffness: 200, damping: 25 } as Transition,
  bouncy: { type: "spring", stiffness: 300, damping: 15 } as Transition,
  smooth: { type: "spring", stiffness: 100, damping: 20 } as Transition,
} as const;

// ── Fade In Up (cards, stat cards, sections) ─────────
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...SPRINGS.gentle, duration: TIMING.medium },
  },
};

// ── Fade In (modals, overlays) ───────────────────────
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: TIMING.normal } },
  exit: { opacity: 0, transition: { duration: TIMING.fast } },
};

// ── Slide In Left (sidebar items) ────────────────────
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: SPRINGS.gentle },
};

// ── Slide In Right (notifications) ───────────────────
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: SPRINGS.gentle },
};

// ── Scale In (badges, indicators) ────────────────────
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: SPRINGS.snappy },
};

// ── Stagger Container (parent that staggers children) ─
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: TIMING.stagger,
      delayChildren: 0.1,
    },
  },
};

// ── Stagger Fast (table rows) ────────────────────────
export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

// ── Card Hover ───────────────────────────────────────
export const cardHover = {
  rest: {
    scale: 1,
    y: 0,
    transition: SPRINGS.snappy,
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: SPRINGS.snappy,
  },
  tap: {
    scale: 0.98,
    transition: { duration: TIMING.fast },
  },
};

// ── Button Press ─────────────────────────────────────
export const buttonPress = {
  tap: { scale: 0.97 },
  hover: { scale: 1.02 },
};

// ── Expand / Collapse ────────────────────────────────
export const expandCollapse: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: TIMING.normal, ease: "easeInOut" },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { duration: TIMING.normal, ease: "easeInOut" },
  },
};

// ── Path Draw (equity curve SVG) ─────────────────────
export const pathDraw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.5, ease: "easeInOut" },
  },
};

// ── Number Pop (stat values) ─────────────────────────
export const numberPop: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: SPRINGS.bouncy,
  },
};

// ── Hero Text (landing page) ─────────────────────────
export const heroText: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: TIMING.slow, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ── Table Row ────────────────────────────────────────
export const tableRow: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: TIMING.normal } },
  exit: { opacity: 0, x: 10, transition: { duration: TIMING.fast } },
};

// ── Toast / Notification ─────────────────────────────
export const toast: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRINGS.snappy,
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: { duration: TIMING.fast },
  },
};

// ── Glow Pulse (CTA buttons) ─────────────────────────
export const glowPulse: Variants = {
  rest: {
    boxShadow: "0 0 0 0 rgba(6, 214, 160, 0)",
  },
  pulse: {
    boxShadow: [
      "0 0 0 0 rgba(6, 214, 160, 0.4)",
      "0 0 0 12px rgba(6, 214, 160, 0)",
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};
