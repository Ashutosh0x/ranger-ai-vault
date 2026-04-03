"use client";

import { useMemo, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet,
  LogOut,
  Copy,
  Check,
  ChevronDown,
  ExternalLink,
  CircleUserRound,
} from "lucide-react";
import { SPRINGS } from "@/lib/animations";
import { cn } from "@/lib/utils";

export function TopBar() {
  const {
    publicKey,
    wallet,
    connected,
    connecting,
    disconnecting,
    disconnect,
  } = useWallet();
  const { setVisible } = useWalletModal();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullAddress = useMemo(
    () => (publicKey ? publicKey.toBase58() : ""),
    [publicKey]
  );

  const shortAddress = useMemo(() => {
    if (!fullAddress) return "";
    return `${fullAddress.slice(0, 4)}...${fullAddress.slice(-4)}`;
  }, [fullAddress]);

  const walletName = wallet?.adapter.name || "Wallet";

  const handleCopy = useCallback(async () => {
    if (!fullAddress) return;
    await navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullAddress]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setShowDropdown(false);
  }, [disconnect]);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-end
                 h-16 px-8 border-b border-vault-border/40
                 bg-vault-bg/80 backdrop-blur-xl"
    >
      {connected && publicKey ? (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-2",
              "border border-vault-border bg-vault-card/60",
              "hover:border-vault-accent/30 transition-colors"
            )}
          >
            {/* Avatar */}
            {wallet?.adapter.icon ? (
              <img
                src={wallet.adapter.icon}
                alt={walletName}
                className="h-8 w-8 rounded-full bg-vault-accent/10 p-0.5"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-vault-accent/10 flex items-center justify-center">
                <CircleUserRound className="h-5 w-5 text-vault-accent" />
              </div>
            )}

            {/* Name + Address */}
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-white leading-tight">
                {walletName}
              </p>
              <p className="text-[11px] font-mono text-gray-500 leading-tight">
                {shortAddress}
              </p>
            </div>

            {/* Status dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>

            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-gray-400 transition-transform",
                showDropdown && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDropdown(false)}
                  className="fixed inset-0 z-40"
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={SPRINGS.snappy}
                  className="absolute right-0 top-full mt-2 z-50 w-64
                             rounded-xl border border-vault-border bg-vault-card
                             shadow-xl shadow-black/30 p-1.5"
                >
                  {/* Profile Header */}
                  <div className="px-3 py-3 border-b border-vault-border mb-1">
                    <div className="flex items-center gap-3">
                      {wallet?.adapter.icon ? (
                        <img
                          src={wallet.adapter.icon}
                          alt=""
                          className="h-10 w-10 rounded-full bg-vault-accent/10 p-0.5"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-vault-accent/10 flex items-center justify-center">
                          <CircleUserRound className="h-6 w-6 text-vault-accent" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {walletName}
                        </p>
                        <p className="text-[10px] font-mono text-gray-500 truncate">
                          {fullAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2
                               text-sm text-white hover:bg-white/5 transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                    {copied ? "Copied!" : "Copy Address"}
                  </button>

                  <button
                    onClick={() => {
                      if (publicKey)
                        window.open(
                          `https://solscan.io/account/${fullAddress}`,
                          "_blank"
                        );
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2
                               text-sm text-white hover:bg-white/5 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                    View on Solscan
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setVisible(true);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2
                               text-sm text-white hover:bg-white/5 transition-colors"
                  >
                    <Wallet className="h-4 w-4 text-gray-400" />
                    Change Wallet
                  </button>

                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2
                               text-sm text-vault-danger hover:bg-vault-danger/10
                               transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.button
          onClick={() => setVisible(true)}
          disabled={connecting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
            "bg-vault-accent text-vault-bg font-semibold text-sm",
            "shadow-lg shadow-vault-accent/20",
            "hover:bg-vault-accent/90 disabled:opacity-50"
          )}
        >
          <Wallet className="h-4 w-4" />
          {connecting ? "Connecting..." : "Connect Wallet"}
        </motion.button>
      )}
    </header>
  );
}
