"use client";

import { useSignals } from "@/hooks/useSignals";

export default function SignalsPage() {
  const { data: signals, isLoading } = useSignals();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Live Signals</h1>
        <p className="text-gray-400 mt-1">AI-generated trading signals from the ML ensemble</p>
      </div>

      {/* Signal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {["SOL-PERP", "BTC-PERP", "ETH-PERP"].map((asset) => {
          const s = signals?.[asset];
          const signal = s?.signal ?? 0;
          const confidence = s?.confidence ?? 0;
          const momentum = s?.momentum_component ?? 0;
          const meanrev = s?.meanrev_component ?? 0;
          const regime = s?.regime ?? "--";
          const action =
            signal > 0.6 ? "Long" : signal < -0.6 ? "Short" : "Neutral";
          const actionColor =
            action === "Long"
              ? "bg-green-500/20 text-green-400"
              : action === "Short"
                ? "bg-red-500/20 text-red-400"
                : "bg-vault-border text-gray-400";

          return (
            <div key={asset} className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{asset}</h3>
                <span className={`px-3 py-1 text-xs rounded-full ${actionColor}`}>
                  {action}
                </span>
              </div>

              {/* Signal Gauge */}
              <div className="my-6">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Short</span>
                  <span>Neutral</span>
                  <span>Long</span>
                </div>
                <div className="h-3 bg-vault-border rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 flex">
                    <div className="w-1/2 bg-gradient-to-r from-red-500/30 to-transparent" />
                    <div className="w-1/2 bg-gradient-to-l from-green-500/30 to-transparent" />
                  </div>
                  {/* Needle */}
                  <div
                    className="absolute top-0 w-1 h-full bg-white rounded-full transition-all duration-700"
                    style={{ left: `${((signal + 1) / 2) * 100}%` }}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Signal</span>
                  <span className={signal > 0.3 ? "text-green-400" : signal < -0.3 ? "text-red-400" : ""}>
                    {signal.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence</span>
                  <span>{(confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Momentum</span>
                  <span>{momentum.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mean-Rev</span>
                  <span>{meanrev.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Regime</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    regime === "trending"
                      ? "bg-blue-500/20 text-blue-400"
                      : regime === "ranging"
                        ? "bg-purple-500/20 text-purple-400"
                        : regime === "volatile"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}>{regime}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Importance */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Feature Set (17 Features)</h2>
        <p className="text-gray-400 text-sm mb-4">
          Features driving signal predictions. Liquidation features (liq_*) are the key differentiator.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "funding_rate_1h", source: "Drift" },
            { name: "funding_rate_8h_ma", source: "Drift" },
            { name: "oi_change_1h", source: "Drift" },
            { name: "volume_ratio", source: "Drift" },
            { name: "price_momentum_15m", source: "Pyth" },
            { name: "price_momentum_1h", source: "Pyth" },
            { name: "bollinger_zscore", source: "Computed" },
            { name: "basis_spread", source: "Drift/Pyth" },
            { name: "rsi_14", source: "Computed" },
            { name: "vwap_deviation", source: "Computed" },
            { name: "liq_nearest_long_dist", source: "Coinglass" },
            { name: "liq_nearest_short_dist", source: "Coinglass" },
            { name: "liq_long_density_5pct", source: "Coinglass" },
            { name: "liq_short_density_5pct", source: "Coinglass" },
            { name: "liq_imbalance_ratio", source: "Coinglass" },
            { name: "liq_magnetic_pull", source: "Coinglass" },
            { name: "liq_proximity_score", source: "Coinglass" },
          ].map((feat) => (
            <div
              key={feat.name}
              className={`px-3 py-2 rounded-lg text-xs ${
                feat.source === "Coinglass"
                  ? "bg-purple-500/10 border border-purple-500/20"
                  : "bg-vault-bg"
              }`}
            >
              <span className="text-gray-300">{feat.name}</span>
              <span className="text-gray-500 ml-1 text-[10px]">({feat.source})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
