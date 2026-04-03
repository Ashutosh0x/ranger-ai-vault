"use client";

import { useRisk } from "@/hooks/useRisk";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export default function RiskPage() {
  const { data: risk } = useRisk();

  const dailyDD = risk ? risk.daily_drawdown_pct * 100 : 0;
  const monthlyDD = risk ? risk.monthly_drawdown_pct * 100 : 0;
  const netDelta = risk ? Math.abs(risk.net_delta) * 100 : 0;
  const var95 = risk ? Math.abs(risk.var_95_1d) * 100 : 0;
  const isBreach = risk?.breach ?? false;

  const getColor = (value: number, limit: number): "green" | "yellow" | "red" => {
    const ratio = value / limit;
    if (ratio >= 1) return "red";
    if (ratio >= 0.7) return "yellow";
    return "green";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Risk Monitor</h1>
        <p className="text-gray-400 mt-1">Real-time risk metrics and guardrails</p>
      </div>

      {/* Risk Status Banner */}
      <div
        className={`glass-card p-4 border-l-4 ${
          isBreach ? "border-red-500" : "border-vault-accent"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isBreach ? "bg-red-500 animate-pulse" : "bg-vault-accent animate-pulse"
            }`}
          />
          <span className="font-medium flex items-center gap-2">
            {isBreach ? (
              <><AlertTriangle className="w-4 h-4 text-red-400" /> BREACH — Positions being unwound</>
            ) : (
              <><ShieldCheck className="w-4 h-4 text-vault-accent" /> Normal</>
            )}
          </span>
          <span className="text-sm text-gray-400 ml-auto">
            {isBreach ? "Trading halted" : "All guardrails within limits"}
          </span>
        </div>
      </div>

      {/* Risk Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <RiskGauge
          label="Daily Drawdown"
          value={dailyDD}
          limit={3}
          unit="%"
          color={getColor(dailyDD, 3)}
        />
        <RiskGauge
          label="Monthly Drawdown"
          value={monthlyDD}
          limit={8}
          unit="%"
          color={getColor(monthlyDD, 8)}
        />
        <RiskGauge
          label="Net Delta"
          value={netDelta}
          limit={10}
          unit="%"
          color={getColor(netDelta, 10)}
        />
        <RiskGauge
          label="VaR (95%, 1D)"
          value={var95}
          limit={2}
          unit="%"
          color={getColor(var95, 2)}
        />
      </div>

      {/* Reduction Factor */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Position Sizing Adjustment</h2>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Drawdown Reduction Factor:</span>
          <span className="text-2xl font-bold text-vault-accent">
            {risk ? `${(risk.drawdown_reduction_factor * 100).toFixed(0)}%` : "100%"}
          </span>
          <span className="text-gray-500 text-sm">
            {risk?.drawdown_reduction_factor === 1
              ? "Full allocation"
              : risk?.drawdown_reduction_factor === 0
                ? "Trading halted"
                : "Reduced allocation"}
          </span>
        </div>
      </div>

      {/* Risk Params */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Risk Parameters</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { label: "Max Daily DD", value: "3%" },
            { label: "Max Monthly DD", value: "8%" },
            { label: "Max Leverage", value: "2x" },
            { label: "Max Net Delta", value: "0.10" },
            { label: "Stop Loss", value: "-0.5%" },
            { label: "Take Profit", value: "1.5%" },
            { label: "Max Positions", value: "3" },
            { label: "Kelly Fraction", value: "0.25" },
            { label: "Min Health Rate", value: "1.5" },
            { label: "VaR Threshold", value: "-2%" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-lg font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Position Limits */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Position Risk</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-vault-border">
                <th className="text-left py-3 px-4">Asset</th>
                <th className="text-right py-3 px-4">Side</th>
                <th className="text-right py-3 px-4">Size</th>
                <th className="text-right py-3 px-4">P&L</th>
                <th className="text-right py-3 px-4">Delta</th>
                <th className="text-right py-3 px-4">Health</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-6 px-4 text-center text-gray-500" colSpan={6}>
                  No open positions
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RiskGauge({
  label,
  value,
  limit,
  unit,
  color,
}: {
  label: string;
  value: number;
  limit: number;
  unit: string;
  color: "green" | "yellow" | "red";
}) {
  const pct = Math.min((value / limit) * 100, 100);
  const colors = {
    green: "bg-vault-accent",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  return (
    <div className="glass-card p-6">
      <p className="text-xs text-gray-400 uppercase">{label}</p>
      <div className="flex items-end gap-1 mt-2">
        <span className="text-2xl font-bold">{value.toFixed(2)}</span>
        <span className="text-gray-400 text-sm mb-1">
          / {limit}
          {unit}
        </span>
      </div>
      <div className="h-2 bg-vault-border rounded-full mt-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
