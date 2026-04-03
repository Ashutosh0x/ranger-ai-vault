"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { ScaleOnHover } from "@/components/motion/ScaleOnHover";
import { Wallet, Brain, TrendingUp } from "lucide-react";

const STEPS = [
  {
    icon: Wallet,
    step: "01",
    title: "Deposit USDC",
    desc: "Connect your Phantom or Solflare wallet and deposit USDC into the Ranger AI Vault. You receive LP tokens representing your share.",
  },
  {
    icon: Brain,
    step: "02",
    title: "AI Executes Strategy",
    desc: "Our XGBoost ML engine analyzes 17 features including Coinglass liquidation heatmaps every 15 minutes. Trades are Ed25519-attested before execution.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Earn Yield",
    desc: "50% in Kamino lending for floor yield (4-12% APY). 50% in Drift perps for alpha capture. Combined target: 20-50% APY with controlled risk.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-3">How It Works</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Three steps from deposit to yield — fully automated, fully
            transparent, fully verifiable on-chain.
          </p>
        </FadeIn>

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map(({ icon: Icon, step, title, desc }, i) => (
            <StaggerItem key={step}>
              <div className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-12 -right-4
                                w-8 h-px bg-vault-border"
                  />
                )}

                <ScaleOnHover>
                  <div
                    className="glass-card p-8 border-glow group h-full"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className="w-12 h-12 rounded-xl bg-vault-accent/10
                                    border border-vault-accent/20 flex items-center
                                    justify-center group-hover:bg-vault-accent/20
                                    transition-colors"
                      >
                        <Icon className="w-5 h-5 text-vault-accent" />
                      </div>
                      <span
                        className="text-xs font-mono text-gray-500
                                     tracking-wider"
                      >
                        STEP {step}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </ScaleOnHover>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
