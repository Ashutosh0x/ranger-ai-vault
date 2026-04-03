"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  LedgerWalletAdapter,
  Coin98WalletAdapter,
  TrustWalletAdapter,
  NightlyWalletAdapter,
} from "@solana/wallet-adapter-wallets";

// ── Network Config ────────────────────────────
export const NETWORK =
  (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) ||
  WalletAdapterNetwork.Devnet;

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  clusterApiUrl(NETWORK);

// ── Wallet Adapters ───────────────────────────
// Wallets supporting the Wallet Standard are auto-detected.
// Only explicitly list adapters for wallets that don't yet
// support that standard.
export function getWalletAdapters() {
  return [
    // Tier 1 — 95%+ of Solana DeFi users
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new CoinbaseWalletAdapter(),
    new LedgerWalletAdapter(),
    // Tier 2
    new TrustWalletAdapter(),
    new Coin98WalletAdapter(),
    new NightlyWalletAdapter(),
  ];
}
