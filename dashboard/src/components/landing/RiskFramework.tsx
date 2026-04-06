"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { ScaleOnHover } from "@/components/motion/ScaleOnHover";
import {
  Shield,
  Target,
  BarChart3,
  Monitor,
  Lock,
  AlertTriangle,
} from "lucide-react";

const LAYERS = [
  {
    icon: Shield,
    layer: "Layer 1",
    title: "Structural",
    items: [
      "50% Kamino (no directional risk)",
      "50% active (controlled)",
      "Net delta ≈ 0",
    ],
  },
  {
    icon: Target,
    layer: "Layer 2",
    title: "Per-Trade",
    items: [
      "-0.5% stop-loss",
      "+1.5% take-profit",
      "Kelly sizing (25%)",
      "Max 3 positions",
    ],
  },
  {
    icon: BarChart3,
    layer: "Layer 3",
    title: "Portfolio",
    items: [
      "Daily DD limit: 3%",
      "Monthly DD limit: 8%",
      "VaR ≤ 2% at 95%",
      "|Δ| < 0.10",
    ],
  },
  {
    icon: Monitor,
    layer: "Layer 4",
    title: "Protocol",
    items: [
      "Zeta health ≥ 15",
      "Max leverage 2.0x",
      "Oracle divergence < 1%",
    ],
  },
  {
    icon: Lock,
    layer: "Layer 5",
    title: "Operational",
    items: [
      "Ed25519 attestation",
      "Authenticated signals",
      "Receipt refresh (5min)",
    ],
  },
  {
    icon: AlertTriangle,
    layer: "Layer 6",
    title: "Emergency",
    items: [
      "Full unwind on breach",
      "Move to Kamino safe mode",
      "Telegram critical alerts",
    ],
  },
];

export function RiskFramework() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-3">6-Layer Risk Framework</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Defense in depth. Every layer has automated circuit breakers that
            trigger without human intervention.
          </p>
        </FadeIn>

        <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LAYERS.map(({ icon: Icon, layer, title, items }) => (
            <StaggerItem key={layer}>
              <ScaleOnHover>
                <div className="glass-card p-6 border-glow h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-4 h-4 text-vault-accent" />
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                        {layer}
                      </span>
                      <h3 className="text-sm font-semibold">{title}</h3>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-xs text-gray-400"
                      >
                        <span className="w-1 h-1 rounded-full bg-vault-accent flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScaleOnHover>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
