"use client";

import { Trophy, TrendingUp, Shield, BarChart3 } from "lucide-react";

const MOCK_VAULTS = [
  { rank: 1, name: "Ranger AI Vault", apy: "—", sharpe: "—", tvl: "—", status: "Live" },
  { rank: 2, name: "Elemental rgUSD", apy: "11.25%", sharpe: "1.8", tvl: "$22M", status: "Live" },
  { rank: 3, name: "Zeta Yield", apy: "8.4%", sharpe: "1.2", tvl: "$5.1M", status: "Live" },
  { rank: 4, name: "Kamino Multiply", apy: "6.9%", sharpe: "0.9", tvl: "$18M", status: "Live" },
  { rank: 5, name: "JLP Vault", apy: "12.1%", sharpe: "0.7", tvl: "$340M", status: "Live" },
];

export default function LeaderboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          Leaderboard
        </h1>
        <p className="text-gray-400 mt-1">Ranger Earn vault performance rankings</p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_VAULTS.slice(0, 3).map((v, i) => (
          <div
            key={v.name}
            className={`glass-card p-6 ${
              i === 0 ? "border border-yellow-500/30 glow-accent" : ""
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i === 0
                    ? "bg-yellow-500/20 text-yellow-400"
                    : i === 1
                      ? "bg-gray-400/20 text-gray-300"
                      : "bg-orange-500/20 text-orange-400"
                }`}
              >
                #{v.rank}
              </div>
              <div>
                <p className="font-semibold text-sm">{v.name}</p>
                <span className="text-xs text-vault-accent bg-vault-accent/10 px-2 py-0.5 rounded-full">
                  {v.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <TrendingUp className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
                <p className="text-lg font-bold">{v.apy}</p>
                <p className="text-[10px] text-gray-500">30d APY</p>
              </div>
              <div>
                <BarChart3 className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
                <p className="text-lg font-bold">{v.sharpe}</p>
                <p className="text-[10px] text-gray-500">Sharpe</p>
              </div>
              <div>
                <Shield className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
                <p className="text-lg font-bold">{v.tvl}</p>
                <p className="text-[10px] text-gray-500">TVL</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Table */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">All Vaults</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-vault-border">
                <th className="text-left py-3 px-4">Rank</th>
                <th className="text-left py-3 px-4">Vault</th>
                <th className="text-right py-3 px-4">30d APY</th>
                <th className="text-right py-3 px-4">Sharpe</th>
                <th className="text-right py-3 px-4">TVL</th>
                <th className="text-right py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_VAULTS.map((v) => (
                <tr key={v.name} className="border-b border-vault-border/30 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-gray-400">#{v.rank}</td>
                  <td className="py-3 px-4 font-medium">{v.name}</td>
                  <td className="py-3 px-4 text-right text-vault-accent">{v.apy}</td>
                  <td className="py-3 px-4 text-right">{v.sharpe}</td>
                  <td className="py-3 px-4 text-right">{v.tvl}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-xs bg-vault-accent/20 text-vault-accent px-2 py-0.5 rounded-full">
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
