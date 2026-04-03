"use client";

import { UserPlus, Copy, ExternalLink, Gift } from "lucide-react";

export default function ReferralsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-purple-400" />
          Referrals
        </h1>
        <p className="text-gray-400 mt-1">Invite depositors. Earn a share of vault fees.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 text-center">
          <Gift className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-3xl font-bold">0</p>
          <p className="text-xs text-gray-400 mt-1">Total Referrals</p>
        </div>
        <div className="glass-card p-6 text-center">
          <p className="text-3xl font-bold text-vault-accent">$0.00</p>
          <p className="text-xs text-gray-400 mt-1">Earned from Referrals</p>
        </div>
        <div className="glass-card p-6 text-center">
          <p className="text-3xl font-bold text-purple-400">5%</p>
          <p className="text-xs text-gray-400 mt-1">Fee Share Rate</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Your Referral Link</h2>
        <div className="flex gap-3">
          <div className="flex-1 bg-vault-bg border border-vault-border rounded-xl px-4 py-3 text-sm text-gray-400 font-mono truncate">
            Connect wallet to generate your referral link
          </div>
          <button
            disabled
            className="px-4 py-3 bg-vault-border rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">How It Works</h2>
        <div className="space-y-4">
          {[
            { step: "1", text: "Connect your wallet and copy your unique referral link" },
            { step: "2", text: "Share the link with potential vault depositors" },
            { step: "3", text: "Earn 5% of the performance fees on their deposits" },
            { step: "4", text: "Rewards are claimable monthly in USDC" },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold shrink-0">
                {item.step}
              </div>
              <p className="text-sm text-gray-300 pt-1">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral History */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Referral History</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-vault-border">
              <th className="text-left py-3 px-4">Referred Wallet</th>
              <th className="text-right py-3 px-4">Deposited</th>
              <th className="text-right py-3 px-4">Your Earnings</th>
              <th className="text-right py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-6 px-4 text-center text-gray-500" colSpan={4}>
                No referrals yet — share your link to get started
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
