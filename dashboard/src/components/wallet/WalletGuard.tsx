"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion } from "motion/react";
import { Shield, ArrowRight, Wallet } from "lucide-react";
import { heroText, staggerContainer, glowPulse } from "@/lib/animations";

interface Props {
  children: React.ReactNode;
  message?: string;
}

export function WalletGuard({
  children,
  message = "Connect your wallet to access the vault dashboard",
}: Props) {
  const { connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected) return <>{children}</>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-md text-center"
      >
        <motion.div variants={heroText} className="mb-6">
          <div
            className="inline-flex h-20 w-20 items-center justify-center
                        rounded-2xl bg-vault-accent/10 mx-auto"
          >
            <Shield className="h-10 w-10 text-vault-accent" />
          </div>
        </motion.div>

        <motion.h2
          variants={heroText}
          className="text-2xl font-bold text-white mb-3"
        >
          Wallet Required
        </motion.h2>

        <motion.p
          variants={heroText}
          className="text-sm text-gray-400 mb-8"
        >
          {message}
        </motion.p>

        <motion.div variants={heroText} className="mb-8">
          <p className="text-xs text-gray-500 mb-3">
            Supports 30+ wallets including
          </p>
          <div className="flex items-center justify-center gap-4">
            {["Phantom", "Solflare", "Backpack", "Ledger"].map((name) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <div
                  className="h-10 w-10 rounded-xl bg-vault-border/50
                              flex items-center justify-center"
                >
                  <Wallet className="h-5 w-5 text-gray-400" />
                </div>
                <span className="text-[10px] text-gray-500">{name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={heroText}>
          <motion.button
            onClick={() => setVisible(true)}
            disabled={connecting}
            variants={glowPulse}
            initial="rest"
            animate="pulse"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-8 py-3.5
                       rounded-xl bg-vault-accent text-vault-bg
                       font-semibold shadow-lg shadow-vault-accent/20
                       disabled:opacity-50"
          >
            {connecting ? "Connecting..." : "Connect Wallet"}
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </motion.div>

        <motion.p
          variants={heroText}
          className="mt-6 text-[11px] text-gray-600"
        >
          🔒 We never ask for your private keys or seed phrase.
          <br />
          Connection is read-only until you approve a transaction.
        </motion.p>
      </motion.div>
    </div>
  );
}
