// ═══════════════════════════════════════════════════════
// Keeper Config — Risk params, execution params, thresholds
// ═══════════════════════════════════════════════════════

import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

// ═══ RPC URL RESOLUTION ═══
// HELIUS_RPC_URL is the primary, production-grade endpoint.
// Fallback to public devnet endpoint for local development ONLY.
// WARNING: The public endpoint is rate-limited and NOT suitable for production.
function resolveRpcUrl(): string {
  const url = process.env.HELIUS_RPC_URL;
  if (!url) {
    const fallback = process.env.SOLANA_CLUSTER === "mainnet-beta"
      ? "https://api.mainnet-beta.solana.com"
      : "https://api.devnet.solana.com";
    console.warn(
      `[WARN] HELIUS_RPC_URL not set — using public RPC fallback: ${fallback}. ` +
      `This is rate-limited and NOT suitable for production. ` +
      `Set HELIUS_RPC_URL in your .env file.`,
    );
    return fallback;
  }
  return url;
}

// ═══ ZETA / DRIFT ENV RESOLUTION ═══
// Centralized env resolution for Zeta SDK and Drift SDK.
// Avoids scattered hardcoded "mainnet-beta" / "devnet" strings.
function resolveClusterEnv(): "devnet" | "mainnet-beta" {
  const env = process.env.SOLANA_CLUSTER || process.env.ZETA_ENV || "devnet";
  if (env !== "devnet" && env !== "mainnet-beta") {
    console.warn(
      `[WARN] Invalid SOLANA_CLUSTER/ZETA_ENV value '${env}'. Defaulting to 'devnet'.`,
    );
    return "devnet";
  }
  return env;
}

export const RISK_PARAMS = {
  maxDailyDrawdown: parseFloat(process.env.MAX_DAILY_DRAWDOWN || "0.03"),
  maxMonthlyDrawdown: parseFloat(process.env.MAX_MONTHLY_DRAWDOWN || "0.08"),
  maxLeverage: parseFloat(process.env.MAX_LEVERAGE || "2.0"),
  maxNetDelta: parseFloat(process.env.MAX_NET_DELTA || "0.1"),
  stopLossPerTrade: parseFloat(process.env.STOP_LOSS_PER_TRADE || "-0.005"),
  takeProfitPerTrade: parseFloat(process.env.TAKE_PROFIT_PER_TRADE || "0.015"),
  maxConcurrentPositions: parseInt(process.env.MAX_CONCURRENT_POSITIONS || "3", 10),
  kellyFraction: parseFloat(process.env.KELLY_FRACTION || "0.25"),
  minHealthRate: parseFloat(process.env.MIN_HEALTH_RATE || "1.5"),
};

export const EXECUTION_PARAMS = {
  cronInterval: "*/15 * * * *",
  signalServerUrl: process.env.SIGNAL_SERVER_URL || "http://localhost:8080",
  signalServerPort: parseInt(process.env.SIGNAL_SERVER_PORT || "8080", 10),
  keeperSecret: process.env.KEEPER_SECRET || "",
  assets: ["SOL-PERP", "BTC-PERP", "ETH-PERP"] as const,
  floorAllocationPct: 0.5,
  activeAllocationPct: 0.5,
  minRebalanceUsdc: 10_000_000, // $10 in 6 decimals
  dryRun: process.env.DRY_RUN === "true",
};

// Exported cluster env for use by Zeta/Drift executors
export const CLUSTER_ENV = resolveClusterEnv();

export const SIGNAL_THRESHOLDS = {
  longEntry: 0.6,
  shortEntry: -0.6,
  closeThreshold: 0.15,
  minConfidence: 0.3,
};

export const VAULT_CONFIG = {
  rpcUrl: resolveRpcUrl(),
  vaultAddress: process.env.VAULT_ADDRESS || "",
  managerKeypairPath: process.env.MANAGER_KEYPAIR_PATH || "../vault/keys/manager.json",
  agentKeypairPath: process.env.AGENT_KEYPAIR_PATH || "./keys/agent.json",
  usdcMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  rewardTokenMint: process.env.REWARD_TOKEN_MINT || "",
  // Fee configuration — canonical source of truth for keeper.
  // Vault scripts use matching values in vault/src/variables.ts.
  performanceFeeBps: parseInt(process.env.PERFORMANCE_FEE_BPS || "1000", 10),  // 10%
  managementFeeBps: parseInt(process.env.MANAGEMENT_FEE_BPS || "200", 10),     // 2%
  strategies: [
    {
      name: "kamino-lending",
      address: process.env.KAMINO_STRATEGY_ADDRESS || "",
      defaultPct: 0.5,
    },
    {
      // NOTE: Zeta Lend is a planned strategy. The rebalance engine currently only
      // handles kamino-lending and zeta-perps. When Zeta Lend is integrated,
      // add handling in rebalance-engine.ts rebalanceFromSignal().
      name: "zeta-lend",
      address: process.env.ZETA_LEND_STRATEGY_ADDRESS || "",
      defaultPct: 0.25,
    },
    {
      name: "zeta-perps",
      address: process.env.ZETA_PERPS_STRATEGY_ADDRESS || "",
      defaultPct: 0.25,
    },
  ],
};
