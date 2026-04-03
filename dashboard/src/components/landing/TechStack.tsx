"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { ScaleOnHover } from "@/components/motion/ScaleOnHover";

const PROTOCOLS = [
  { name: "Solana", role: "Blockchain" },
  { name: "Ranger / Voltr", role: "Vault Framework" },
  { name: "Drift Protocol", role: "Perp Trading" },
  { name: "Kamino Finance", role: "Floor Yield" },
  { name: "Jupiter", role: "Spot Hedging" },
  { name: "Pyth Network", role: "Oracle Prices" },
  { name: "Helius", role: "RPC Provider" },
  { name: "Coinglass", role: "Liquidation Data" },
];

const TECH = [
  { name: "TypeScript", role: "61.6% codebase" },
  { name: "Python", role: "31.0% codebase" },
  { name: "Next.js 14", role: "Dashboard" },
  { name: "FastAPI", role: "Signal Server" },
  { name: "XGBoost", role: "ML Models" },
  { name: "Recharts", role: "Charts" },
  { name: "Docker", role: "Deployment" },
  { name: "Jest + Pytest", role: "81 Tests" },
];

export function TechStack() {
  return (
    <section className="py-24" style={{ background: "rgba(17,24,39,0.3)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-3">Built With</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            143 files across 4 packages. 81 tests. 7 CI workflows.
            Production-grade engineering.
          </p>
        </FadeIn>

        {/* Protocols */}
        <FadeIn delay={0.1}>
          <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-4">
            Protocols
          </h3>
        </FadeIn>
        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {PROTOCOLS.map(({ name, role }) => (
            <StaggerItem key={name}>
              <ScaleOnHover>
                <div className="glass-card p-4 text-center border-glow !rounded-lg h-full">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{role}</p>
                </div>
              </ScaleOnHover>
            </StaggerItem>
          ))}
        </StaggerGrid>

        {/* Tech */}
        <FadeIn delay={0.1}>
          <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-4">
            Technology
          </h3>
        </FadeIn>
        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TECH.map(({ name, role }) => (
            <StaggerItem key={name}>
              <ScaleOnHover>
                <div className="glass-card p-4 text-center border-glow !rounded-lg h-full">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{role}</p>
                </div>
              </ScaleOnHover>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
