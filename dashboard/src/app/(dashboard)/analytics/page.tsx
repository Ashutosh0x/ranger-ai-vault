"use client";

import { LineChart, TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <LineChart className="w-8 h-8 text-vault-accent" />
          Analytics
        </h1>
        <p className="text-gray-400 mt-1">Deep-dive performance analytics and strategy attribution</p>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Cumulative Return", value: "+0.00%", icon: TrendingUp, color: "text-vault-accent" },
          { label: "Daily Avg Return", value: "0.00%", icon: BarChart3, color: "text-blue-400" },
          { label: "Worst Day", value: "0.00%", icon: TrendingDown, color: "text-red-400" },
          { label: "Active Days", value: "0", icon: Activity, color: "text-purple-400" },
        ].map((card) => (
          <div key={card.label} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <p className="text-xs text-gray-400 uppercase tracking-wider">{card.label}</p>
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Strategy Attribution */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Strategy Attribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Momentum Strategy</span>
              <span className="text-vault-accent">40% weight</span>
            </div>
            <div className="h-2 bg-vault-border rounded-full overflow-hidden">
              <div className="h-full w-[40%] bg-vault-accent rounded-full" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Mean-Reversion Strategy</span>
              <span className="text-blue-400">60% weight</span>
            </div>
            <div className="h-2 bg-vault-border rounded-full overflow-hidden">
              <div className="h-full w-[60%] bg-blue-400 rounded-full" />
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Kamino Lending", value: "Base yield layer", badge: "Active" },
              { label: "Zeta Perps", value: "Momentum + Mean-rev", badge: "Active" },
              { label: "Jupiter DCA", value: "Spot rebalancing", badge: "Standby" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-vault-border/30">
                <div>
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="text-xs text-gray-500">{row.value}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  row.badge === "Active"
                    ? "bg-vault-accent/20 text-vault-accent"
                    : "bg-vault-border text-gray-400"
                }`}>
                  {row.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Importance */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Top Signal Drivers</h2>
        <p className="text-sm text-gray-400 mb-4">
          XGBoost feature importance from the trained ensemble model.
          Run the signal engine to populate live data.
        </p>
        <div className="space-y-3">
          {[
            { name: "funding_rate_1h", importance: 0.068 },
            { name: "liq_short_density_5pct", importance: 0.065 },
            { name: "bollinger_zscore", importance: 0.062 },
            { name: "basis_spread", importance: 0.058 },
            { name: "liq_magnetic_pull", importance: 0.054 },
          ].map((feat) => (
            <div key={feat.name} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-48 shrink-0 font-mono">{feat.name}</span>
              <div className="flex-1 h-2 bg-vault-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-vault-accent to-blue-400 rounded-full transition-all"
                  style={{ width: `${feat.importance * 100 * 15}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-12 text-right">{(feat.importance * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
