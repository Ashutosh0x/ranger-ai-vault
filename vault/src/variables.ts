// ═══════════════════════════════════════════════════════
// Runtime Variables — Fill after deployment
// ═══════════════════════════════════════════════════════

import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

// ═══ KEYPAIR PATHS ═══
export const ADMIN_KEYPAIR_PATH =
  process.env.ADMIN_KEYPAIR_PATH || "../vault/keys/admin.json";
export const MANAGER_KEYPAIR_PATH =
  process.env.MANAGER_KEYPAIR_PATH || "../vault/keys/manager.json";
export const USER_KEYPAIR_PATH =
  process.env.USER_KEYPAIR_PATH || "../vault/keys/user.json";

// ═══ RPC ═══
export const RPC_URL =
  process.env.HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";

// ═══ CLUSTER ═══
export const CLUSTER = process.env.SOLANA_CLUSTER || "mainnet-beta";

// ═══ VAULT (fill after admin-init-vault.ts) ═══
export const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "";
export const KAMINO_STRATEGY_ADDRESS =
  process.env.KAMINO_STRATEGY_ADDRESS || "";
export const DRIFT_LEND_STRATEGY_ADDRESS =
  process.env.DRIFT_LEND_STRATEGY_ADDRESS || "";
export const DRIFT_PERPS_STRATEGY_ADDRESS =
  process.env.DRIFT_PERPS_STRATEGY_ADDRESS || "";

// ═══ TOKEN MINTS ═══
export const ASSET_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC

// ═══ AMOUNTS (in raw token units — 6 decimals for USDC) ═══
export const DEPOSIT_AMOUNT = 1_000_000_000;        // 1000 USDC
export const KAMINO_ALLOCATION = 500_000_000;        // 500 USDC (50%)
export const DRIFT_LEND_ALLOCATION = 250_000_000;    // 250 USDC (25%)
export const DRIFT_PERPS_ALLOCATION = 250_000_000;   // 250 USDC (25%)

// ═══ FEE CONFIG ═══
export const PERFORMANCE_FEE_BPS = 1000;  // 10%
export const MANAGEMENT_FEE_BPS = 200;    // 2%
