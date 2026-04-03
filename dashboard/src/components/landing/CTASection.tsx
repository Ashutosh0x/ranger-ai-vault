"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { FadeIn } from "@/components/motion/FadeIn";
import { glowPulse, buttonPress } from "@/lib/animations";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <FadeIn>
          <h2 className="text-3xl font-bold mb-4">
            Ready to Earn AI-Powered Yield?
          </h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">
            Connect your wallet, deposit USDC, and let the AI strategy work for
            you. Every trade is verifiable on-chain.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div
              variants={glowPulse}
              initial="rest"
              animate="pulse"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                href="/vault"
                className="inline-flex items-center gap-2 px-8 py-4
                           rounded-xl bg-vault-accent text-vault-bg
                           font-semibold shadow-lg shadow-vault-accent/20"
              >
                Deposit Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={buttonPress.hover}
              whileTap={buttonPress.tap}
            >
              <Link
                href="/overview"
                className="inline-flex items-center gap-2 px-8 py-4
                           rounded-xl border border-vault-border text-white
                           font-semibold hover:bg-white/5 transition-colors"
              >
                View Dashboard
              </Link>
            </motion.div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
