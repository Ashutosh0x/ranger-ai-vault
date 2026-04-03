"use client";

import { motion } from "motion/react";
import { FadeIn } from "@/components/motion/FadeIn";
import { buttonPress } from "@/lib/animations";
import { Lock, ExternalLink, CheckCircle } from "lucide-react";

const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
const VAULT = process.env.NEXT_PUBLIC_VAULT_ADDRESS || "";

export function AttestationProof() {
  const cluster = NETWORK === "mainnet-beta" ? "" : `?cluster=${NETWORK}`;
  const solscanUrl =
    VAULT && VAULT !== "FILL_AFTER_DEPLOY"
      ? `https://solscan.io/account/${VAULT}${cluster}`
      : "#";

  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6">
        <FadeIn>
          <div className="glass-card p-8 lg:p-12 relative overflow-hidden border-glow">
            {/* Accent stripe */}
            <div
              className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r
                          from-vault-accent/50 via-brand-400/50 to-vault-accent/50"
            />

            <div className="flex items-start gap-4 mb-8">
              <div
                className="w-12 h-12 rounded-xl bg-vault-accent/10 border
                            border-vault-accent/20 flex items-center justify-center
                            flex-shrink-0"
              >
                <Lock className="w-5 h-5 text-vault-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  On-Chain Verification
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Every trade transaction includes an Ed25519 cryptographic
                  attestation verified on-chain <em>before</em> execution.
                  Anyone can verify on Solscan that the AI agent authorized each
                  trade.
                </p>
              </div>
            </div>

            {/* What to look for */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {[
                "Ed25519SigVerify instruction in every trade TX",
                "Receipt refresh TXs every ~5 minutes",
                "Drift perp order placements",
                "Jupiter spot swap TXs for hedging",
                "Kamino reward claim + compound TXs",
                "Consistent activity Mar 9 — Apr 6, 2026",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-vault-accent mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400">{item}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <motion.a
              href={solscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={buttonPress.hover}
              whileTap={buttonPress.tap}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                         bg-vault-accent/10 border border-vault-accent/20
                         text-vault-accent text-sm font-medium
                         hover:bg-vault-accent/20 transition-colors"
            >
              Verify on Solscan
              <ExternalLink className="w-3.5 h-3.5" />
            </motion.a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
