"use client";

import { useState } from "react";

export default function VaultPage() {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawShares, setWithdrawShares] = useState("");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Vault</h1>
        <p className="text-gray-400 mt-1">Deposit & Withdraw USDC</p>
      </div>

      {/* Vault Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric-card glow-accent">
          <p className="text-xs text-gray-400 uppercase">Total Vault TVL</p>
          <p className="text-3xl font-bold text-vault-accent mt-2">$0.00</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-gray-400 uppercase">Your Balance</p>
          <p className="text-3xl font-bold mt-2">0.000000</p>
          <p className="text-xs text-gray-500 mt-1">LP Tokens</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-gray-400 uppercase">Your Share Value</p>
          <p className="text-3xl font-bold mt-2">$0.00</p>
          <p className="text-xs text-gray-500 mt-1">USDC</p>
        </div>
      </div>

      {/* Deposit / Withdraw */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Form */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Deposit USDC</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Amount (USDC)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="1000.00"
                className="w-full mt-2 px-4 py-3 bg-vault-bg border border-vault-border rounded-xl text-white focus:border-vault-accent focus:outline-none transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {[100, 500, 1000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(String(amt))}
                  className="px-3 py-1 text-xs bg-vault-border rounded-lg hover:bg-vault-accent/20 transition-colors"
                >
                  ${amt}
                </button>
              ))}
            </div>
            <button className="w-full py-3 bg-vault-accent text-vault-bg font-semibold rounded-xl hover:bg-vault-accent/90 transition-colors">
              Deposit USDC
            </button>
          </div>
        </div>

        {/* Withdraw Form */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Withdraw</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">LP Tokens to Burn</label>
              <input
                type="number"
                value={withdrawShares}
                onChange={(e) => setWithdrawShares(e.target.value)}
                placeholder="0.000000"
                className="w-full mt-2 px-4 py-3 bg-vault-bg border border-vault-border rounded-xl text-white focus:border-vault-accent focus:outline-none transition-colors"
              />
            </div>
            <div className="text-sm text-gray-400">
              Estimated USDC: <span className="text-white">$0.00</span>
            </div>
            <button className="w-full py-3 bg-vault-danger text-white font-semibold rounded-xl hover:bg-vault-danger/90 transition-colors">
              Withdraw USDC
            </button>
          </div>
        </div>
      </div>

      {/* Fee Structure */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Fee Structure</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400">Performance Fee</p>
            <p className="text-lg font-bold">10%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Management Fee</p>
            <p className="text-lg font-bold">2%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Withdrawal Wait</p>
            <p className="text-lg font-bold">None</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Max Cap</p>
            <p className="text-lg font-bold">$10M</p>
          </div>
        </div>
      </div>
    </div>
  );
}
