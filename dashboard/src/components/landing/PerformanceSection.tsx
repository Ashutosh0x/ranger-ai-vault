"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerGrid, StaggerItem } from "@/components/motion/StaggerGrid";
import { CountUp } from "@/components/motion/CountUp";
import { useBacktest } from "@/hooks";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export function PerformanceSection() {
  const { data: bt, isLoading } = useBacktest();

  const METRICS: Array<{
    label: string;
    value: number;
    suffix?: string;
    prefix?: string;
    decimals?: number;
    pass?: boolean;
  }> = [
    { label: "Period", value: 0, decimals: 0 },
    {
      label: "Annualized APY",
      value: (bt?.annualized_return ?? 0) * 100,
      suffix: "%",
      decimals: 1,
      pass: (bt?.annualized_return ?? 0) >= 0.1,
    },
    {
      label: "Sharpe Ratio",
      value: bt?.sharpe_ratio ?? 0,
      decimals: 2,
      pass: (bt?.sharpe_ratio ?? 0) >= 1.5,
    },
    {
      label: "Max Drawdown",
      value: (bt?.max_drawdown ?? 0) * 100,
      prefix: "-",
      suffix: "%",
      decimals: 2,
      pass: (bt?.max_drawdown ?? 0) < 0.15,
    },
    {
      label: "Win Rate",
      value: (bt?.win_rate ?? 0) * 100,
      suffix: "%",
      decimals: 1,
      pass: (bt?.win_rate ?? 0) >= 0.5,
    },
    {
      label: "Profit Factor",
      value: bt?.profit_factor ?? 0,
      decimals: 2,
      pass: (bt?.profit_factor ?? 0) >= 1.5,
    },
    {
      label: "Total Trades",
      value: bt?.total_trades ?? 0,
      decimals: 0,
      pass: true,
    },
    {
      label: "Initial Capital",
      value: (bt?.initial_capital ?? 0) / 1000,
      prefix: "$",
      suffix: "K",
      decimals: 0,
      pass: true,
    },
  ];

  return (
    <section className="py-24" style={{ background: "rgba(17,24,39,0.3)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 text-xs border border-vault-border text-gray-400 rounded-full">
            Walk-Forward Validation · Out-of-Sample
          </div>
          <h2 className="text-3xl font-bold mb-3">Backtest Performance</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            6-month walk-forward results on $100K initial capital. No
            cherry-picking, no in-sample overfitting.
          </p>
        </FadeIn>

        {/* Metrics grid */}
        {isLoading ? (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl animate-shimmer"
              />
            ))}
          </div>
        ) : (
          <StaggerGrid className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {METRICS.map(({ label, value, suffix, prefix, decimals, pass }) => (
              <StaggerItem key={label}>
                <div className="glass-card p-4 text-center !rounded-xl border-glow">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p
                    className={`text-xl font-bold tabular-nums ${
                      label === "Period"
                        ? "text-white"
                        : pass === undefined
                          ? "text-white"
                          : pass
                            ? "text-vault-accent"
                            : "text-red-400"
                    }`}
                  >
                    {label === "Period" ? (
                      "Sep 25 — Mar 26"
                    ) : (
                      <CountUp
                        value={value}
                        prefix={prefix ?? ""}
                        suffix={suffix ?? ""}
                        decimals={decimals ?? 2}
                      />
                    )}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}

        {/* Equity curve */}
        <FadeIn delay={0.3}>
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold mb-4">Equity Curve</h3>
            {isLoading ? (
              <div className="h-72 w-full rounded animate-shimmer" />
            ) : bt?.equity_curve_raw && bt.equity_curve_raw.length > 0 ? (
              <ResponsiveContainer width="100%" height={288}>
                <AreaChart data={bt.equity_curve_raw}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#06D6A0"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#06D6A0"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="candle"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(v: number) => `#${v}`}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(v: number) =>
                      `$${(v / 1000).toFixed(0)}K`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a2332",
                      border: "1px solid #1F2937",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "Equity"]}
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
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-500">
                <p>
                  Run{" "}
                  <code className="bg-vault-bg px-2 py-0.5 rounded">
                    make backtest
                  </code>{" "}
                  to generate equity curve data
                </p>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
