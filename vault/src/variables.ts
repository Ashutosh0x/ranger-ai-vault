// ═══════════════════════════════════════════════════════
// Runtime Variables — Fill after deployment
// I1: Input validation for critical configuration values
// I7: Fee configuration is env-driven and consistent with keeper/src/config.ts
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
// H6/M1: Cluster-aware RPC fallback with warning
function resolveVaultRpcUrl(): string {
  const url = process.env.HELIUS_RPC_URL;
  if (!url) {
    const cluster = process.env.SOLANA_CLUSTER || "devnet";
    const fallback = cluster === "mainnet-beta"
      ? "https://api.mainnet-beta.solana.com"
      : "https://api.devnet.solana.com";
    console.warn(
      `[WARN] HELIUS_RPC_URL not set — using public RPC: ${fallback}. ` +
      `Not suitable for production.`,
    );
    return fallback;
  }
  return url;
}
export const RPC_URL = resolveVaultRpcUrl();

// ═══ CLUSTER ═══
export const CLUSTER = process.env.SOLANA_CLUSTER || "devnet";

// ═══ VAULT (fill after admin-init-vault.ts) ═══
export const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "";
export const KAMINO_STRATEGY_ADDRESS =
  process.env.KAMINO_STRATEGY_ADDRESS || "";
export const ZETA_LEND_STRATEGY_ADDRESS =
  process.env.ZETA_LEND_STRATEGY_ADDRESS || "";
export const ZETA_PERPS_STRATEGY_ADDRESS =
  process.env.ZETA_PERPS_STRATEGY_ADDRESS || "";

// ═══ TOKEN MINTS ═══
export const ASSET_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC

// ═══ AMOUNTS (in raw token units — 6 decimals for USDC) ═══
export const DEPOSIT_AMOUNT = 1_000_000_000;        // 1000 USDC
export const KAMINO_ALLOCATION = 500_000_000;        // 500 USDC (50%)
export const ZETA_LEND_ALLOCATION = 250_000_000;    // 250 USDC (25%)
export const ZETA_PERPS_ALLOCATION = 250_000_000;   // 250 USDC (25%)

// ═══ FEE CONFIG ═══
// I7: Driven by environment variables, consistent with keeper/src/config.ts
export const PERFORMANCE_FEE_BPS = parseInt(process.env.PERFORMANCE_FEE_BPS || "1000", 10);  // 10%
export const MANAGEMENT_FEE_BPS = parseInt(process.env.MANAGEMENT_FEE_BPS || "200", 10);    // 2%

// ═══ I1: INPUT VALIDATION ═══
export function validateVaultConfig(): void {
  if (!VAULT_ADDRESS) {
    throw new Error(
      "VAULT_ADDRESS is not set. Run admin-init-vault.ts first, then set VAULT_ADDRESS in your .env file.",
    );
  }

  // Validate it's a valid base58 public key
  try {
    const { PublicKey } = require("@solana/web3.js");
    new PublicKey(VAULT_ADDRESS);
  } catch {
    throw new Error(`VAULT_ADDRESS '${VAULT_ADDRESS}' is not a valid Solana public key.`);
  }

  // Validate fee ranges
  if (PERFORMANCE_FEE_BPS < 0 || PERFORMANCE_FEE_BPS > 10000) {
    throw new Error(`PERFORMANCE_FEE_BPS (${PERFORMANCE_FEE_BPS}) must be between 0 and 10000.`);
  }
  if (MANAGEMENT_FEE_BPS < 0 || MANAGEMENT_FEE_BPS > 10000) {
    throw new Error(`MANAGEMENT_FEE_BPS (${MANAGEMENT_FEE_BPS}) must be between 0 and 10000.`);
  }
}

export function validateStrategyAddress(name: string, address: string): void {
  if (!address) {
    throw new Error(`Strategy address for '${name}' is not set. Set it in your .env file.`);
  }
  try {
    const { PublicKey } = require("@solana/web3.js");
    new PublicKey(address);
  } catch {
    throw new Error(`Strategy address for '${name}' ('${address}') is not a valid Solana public key.`);
  }
}
