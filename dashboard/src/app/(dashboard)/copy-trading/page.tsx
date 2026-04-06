"use client";

import { Copy, Lock, TrendingUp, Shield, Activity } from "lucide-react";

export default function CopyTradingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Copy className="w-8 h-8 text-vault-accent" />
          Copy Trading
        </h1>
        <p className="text-gray-400 mt-1">
          Mirror the AI vault&apos;s strategy in your own Zeta sub-account
        </p>
      </div>

      {/* Feature Banner */}
      <div className="glass-card p-8 border border-vault-accent/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-vault-accent/5 to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-vault-accent" />
            <span className="text-xs text-vault-accent uppercase tracking-widest font-semibold">
              Coming Soon
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2">AI-Powered Copy Trading</h2>
          <p className="text-gray-400 max-w-xl">
            Automatically mirror every signal from the Ranger AI ensemble into your
            own Zeta sub-account. Set your own risk limits, position sizing, and
            asset allowlist.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            step: "01",
            icon: TrendingUp,
            title: "Signal Generation",
            desc: "XGBoost ensemble produces signals every 15 seconds from 17 features including Coinglass liquidation data.",
          },
          {
            step: "02",
            icon: Shield,
            title: "Risk Check",
            desc: "Each signal passes through VaR, drawdown, and delta-neutral guardrails before execution.",
          },
          {
            step: "03",
            icon: Activity,
            title: "Mirror Execution",
            desc: "Ed25519-attested trades are mirrored to your Zeta sub-account with configurable sizing.",
          },
        ].map((item) => (
          <div key={item.step} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold text-vault-accent/30">{item.step}</span>
              <item.icon className="w-5 h-5 text-vault-accent" />
            </div>
            <h3 className="font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Waitlist CTA */}
      <div className="glass-card p-6 text-center">
        <p className="text-gray-400 mb-4">
          Copy trading launches after vault deployment on mainnet.
        </p>
        <button
          disabled
          className="px-8 py-3 bg-vault-accent/20 text-vault-accent font-semibold rounded-xl cursor-not-allowed opacity-60"
        >
          Join Waitlist
        </button>
      </div>
    </div>
  );
}
