"use client";

import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_ENDPOINT } from "@/lib/wallet-config";

let _connection: Connection | null = null;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(RPC_ENDPOINT, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60000,
    });
  }
  return _connection;
}

// ── Vault Constants ───────────────────────────
export const VAULT_ADDRESS = new PublicKey(
  process.env.NEXT_PUBLIC_VAULT_ADDRESS ||
    "11111111111111111111111111111111" // placeholder — replace after deploy
);

export const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // USDC mainnet
);

export const USDC_DECIMALS = 6;

export function toUsdcAmount(uiAmount: number): bigint {
  return BigInt(Math.floor(uiAmount * 10 ** USDC_DECIMALS));
}

export function fromUsdcAmount(rawAmount: bigint | number): number {
  return Number(rawAmount) / 10 ** USDC_DECIMALS;
}
