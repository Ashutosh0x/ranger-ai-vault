"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { Shield, Zap, ArrowDown } from "lucide-react";

export function DualEngine() {
  return (
    <section className="py-24" style={{ background: "rgba(17,24,39,0.3)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-3">Dual-Engine Architecture</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Safety and alpha in one vault. The floor yield is mathematically
            guaranteed — trading only adds.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engine A */}
          <FadeIn direction="left">
            <div className="glass-card p-8 relative overflow-hidden border-glow h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-vault-accent/40" />
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 text-xs border border-vault-accent/30 text-vault-accent rounded-full">
                Engine A — 50% Allocation
              </div>
              <h3 className="text-xl font-semibold mb-2">
                <Shield className="w-5 h-5 inline mr-2 text-vault-accent" />
                Floor Yield
              </h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Stable USDC lending on Kamino Finance. Earns 4-12% APY with zero
                directional risk. Auto-compounds rewards every hour.
              </p>
              <div className="space-y-2">
                {[
                  { label: "Protocol", value: "Kamino Finance" },
                  { label: "Expected APY", value: "4-12%" },
                  { label: "Risk Level", value: "Minimal" },
                  { label: "Compounding", value: "Every 1 hour" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between text-sm py-1.5
                                border-b border-vault-border last:border-0"
                  >
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Engine B */}
          <FadeIn direction="right">
            <div className="glass-card p-8 relative overflow-hidden border-glow h-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-400/40" />
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 text-xs border border-brand-400/30 text-brand-400 rounded-full">
                Engine B — 50% Allocation
              </div>
              <h3 className="text-xl font-semibold mb-2">
                <Zap className="w-5 h-5 inline mr-2 text-brand-400" />
                Active Trading Alpha
              </h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                ML signal-driven momentum + mean-reversion trades on Zeta perps.
                Delta-neutral hedging via Jupiter spot.
              </p>
              <div className="space-y-2">
                {[
                  { label: "Protocol", value: "Zeta + Jupiter" },
                  { label: "Expected APY", value: "13-38% (additive)" },
                  { label: "Max Drawdown", value: "-15% hard limit" },
                  { label: "Signal Interval", value: "Every 15 min" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between text-sm py-1.5
                                border-b border-vault-border last:border-0"
                  >
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Combined result */}
        <FadeIn delay={0.3}>
          <div className="mt-8 text-center">
            <ArrowDown className="w-5 h-5 text-gray-500 mx-auto mb-4" />
            <div
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl
                          bg-vault-accent/5 border border-vault-accent/20"
            >
              <span className="text-sm text-gray-400">
                Combined Target APY:
              </span>
              <span className="text-2xl font-bold text-vault-accent tabular-nums">
                20-50%
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
