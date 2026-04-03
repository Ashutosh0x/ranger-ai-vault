"use client";

import { useBacktest } from "@/hooks/useBacktest";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

export default function BacktestPage() {
  const { data: backtest, isLoading, error } = useBacktest();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Backtest Results</h1>
          <p className="text-gray-400 mt-1">Loading backtest data...</p>
        </div>
        <div className="glass-card p-12 text-center">
          <div className="w-8 h-8 border-2 border-vault-accent border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !backtest) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Backtest Results</h1>
          <p className="text-gray-400 mt-1">No backtest data available</p>
        </div>
        <div className="glass-card p-12 text-center">
          <p className="text-lg text-gray-400 mb-2">Backtest has not been run yet</p>
          <p className="text-sm text-gray-500">
            Run the backtest pipeline to generate results:
          </p>
          <code className="inline-block mt-3 bg-vault-bg px-4 py-2 rounded-lg text-sm text-vault-accent">
            cd signal-engine && python -m backtest.run_backtest
          </code>
          <p className="text-xs text-gray-500 mt-3">
            or: <code className="bg-vault-bg px-2 py-0.5 rounded">make backtest</code>
          </p>
        </div>
      </div>
    );
  }

  const equityData = backtest.equity_curve_raw || [];

  // Compute weekly returns from equity curve
  const weeklyReturns: Array<{ week: string; pct: number }> = [];
  if (equityData.length > 0) {
    const chunkSize = Math.max(Math.floor(equityData.length / 8), 1);
    for (let i = 0; i < equityData.length - chunkSize; i += chunkSize) {
      const start = equityData[i].equity;
      const end = equityData[Math.min(i + chunkSize, equityData.length - 1)].equity;
      const pct = ((end - start) / start) * 100;
      weeklyReturns.push({
        week: `Period ${weeklyReturns.length + 1}`,
        pct: +pct.toFixed(2),
      });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Backtest Results</h1>
        <p className="text-gray-400 mt-1">
          {backtest.walk_forward ? "Walk-forward" : "Standard"} backtest
          {backtest.assets?.length ? ` — ${backtest.assets.join(", ")}` : ""}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Generated: {backtest.generated_at ? new Date(backtest.generated_at).toLocaleString() : "—"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <SummaryCard
          label="Total P&L"
          value={`$${(backtest.total_pnl_usd / 1000).toFixed(1)}K`}
          positive={backtest.total_pnl_usd > 0}
        />
        <SummaryCard
          label="Win Rate"
          value={`${(backtest.win_rate * 100).toFixed(1)}%`}
          positive={backtest.win_rate > 0.5}
        />
        <SummaryCard
          label="Sharpe Ratio"
          value={backtest.sharpe_ratio.toFixed(2)}
          positive={backtest.sharpe_ratio > 1}
        />
        <SummaryCard
          label="Max Drawdown"
          value={`${(Math.abs(backtest.max_drawdown) * 100).toFixed(1)}%`}
          positive={Math.abs(backtest.max_drawdown) < 0.03}
        />
      </div>

      {/* Equity Curve */}
      {equityData.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Equity Curve</h2>
            <span className={`text-sm font-mono ${
              backtest.total_return_pct >= 0 ? "text-green-400" : "text-red-400"
            }`}>
              {backtest.total_return_pct >= 0 ? "+" : ""}{backtest.total_return_pct.toFixed(2)}% total
            </span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06D6A0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06D6A0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d44" />
              <XAxis
                dataKey="candle"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                label={{
                  value: "Candles (1h)",
                  position: "insideBottom",
                  offset: -5,
                  style: { fill: "#6b7280", fontSize: 11 },
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #2d2d44",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Equity"]}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="#06D6A0"
                fill="url(#eqGrad)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Period Returns */}
      {weeklyReturns.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Period Returns</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyReturns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d44" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #2d2d44",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                formatter={(v: number) => [`${v.toFixed(2)}%`, "Return"]}
              />
              <Bar
                dataKey="pct"
                fill="#06D6A0"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Stats */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Detailed Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Total Trades", value: backtest.total_trades.toString() },
            { label: "Win Rate", value: `${(backtest.win_rate * 100).toFixed(1)}%` },
            { label: "Avg Win", value: `${(backtest.avg_win * 100).toFixed(2)}%` },
            { label: "Avg Loss", value: `${(backtest.avg_loss * 100).toFixed(2)}%` },
            { label: "Profit Factor", value: backtest.profit_factor.toFixed(2) },
            { label: "Sharpe Ratio", value: backtest.sharpe_ratio.toFixed(2) },
            { label: "Max Drawdown", value: `${(Math.abs(backtest.max_drawdown) * 100).toFixed(1)}%` },
            { label: "Annualized Return", value: `${(backtest.annualized_return * 100).toFixed(1)}%` },
            { label: "Total P&L", value: `$${backtest.total_pnl_usd.toLocaleString()}` },
            { label: "Initial Capital", value: `$${backtest.initial_capital.toLocaleString()}` },
            { label: "Final Equity", value: `$${backtest.final_equity.toLocaleString()}` },
            { label: "Avg Hold Time", value: `${backtest.avg_hold_periods.toFixed(0)}h` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-lg font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p
        className={`text-2xl font-bold mt-2 ${
          positive ? "text-vault-accent" : "text-red-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
