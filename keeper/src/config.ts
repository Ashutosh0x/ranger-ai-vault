// ═══════════════════════════════════════════════════════
// Keeper Config — Risk params, execution params, thresholds
// ═══════════════════════════════════════════════════════

import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

export const RISK_PARAMS = {
  maxDailyDrawdown: 0.03,
  maxMonthlyDrawdown: 0.08,
  maxLeverage: 2.0,
  maxNetDelta: 0.1,
  stopLossPerTrade: -0.005,
  takeProfitPerTrade: 0.015,
  maxConcurrentPositions: 3,
  kellyFraction: 0.25,
  minHealthRate: 1.5,
};

export const EXECUTION_PARAMS = {
  cronInterval: "*/15 * * * *",
  signalServerUrl: process.env.SIGNAL_SERVER_URL || "http://localhost:8080",
  keeperSecret: process.env.KEEPER_SECRET || "",
  assets: ["SOL-PERP", "BTC-PERP", "ETH-PERP"] as const,
  floorAllocationPct: 0.5,
  activeAllocationPct: 0.5,
  minRebalanceUsdc: 10_000_000, // $10 in 6 decimals
};

export const SIGNAL_THRESHOLDS = {
  longEntry: 0.6,
  shortEntry: -0.6,
  closeThreshold: 0.15,
  minConfidence: 0.3,
};

export const VAULT_CONFIG = {
  rpcUrl: process.env.HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com",
  vaultAddress: process.env.VAULT_ADDRESS || "",
  managerKeypairPath: process.env.MANAGER_KEYPAIR_PATH || "../vault/keys/manager.json",
  agentKeypairPath: process.env.AGENT_KEYPAIR_PATH || "./keys/agent.json",
  usdcMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  rewardTokenMint: "",
  strategies: [
    {
      name: "kamino-lending",
      address: process.env.KAMINO_STRATEGY_ADDRESS || "",
      defaultPct: 0.5,
    },
    {
      name: "drift-lend",
      address: process.env.DRIFT_LEND_STRATEGY_ADDRESS || "",
      defaultPct: 0.25,
    },
    {
      name: "drift-perps",
      address: process.env.DRIFT_PERPS_STRATEGY_ADDRESS || "",
      defaultPct: 0.25,
    },
  ],
};
