// ═══════════════════════════════════════════════════════
// Drift Protocol Constants
// ═══════════════════════════════════════════════════════

import { PublicKey } from "@solana/web3.js";

// Drift Adaptor Program ID (used by Ranger/Voltr)
export const DRIFT_ADAPTOR_PROGRAM_ID = new PublicKey(
  "EBN93eXs5fHGBABuajQqdsKRkCgaqtJa8vEFD6vKXiP"
);

// Drift Protocol V2 Program
export const DRIFT_PROGRAM_ID = new PublicKey(
  "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
);

// Drift State Account
export const DRIFT_STATE = new PublicKey(
  "FExhvPycCCwYnZGeDsVtLhpEQ3yEkVY4jGLaFczi3nDQ"
);

// Market Indexes (Drift Perp Markets)
export const DRIFT_MARKET_INDEXES = {
  "SOL-PERP": 0,
  "BTC-PERP": 1,
  "ETH-PERP": 2,
} as const;

// Drift Spot Market Indexes
export const DRIFT_SPOT_MARKET_INDEXES = {
  USDC: 0,
  SOL: 1,
  BTC: 3,
  ETH: 4,
} as const;

// Drift API endpoints
export const DRIFT_API_BASE = "https://data.api.drift.trade";
export const DRIFT_MAINNET_API = "https://mainnet-beta.api.drift.trade";

export type DriftMarket = keyof typeof DRIFT_MARKET_INDEXES;
