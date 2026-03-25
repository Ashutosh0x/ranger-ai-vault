// ═══════════════════════════════════════════════════════
// Token Constants
// ═══════════════════════════════════════════════════════

import { PublicKey } from "@solana/web3.js";

// USDC — vault base asset
export const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);
export const USDC_DECIMALS = 6;

// SOL (Wrapped)
export const WSOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);
export const SOL_DECIMALS = 9;

// BTC (Wrapped, Solana)
export const WBTC_MINT = new PublicKey(
  "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh"
);
export const BTC_DECIMALS = 8;

// ETH (Wormhole Wrapped)
export const WETH_MINT = new PublicKey(
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"
);
export const ETH_DECIMALS = 8;

// Helper: convert human-readable amount to on-chain (lamports/atoms)
export function toTokenAmount(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
}

// Helper: convert on-chain amount to human-readable
export function fromTokenAmount(amount: bigint, decimals: number): number {
  return Number(amount) / Math.pow(10, decimals);
}
