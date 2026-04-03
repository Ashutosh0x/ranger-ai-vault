"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { FadeIn } from "@/components/motion/FadeIn";
import { CountUp } from "@/components/motion/CountUp";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { Wallet, DollarSign, Coins } from "lucide-react";

export function WalletInfo() {
  const { publicKey, wallet } = useWallet();
  const { sol, usdc } = useWalletBalance();

  if (!publicKey) return null;

  return (
    <FadeIn>
      <div className="glass-card p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          {wallet?.adapter.icon ? (
            <img
              src={wallet.adapter.icon}
              alt=""
              className="h-8 w-8 rounded-lg"
            />
          ) : (
            <Wallet className="h-8 w-8 text-gray-400" />
          )}
          <div>
            <p className="text-sm font-semibold text-white">
              {wallet?.adapter.name}
            </p>
            <p className="text-xs font-mono text-gray-500">
              {publicKey.toBase58().slice(0, 8)}...
              {publicKey.toBase58().slice(-8)}
            </p>
          </div>
          <span
            className="ml-auto flex items-center gap-1.5 text-xs
                       font-medium text-green-500"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-green-500
                         animate-pulse"
            />
            Connected
          </span>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-vault-bg/50 p-3">
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
              <Coins className="h-3 w-3" />
              SOL
            </div>
            <CountUp
              value={sol}
              decimals={4}
              className="text-sm font-semibold text-white"
            />
          </div>
          <div className="rounded-lg bg-vault-bg/50 p-3">
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
              <DollarSign className="h-3 w-3" />
              USDC
            </div>
            <CountUp
              value={usdc}
              prefix="$"
              decimals={2}
              className="text-sm font-semibold text-white"
            />
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
