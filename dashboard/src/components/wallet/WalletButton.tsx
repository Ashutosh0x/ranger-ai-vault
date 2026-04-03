"use client";

import { useCallback, useMemo, useState } from "react";
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
} from "lucide-react";
import { scaleIn, SPRINGS } from "@/lib/animations";
import { cn } from "@/lib/utils";

export function WalletButton() {
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

  const shortAddress = useMemo(() => {
    if (!publicKey) return "";
    const addr = publicKey.toBase58();
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }, [publicKey]);

  const handleConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  const handleCopy = useCallback(async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [publicKey]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setShowDropdown(false);
  }, [disconnect]);

  const handleExplorer = useCallback(() => {
    if (!publicKey) return;
    window.open(
      `https://solscan.io/account/${publicKey.toBase58()}`,
      "_blank"
    );
  }, [publicKey]);

  // ── Not Connected ──
  if (!connected) {
    return (
      <motion.button
        onClick={handleConnect}
        disabled={connecting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
          "bg-vault-accent text-vault-bg font-semibold text-sm",
          "shadow-lg shadow-vault-accent/20 transition-colors",
          "hover:bg-vault-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {connecting ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-4 w-4 border-2 border-vault-bg/30
                         border-t-vault-bg rounded-full"
            />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </>
        )}
      </motion.button>
    );
  }

  // ── Connected ──
  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-4 py-2.5",
          "glass-card text-sm font-medium",
          "hover:border-vault-accent/30 transition-colors"
        )}
      >
        {wallet?.adapter.icon && (
          <img
            src={wallet.adapter.icon}
            alt={wallet.adapter.name}
            className="h-5 w-5 rounded-full"
          />
        )}
        <span className="text-white font-mono text-xs">{shortAddress}</span>
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full
                       rounded-full bg-green-400 opacity-75"
          />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-gray-400 transition-transform",
            showDropdown && "rotate-180"
          )}
        />
      </motion.button>

      {/* Dropdown Menu */}
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
              className="absolute right-0 top-full mt-2 z-50 w-56
                         rounded-xl border border-vault-border bg-vault-card
                         shadow-xl shadow-black/30 p-1.5"
            >
              {/* Wallet Info */}
              <div className="px-3 py-2 border-b border-vault-border mb-1">
                <div className="flex items-center gap-2">
                  {wallet?.adapter.icon && (
                    <img
                      src={wallet.adapter.icon}
                      alt=""
                      className="h-4 w-4 rounded-full"
                    />
                  )}
                  <span className="text-xs text-gray-400">
                    {wallet?.adapter.name}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-gray-500 mt-1 truncate">
                  {publicKey?.toBase58()}
                </p>
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
                onClick={handleExplorer}
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
  );
}
