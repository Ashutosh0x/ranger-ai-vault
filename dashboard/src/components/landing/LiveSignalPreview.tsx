"use client";

import { motion } from "motion/react";
import { FadeIn } from "@/components/motion/FadeIn";
import { ProgressAnimate } from "@/components/motion/ProgressAnimate";
import { staggerFast, tableRow } from "@/lib/animations";
import { useSignals } from "@/hooks";
import { cn } from "@/lib/utils";

export function LiveSignalPreview() {
  const { data: signals, isLoading, dataUpdatedAt } = useSignals();

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : "—";

  const assets = ["SOL-PERP", "BTC-PERP", "ETH-PERP"];

  return (
    <section className="py-24" style={{ background: "rgba(17,24,39,0.3)" }}>
      <div className="max-w-4xl mx-auto px-6">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Live Signal Feed</h2>
          <p className="text-gray-400">
            XGBoost ensemble updates every 15 minutes — last update:{" "}
            {lastUpdate}
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="glass-card overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4
                          border-b border-vault-border"
            >
              <span className="text-sm font-semibold">Asset Signals</span>
              <div className="flex items-center gap-2">
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
            </div>

            {/* Signal rows */}
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 w-full rounded animate-shimmer"
                  />
                ))}
              </div>
            ) : (
              <motion.div
                variants={staggerFast}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="divide-y divide-vault-border"
              >
                {assets.map((asset) => {
                  const sig = signals?.[asset];
                  const signal = sig?.signal ?? 0;
                  const confidence = sig?.confidence ?? 0;
                  const direction =
                    signal > 0.6
                      ? "long"
                      : signal < -0.6
                        ? "short"
                        : "neutral";

                  return (
                    <motion.div
                      key={asset}
                      variants={tableRow}
                      className="flex items-center justify-between
                                 px-6 py-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm font-semibold w-24">
                          {asset}
                        </span>
                        <span
                          className={cn(
                            "px-3 py-1 text-xs rounded-full font-medium w-20 text-center",
                            direction === "long"
                              ? "bg-green-500/20 text-green-400"
                              : direction === "short"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-gray-500/20 text-gray-400"
                          )}
                        >
                          {direction.toUpperCase()}
                        </span>
                      </div>

                      {/* Confidence bar */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          Confidence
                        </span>
                        <ProgressAnimate
                          value={confidence * 100}
                          color={
                            confidence > 0.7
                              ? "bg-vault-accent"
                              : confidence > 0.5
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                          }
                          className="w-24"
                        />
                        <span className="text-sm font-medium w-12 text-right tabular-nums">
                          {(confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
