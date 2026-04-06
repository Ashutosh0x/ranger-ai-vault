// ═══════════════════════════════════════════════════════
// Zeta Markets Constants
// ═══════════════════════════════════════════════════════

import { PublicKey } from "@solana/web3.js";

// Zeta Adaptor Program ID (used by Ranger/Voltr)
export const ZETA_ADAPTOR_PROGRAM_ID = new PublicKey(
  "EBN93eXs5fHGBABuajQqdsKRkCgaqtJa8vEFD6vKXiP"
);

// Zeta Markets V2 Program
export const ZETA_PROGRAM_ID = new PublicKey(
  "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
);

// Zeta State Account
export const ZETA_STATE = new PublicKey(
  "FExhvPycCCwYnZGeDsVtLhpEQ3yEkVY4jGLaFczi3nDQ"
);

// Market Indexes (Zeta Perp Markets)
export const ZETA_MARKET_INDEXES = {
  "SOL-PERP": 0,
  "BTC-PERP": 1,
  "ETH-PERP": 2,
} as const;

// Zeta Spot Market Indexes
export const ZETA_SPOT_MARKET_INDEXES = {
  USDC: 0,
  SOL: 1,
  BTC: 3,
  ETH: 4,
} as const;

// Zeta API endpoints
export const ZETA_API_BASE = "https://data.api.zeta.markets";
export const ZETA_MAINNET_API = "https://mainnet-beta.api.zeta.markets";

export type ZetaMarket = keyof typeof ZETA_MARKET_INDEXES;
