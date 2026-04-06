// ═══════════════════════════════════════════════════════
// Keeper Types
// ═══════════════════════════════════════════════════════

export interface SignalResponse {
  asset: string;
  signal: number;
  confidence: number;
  momentum_component: number;
  meanrev_component: number;
  regime: string;
  features: Record<string, number>;
  timestamp: number;
}

export interface RiskResponse {
  var_95_1d: number;
  daily_drawdown_pct: number;
  monthly_drawdown_pct: number;
  net_delta: number;
  breach: boolean;
  drawdown_reduction_factor: number;
  timestamp: number;
}

export interface Position {
  asset: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  leverage: number;
  entryTimestamp: number;
  attestationSig?: string;
}

export interface TradeAction {
  type: "open_long" | "open_short" | "close" | "reduce" | "none";
  asset: string;
  size: number;
  signal: number;
  confidence: number;
  reason: string;
}

export interface KeeperState {
  positions: Position[];
  lastRebalanceTimestamp: number;
  dailyPnl: number;
  monthlyPnl: number;
  totalTrades: number;
  isRunning: boolean;
}

export interface VaultAllocation {
  kaminoLending: number;
  zetaPerps: number;
  idle: number;
  total: number;
}
