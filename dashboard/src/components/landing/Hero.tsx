"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useMetrics } from "@/hooks";
import { formatUSD, formatPct } from "@/lib/utils";
import { heroText, staggerContainer, glowPulse } from "@/lib/animations";
import { ParticleField } from "@/components/motion/ParticleField";
import { ArrowRight, Shield, Brain, Zap } from "lucide-react";

export function Hero() {
  const { data: metrics } = useMetrics();

  return (
    <section
      className="relative min-h-[90vh] flex items-center justify-center
                  overflow-hidden pt-16"
    >
      {/* Particle network background */}
      <ParticleField />

      {/* Gradient background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,214,160,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(12,165,234,0.04),transparent_50%)]" />

      {/* Floating grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative max-w-5xl mx-auto px-6 text-center z-10"
      >
        {/* Hackathon badge */}
        <motion.div variants={heroText}>
          <div
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 text-xs
                        border border-vault-accent/30 text-vault-accent
                        bg-vault-accent/5 rounded-full"
          >
            🧸 Ranger Build-A-Bear Hackathon — Main Track Submission
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={heroText}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold
                      tracking-tight leading-[1.1] mb-6"
        >
          <span className="text-white">AI-Powered </span>
          <span className="text-gradient-primary">Yield Vault</span>
          <br />
          <span className="text-white">on Solana</span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          variants={heroText}
          className="text-lg sm:text-xl text-gray-400 max-w-2xl
                      mx-auto mb-8 leading-relaxed"
        >
          Momentum + Mean-Reversion hybrid strategy with a provable yield floor.
          Kamino lending for safety, Drift perps for alpha, Ed25519 attestation
          for trust.
        </motion.p>

        {/* Live metrics chips */}
        {metrics && (
          <motion.div
            variants={heroText}
            className="flex flex-wrap items-center justify-center gap-3 mb-10"
          >
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full
                          glass-card border-glow"
            >
              <span className="text-xs text-gray-400">NAV</span>
              <span className="text-sm font-semibold text-vault-accent tabular-nums">
                {formatUSD(metrics.nav_usdc)}
              </span>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full
                          glass-card border-glow"
            >
              <span className="text-xs text-gray-400">APY</span>
              <span className="text-sm font-semibold text-green-400 tabular-nums">
                {formatPct(metrics.realized_apy)}
              </span>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full
                          glass-card border-glow"
            >
              <span className="text-xs text-gray-400">Sharpe</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {metrics.sharpe_ratio?.toFixed(2)}
              </span>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full
                          glass-card"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full
                               rounded-full bg-vault-accent opacity-75"
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2
                               bg-vault-accent"
                />
              </span>
              <span className="text-xs text-vault-accent font-medium">
                LIVE
              </span>
            </div>
          </motion.div>
        )}

        {/* CTAs */}
        <motion.div
          variants={heroText}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.div
            variants={glowPulse}
            initial="rest"
            animate="pulse"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 px-8 py-3.5
                         rounded-xl bg-vault-accent text-vault-bg
                         font-semibold text-sm
                         shadow-lg shadow-vault-accent/20"
            >
              Deposit USDC
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/overview"
              className="inline-flex items-center gap-2 px-8 py-3.5
                         rounded-xl border border-vault-border text-white
                         font-semibold text-sm hover:bg-white/5
                         transition-colors"
            >
              Launch Dashboard
            </Link>
          </motion.div>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          variants={heroText}
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-12 text-xs
                      text-gray-500"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-vault-accent" />
            6-Layer Risk Framework
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-brand-400" />
            17-Feature ML Engine
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-vault-warning" />
            Ed25519 Verified
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
