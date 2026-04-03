"use client";

import { usePositions } from "@/hooks/usePositions";
import { useMetrics } from "@/hooks/useMetrics";
import { useRisk } from "@/hooks/useRisk";
import { CheckCircle } from "lucide-react";

export default function PositionsPage() {
  const { data: posData, isLoading, error } = usePositions();
  const { data: metrics } = useMetrics();
  const { data: risk } = useRisk();

  const positions = posData?.positions ?? {};
  const positionEntries = Object.entries(positions);
  const netDelta = posData?.net_delta ?? 0;
  const totalPnl = metrics?.total_pnl_usd ?? 0;
  const totalTrades = metrics?.total_trades ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Positions</h1>
        <p className="text-gray-400 mt-1">Active Drift perp positions managed by the AI keeper</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="metric-card">
          <p className="text-xs text-gray-400 uppercase">Open Positions</p>
          <p className="text-2xl font-bold mt-2">
            {isLoading ? (
              <span className="inline-block w-8 h-6 bg-vault-border rounded animate-pulse" />
            ) : positionEntries.length}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-gray-400 uppercase">Total P&L</p>
          <p className={`text-2xl font-bold mt-2 ${
            totalPnl > 0 ? "text-green-400" : totalPnl < 0 ? "text-red-400" : ""
          }`}>
            {totalPnl !== 0 ? `$${totalPnl.toFixed(2)}` : "—"}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-gray-400 uppercase">Total Trades</p>
          <p className="text-2xl font-bold mt-2">
            {totalTrades > 0 ? totalTrades : "—"}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-gray-400 uppercase">Net Delta</p>
          <p className={`text-2xl font-bold mt-2 ${
            Math.abs(netDelta) > 0.08 ? "text-yellow-400" : ""
          }`}>
            {netDelta !== 0 ? netDelta.toFixed(4) : "—"}
          </p>
        </div>
      </div>

      {/* Positions Table */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Open Positions</h2>
        {error ? (
          <div className="py-8 text-center text-gray-500">
            <p>Signal engine not reachable</p>
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
                  <th className="text-right py-3 px-4">Side</th>
                  <th className="text-right py-3 px-4">Size (USDC)</th>
                  <th className="text-right py-3 px-4">Entry Price</th>
                  <th className="text-right py-3 px-4">Unrealized P&L</th>
                  <th className="text-right py-3 px-4">Delta</th>
                  <th className="text-right py-3 px-4">Attested</th>
                </tr>
              </thead>
              <tbody>
                {positionEntries.length > 0 ? (
                  positionEntries.map(([asset, pos]) => (
                    <tr key={asset} className="border-b border-vault-border/30 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium">{asset}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        pos.direction === "long" ? "text-green-400" : "text-red-400"
                      }`}>
                        {pos.direction.toUpperCase()}
                      </td>
                      <td className="py-3 px-4 text-right">${pos.size_usd?.toFixed(2) ?? "—"}</td>
                      <td className="py-3 px-4 text-right">${pos.entry_price?.toFixed(2) ?? "—"}</td>
                      <td className={`py-3 px-4 text-right ${
                        (pos.unrealized_pnl ?? 0) > 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        ${pos.unrealized_pnl?.toFixed(2) ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-right">{pos.delta?.toFixed(4) ?? "—"}</td>
                      <td className="py-3 px-4 text-right">
                        <CheckCircle className="w-4 h-4 text-green-400 inline-block" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-8 px-4 text-center text-gray-500" colSpan={7}>
                      {isLoading ? "Loading positions..." : "No open positions — keeper is idle or signal below threshold"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
