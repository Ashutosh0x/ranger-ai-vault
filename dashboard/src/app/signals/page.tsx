"use client";

export default function SignalsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Live Signals</h1>
        <p className="text-gray-400 mt-1">AI-generated trading signals from the ML ensemble</p>
      </div>

      {/* Signal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {["SOL-PERP", "BTC-PERP", "ETH-PERP"].map((asset) => (
          <div key={asset} className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{asset}</h3>
              <span className="px-3 py-1 text-xs bg-vault-border rounded-full text-gray-400">
                Neutral
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
                {/* Needle at center (0 signal) */}
                <div
                  className="absolute top-0 w-1 h-full bg-white rounded-full"
                  style={{ left: "50%" }}
                />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Signal</span>
                <span>0.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Confidence</span>
                <span>0.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Momentum</span>
                <span>0.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mean-Rev</span>
                <span>0.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Regime</span>
                <span>--</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Importance */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Feature Importance</h2>
        <p className="text-gray-400 text-sm">
          Top features driving signal predictions. Connect the signal
          server to see live values.
        </p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            "liq_imbalance_ratio",
            "bollinger_zscore",
            "funding_rate_1h",
            "liq_proximity_score",
            "price_momentum_1h",
            "volume_ratio",
            "liq_magnetic_pull",
            "basis_spread",
          ].map((feat) => (
            <div key={feat} className="px-3 py-2 bg-vault-bg rounded-lg text-xs">
              <span className="text-gray-400">{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
