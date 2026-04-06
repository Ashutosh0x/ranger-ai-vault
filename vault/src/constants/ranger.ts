// ═══════════════════════════════════════════════════════
// Ranger / Voltr Vault Constants
// ═══════════════════════════════════════════════════════

import { PublicKey } from "@solana/web3.js";

// Voltr Vault SDK Program ID
export const VOLTR_PROGRAM_ID = new PublicKey(
  "vo1tWgqZMjG4K2RMfSGjBpNiBnfLSjuVRzFJdGTHZqz"
);

// Ed25519 Signature Verification Program
export const ED25519_PROGRAM_ID = new PublicKey(
  "Ed25519SigVerify111111111111111111111111111"
);

// Compute Budget Program
export const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey(
  "ComputeBudget111111111111111111111111111111"
);

// Ranger Vault Configuration
export const RANGER_VAULT_CONFIG = {
  // Vault name and metadata
  name: "Ranger AI Vault",
  symbol: "aiVLT",
  uri: "",

  // Fee configuration (basis points: 100 = 1%)
  performanceFeeBps: 1000,  // 10%
  managementFeeBps: 100,    // 1%

  // Deposit/withdrawal configuration
  maxCap: BigInt(1_000_000 * 1e6),     // $1M USDC
  withdrawalPeriod: 86400,              // 24 hours in seconds

  // Allocation targets (percentage)
  kaminoAllocationPct: 50,
  zetaAllocationPct: 50,
} as const;

// Default compute budget for transactions
export const DEFAULT_COMPUTE_BUDGET = {
  units: 400_000,
  microLamports: 50_000,
} as const;
