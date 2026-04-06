// ═══════════════════════════════════════════════════════
// TypeScript Interfaces & Types
// ═══════════════════════════════════════════════════════

import { PublicKey } from "@solana/web3.js";

// ═══ VAULT STATE ═══
export interface VaultState {
  address: PublicKey;
  admin: PublicKey;
  manager: PublicKey;
  assetMint: PublicKey;
  totalAssets: bigint;
  totalShares: bigint;
  idleAssets: bigint;
  performanceFeeBps: number;
  managementFeeBps: number;
  maxCap: bigint;
  highWaterMark: bigint;
  lastFeeCollection: number;
}

// ═══ STRATEGY ═══
export interface StrategyConfig {
  name: string;
  address: string;
  adaptorProgramId: string;
  defaultAllocationPct: number;
  type: "kamino-lending" | "zeta-lend" | "zeta-perps";
}

export interface StrategyState {
  address: PublicKey;
  vault: PublicKey;
  adaptorProgram: PublicKey;
  currentAssets: bigint;
  lastRefresh: number;
}

// ═══ SIGNAL ═══
export interface SignalOutput {
  asset: string;
  signal: number;           // -1 to 1
  confidence: number;       // 0 to 1
  momentum_component: number;
  meanrev_component: number;
  features: Record<string, number>;
  timestamp: number;
}

// ═══ RISK ═══
export interface RiskState {
  var_95_1d: number;
  daily_drawdown_pct: number;
  monthly_drawdown_pct: number;
  net_delta: number;
  breach: boolean;
  timestamp: number;
}

// ═══ POSITION ═══
export interface Position {
  asset: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  leverage: number;
  timestamp: number;
}

// ═══ TRADE ═══
export interface TradeInstruction {
  asset: string;
  side: "long" | "short" | "close";
  size: number;
  price: number;
  signal: number;
  confidence: number;
  attestationSignature?: string;
}

// ═══ VAULT ALLOCATION ═══
export interface VaultAllocation {
  kaminoLending: bigint;
  zetaLend: bigint;
  zetaPerps: bigint;
  idle: bigint;
  total: bigint;
}

// ═══ PERFORMANCE ═══
export interface PerformanceMetrics {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  avgTradeReturn: number;
  apy: number;
  fundingCollected: number;
}
