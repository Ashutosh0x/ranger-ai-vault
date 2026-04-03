"use client";

import {
  CircleUserRound,
  Wallet,
  Shield,
  History,
  ExternalLink,
  Copy,
} from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <CircleUserRound className="w-8 h-8 text-vault-accent" />
          Profile
        </h1>
        <p className="text-gray-400 mt-1">Your vault membership and wallet details</p>
      </div>

      {/* Wallet Card */}
      <div className="glass-card p-6 border border-vault-accent/20">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-vault-accent/20 to-purple-500/20 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-vault-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-400">Connected Wallet</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-lg font-mono font-bold text-gray-300">
                Not connected
              </p>
            </div>
          </div>
          <button className="px-5 py-2.5 bg-vault-accent text-vault-bg font-semibold rounded-xl hover:bg-vault-accent/90 transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-vault-accent" />
            <p className="text-xs text-gray-400 uppercase">Vault Role</p>
          </div>
          <p className="text-xl font-bold">Depositor</p>
          <p className="text-xs text-gray-500 mt-1">Standard access tier</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-xs text-gray-400 uppercase mb-3">Your Shares</p>
          <p className="text-xl font-bold">0.000000</p>
          <p className="text-xs text-gray-500 mt-1">LP Tokens</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-xs text-gray-400 uppercase mb-3">Share Value</p>
          <p className="text-xl font-bold text-vault-accent">$0.00</p>
          <p className="text-xs text-gray-500 mt-1">USDC equivalent</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold">Transaction History</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-vault-border">
              <th className="text-left py-3 px-4">Type</th>
              <th className="text-right py-3 px-4">Amount</th>
              <th className="text-right py-3 px-4">Shares</th>
              <th className="text-right py-3 px-4">TX</th>
              <th className="text-right py-3 px-4">Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-6 px-4 text-center text-gray-500" colSpan={5}>
                No transactions yet — deposit USDC to begin
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
