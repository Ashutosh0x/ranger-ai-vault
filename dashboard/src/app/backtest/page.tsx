"use client";

export default function BacktestPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Backtest Results</h1>
        <p className="text-gray-400 mt-1">Historical strategy performance analysis</p>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <p className="text-xs text-gray-400 uppercase">Sharpe Ratio</p>
          <p className="text-2xl font-bold mt-2">--</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-gray-400 uppercase">Max Drawdown</p>
          <p className="text-2xl font-bold mt-2">--%</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-gray-400 uppercase">Win Rate</p>
          <p className="text-2xl font-bold mt-2">--%</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-gray-400 uppercase">Total Trades</p>
          <p className="text-2xl font-bold mt-2">--</p>
        </div>
      </div>

      {/* Equity Curve Placeholder */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Equity Curve</h2>
        <div className="h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-4xl mb-2">📊</p>
            <p>Run <code className="text-vault-accent">make backtest</code> to generate results</p>
            <p className="text-sm mt-2 text-gray-600">Results will appear here automatically</p>
          </div>
        </div>
      </div>

      {/* Strategy Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Momentum Model</h2>
          <div className="space-y-3">
            <StatRow label="RMSE (Test)" value="--" />
            <StatRow label="Correlation" value="--" />
            <StatRow label="Contribution" value="40%" />
            <StatRow label="Top Feature" value="--" />
          </div>
        </div>
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Mean-Reversion Model</h2>
          <div className="space-y-3">
            <StatRow label="RMSE (Test)" value="--" />
            <StatRow label="Correlation" value="--" />
            <StatRow label="Contribution" value="60%" />
            <StatRow label="Top Feature" value="--" />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="glass-card p-6 border-l-4 border-vault-accent">
        <h2 className="text-lg font-semibold mb-2">How to Run Backtest</h2>
        <div className="space-y-2 text-sm text-gray-400">
          <p>1. Install signal engine dependencies: <code className="text-vault-accent">cd signal-engine && pip install -r requirements.txt</code></p>
          <p>2. Train models: <code className="text-vault-accent">make train</code></p>
          <p>3. Run backtest: <code className="text-vault-accent">make backtest</code></p>
          <p>4. Results saved to <code className="text-vault-accent">signal-engine/tests/backtests/results/</code></p>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-vault-border/30">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
