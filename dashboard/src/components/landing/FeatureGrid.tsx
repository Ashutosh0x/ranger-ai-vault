"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { ScaleOnHover } from "@/components/motion/ScaleOnHover";
import {
  Flame,
  ShieldCheck,
  Layers,
  RotateCcw,
  Brain,
  Lock,
  BarChart3,
  Cpu,
} from "lucide-react";

const FEATURES = [
  {
    icon: Flame,
    title: "Liquidation Heatmap ML",
    desc: "7 features from Coinglass liquidation clusters. No other vault uses this — price magnets give structural edge.",
    tag: "Unique",
  },
  {
    icon: ShieldCheck,
    title: "Ed25519 Attestation",
    desc: "Every trade is cryptographically signed by the AI agent and verified on-chain before execution. Verifiable on Solscan.",
    tag: "On-Chain Proof",
  },
  {
    icon: Layers,
    title: "6-Layer Risk Framework",
    desc: "Structural → Per-Trade → Portfolio → Protocol → Operational → Emergency. Circuit breakers auto-unwind on breach.",
    tag: "Safety",
  },
  {
    icon: RotateCcw,
    title: "Three-Loop Rebalance",
    desc: "Receipt refresh (5min), reward compounding (1hr), signal rebalance (15min). Most vaults only have one loop.",
    tag: "Advantage",
  },
  {
    icon: Brain,
    title: "17-Feature XGBoost",
    desc: "Momentum + mean-reversion ensemble. Walk-forward validated with Sharpe >1.5 over 6 months of backtest data.",
    tag: "ML",
  },
  {
    icon: Lock,
    title: "Provable Yield Floor",
    desc: "50% in Kamino lending means 4-12% APY guaranteed even with zero trading activity. Alpha only adds — never subtracts.",
    tag: "Floor",
  },
  {
    icon: BarChart3,
    title: "Walk-Forward Backtest",
    desc: "6-month out-of-sample validation. 32.4% annualized, -4.8% max drawdown, 56.5% win rate, 1.93 profit factor.",
    tag: "Verified",
  },
  {
    icon: Cpu,
    title: "Full-Stack Open Source",
    desc: "143 files: Python signal engine, TypeScript keeper, Next.js dashboard, Solana vault. 81 tests. 7 CI workflows.",
    tag: "Complete",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-3">Key Differentiators</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            What makes this vault different from every other hackathon
            submission.
          </p>
        </FadeIn>

        <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, tag }) => (
            <StaggerItem key={title}>
              <ScaleOnHover>
                <div
                  className="glass-card p-6 border-glow group h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-lg bg-vault-accent/10
                                  border border-vault-accent/20 flex items-center
                                  justify-center group-hover:bg-vault-accent/20
                                  transition-colors"
                    >
                      <Icon className="w-4 h-4 text-vault-accent" />
                    </div>
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider
                                   text-gray-500 bg-vault-bg px-2 py-0.5
                                   rounded-full"
                    >
                      {tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold mb-2">{title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </ScaleOnHover>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
