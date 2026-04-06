"use client";

import { useSignals } from "@/hooks/useSignals";
import { useRisk } from "@/hooks/useRisk";
import { useHealth } from "@/hooks/useHealth";
import { useMetrics } from "@/hooks/useMetrics";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  AlertTriangle,
  DollarSign,
  TrendingUp,
  BarChart3,
  Shield,
  Wifi,
  WifiOff,
} from "lucide-react";
import { PageTransition } from "@/components/motion/PageTransition";
import { FadeIn } from "@/components/motion/FadeIn";

export default function DashboardPage() {
  const { data: signals, isLoading: sigLoading, error: sigError } = useSignals();
  const { data: risk, error: riskError } = useRisk();
  const { data: health, error: healthError } = useHealth();
  const { data: metrics, isLoading: metLoading } = useMetrics();

  const isOnline = health?.status === "ok";
  const modelsLoaded = health?.models_loaded ?? false;

  // Real metrics from signal engine
  const nav = metrics?.nav_usdc ?? 0;
  const apy = metrics?.realized_apy ?? 0;
  const sharpe = metrics?.sharpe_ratio ?? 0;
  const maxDd = metrics?.max_drawdown_pct ?? 0;
  const totalTrades = metrics?.total_trades ?? 0;
  const equityCurve = metrics?.equity_curve ?? [];

  return (
    <PageTransition>
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">Ranger AI Vault — Live Performance</p>
      </div>
      </FadeIn>

      {/* Connection Status */}
      {(sigError || healthError) && (
        <div className="glass-card p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Signal engine not reachable — start with: <code className="bg-vault-bg px-2 py-0.5 rounded">make signal</code>
          </p>
        </div>
      )}

      {/* Metric Cards */}
      <FadeIn delay={0.1}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Value Locked"
          value={nav > 0 ? `$${nav.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—"}
          subtitle="USDC"
          loading={metLoading}
          accent
          live={nav > 0}
        />
        <MetricCard
          title="Realized APY"
          value={apy !== 0 ? `${(apy * 100).toFixed(2)}%` : "—"}
          subtitle={apy > 0.10 ? "Above 10% target" : "Accumulating data"}
          loading={metLoading}
          color={apy > 0.10 ? "green" : undefined}
        />
        <MetricCard
          title="Sharpe Ratio"
          value={sharpe !== 0 ? sharpe.toFixed(2) : "—"}
          subtitle={totalTrades > 0 ? `${totalTrades} trades` : "No trades yet"}
          loading={metLoading}
        />
        <MetricCard
          title="Max Drawdown"
          value={maxDd > 0 ? `${maxDd.toFixed(2)}%` : "—"}
          subtitle="Limit: 8.00%"
          loading={metLoading}
          color={maxDd > 0 && maxDd < 8 ? "green" : maxDd >= 8 ? "red" : undefined}
        />
      </div>
      </FadeIn>

      {/* Strategy Allocation + Engine Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Strategy Allocation</h2>
          <div className="space-y-4">
            <AllocationBar label="Kamino Lending (Floor)" pct={50} color="#06D6A0" />
            <AllocationBar label="Zeta Lend" pct={25} color="#0CA5EA" />
            <AllocationBar label="Zeta Perps (Active)" pct={25} color="#FFD166" />
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Engine Status</h2>
          <div className="space-y-3">
            <StatusRow label="Signal Server" status={isOnline ? "online" : "offline"} icon={isOnline ? Wifi : WifiOff} />
            <StatusRow label="Keeper Bot" status={isOnline ? "online" : "offline"} icon={isOnline ? Wifi : WifiOff} />
            <StatusRow label="ML Models" status={modelsLoaded ? "online" : "not_loaded"} />
            <StatusRow
              label="Coinglass API"
              status={health?.coinglass_key_set ? "online" : "not_loaded"}
            />
            <StatusRow
              label="Risk Monitor"
              status={risk?.breach ? "breach" : isOnline ? "online" : "offline"}
            />
          </div>
        </div>
      </div>

      {/* Equity Curve — Real data from metrics */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">NAV Equity Curve</h2>
          {equityCurve.length > 0 && (
            <span className="text-xs text-gray-400">
              {equityCurve.length} data points
            </span>
          )}
        </div>
        {equityCurve.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={equityCurve}>
              <defs>
                <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06D6A0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06D6A0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(v: string) => new Date(v).toLocaleDateString()}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #2d2d44",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, "NAV"]}
                labelFormatter={(l: string) => new Date(l).toLocaleString()}
              />
              <Area
                type="monotone"
                dataKey="nav"
                stroke="#06D6A0"
                fill="url(#navGradient)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg">No equity data yet</p>
              <p className="text-sm mt-1">
                Start the keeper bot to begin tracking NAV:{" "}
                <code className="bg-vault-bg px-2 py-0.5 rounded">make keeper</code>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Live Signals */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Live Signals</h2>
        {sigLoading ? (
          <div className="text-center py-8 text-gray-500">Loading signals...</div>
        ) : sigError ? (
          <div className="text-center py-8 text-gray-500">
            <p>Signal engine offline</p>
            <p className="text-sm mt-1">
              Run: <code className="bg-vault-bg px-2 py-0.5 rounded">make signal</code>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-vault-border">
                  <th className="text-left py-3 px-4">Asset</th>
                  <th className="text-right py-3 px-4">Signal</th>
                  <th className="text-right py-3 px-4">Confidence</th>
                  <th className="text-right py-3 px-4">Regime</th>
                  <th className="text-right py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {["SOL-PERP", "BTC-PERP", "ETH-PERP"].map((asset) => {
                  const s = signals?.[asset];
                  const signal = s?.signal ?? 0;
                  const confidence = s?.confidence ?? 0;
                  const regime = s?.regime ?? "—";
                  const action =
                    signal > 0.6
                      ? "LONG"
                      : signal < -0.6
                        ? "SHORT"
                        : "NEUTRAL";
                  const actionColor =
                    action === "LONG"
                      ? "text-green-400"
                      : action === "SHORT"
                        ? "text-red-400"
                        : "text-gray-500";

                  return (
                    <tr
                      key={asset}
                      className="border-b border-vault-border/30 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{asset}</td>
                      <td className="py-3 px-4 text-right">
                        <SignalBar value={signal} />
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300">
                        {s ? `${(confidence * 100).toFixed(0)}%` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            regime === "trending"
                              ? "bg-blue-500/20 text-blue-400"
                              : regime === "ranging"
                                ? "bg-purple-500/20 text-purple-400"
                                : regime === "volatile"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {regime}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${actionColor}`}>
                        {s ? action : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}

function SignalBar({ value }: { value: number }) {
  const pct = ((value + 1) / 2) * 100; // -1..1 → 0..100
  const color = value > 0.3 ? "#06D6A0" : value < -0.3 ? "#EF4444" : "#6b7280";
  return (
    <div className="flex items-center gap-2 justify-end">
      <span className="text-xs text-gray-400 w-12 text-right">{value.toFixed(3)}</span>
      <div className="w-20 h-2 bg-vault-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  accent,
  loading,
  color,
  live,
}: {
  title: string;
  value: string;
  subtitle: string;
  accent?: boolean;
  loading?: boolean;
  color?: "green" | "red";
  live?: boolean;
}) {
  return (
    <div className={`metric-card ${accent ? "glow-accent" : ""}`}>
      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{title}</p>
        {live && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
      </div>
      <p className={`text-2xl font-bold mt-2 ${
        color === "green" ? "text-green-400" :
        color === "red" ? "text-red-400" :
        accent ? "text-vault-accent" : ""
      }`}>
        {loading ? (
          <span className="inline-block w-16 h-6 bg-vault-border rounded animate-pulse" />
        ) : value}
      </p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function AllocationBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">{pct}%</span>
      </div>
      <div className="h-2 bg-vault-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function StatusRow({
  label,
  status,
  icon: Icon,
}: {
  label: string;
  status: "online" | "offline" | "not_loaded" | "breach";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const colors: Record<string, string> = {
    online: "bg-green-500",
    offline: "bg-red-500",
    not_loaded: "bg-yellow-500",
    breach: "bg-red-500 animate-pulse",
  };
  const labels: Record<string, string> = {
    online: "Online",
    offline: "Offline",
    not_loaded: "Not Loaded",
    breach: "BREACH",
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        <span className="text-gray-300 text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
        <span className="text-xs text-gray-400">{labels[status]}</span>
      </div>
    </div>
  );
}
